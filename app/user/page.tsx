import { Button } from '@/components/ui/Button/Button';
import { Calendar, Clock, Video, Search, ChevronRight, TrendingUp, CheckCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileCompletionAlert from '@/components/ProfileCompletionAlert';
import { calculateUserProfileCompletion } from '@/utils/profileCompletion';

// Format date to readable format: "Lun 10 Feb 2026"
const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dayNames[date.getDay()]} ${day} ${monthNames[month - 1]} ${year}`;
};

export default async function UserDashboard() {
    const supabase = await createClient();

    // 1. Get Auth User
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    // 2. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const userName = profile?.full_name?.split(' ')[0] || 'Usuario';

    // 3. Calculate profile completion
    const profileCompletion = calculateUserProfileCompletion({
        avatar_url: profile?.avatar_url,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        phone: profile?.phone,
        city: profile?.city,
        country: profile?.country,
        timezone: profile?.timezone,
    });

    // 4. Calculate statistics
    const { data: allBookings } = await supabase
        .from('bookings')
        .select('id, status, price, currency')
        .eq('user_id', user.id);

    const totalBookings = allBookings?.length || 0;
    const completedBookings = allBookings?.filter(b => b.status === 'completed').length || 0;
    const upcomingCount = allBookings?.filter(b => b.status === 'confirmed' || b.status === 'pending').length || 0;

    // 5. Fetch upcoming bookings (no JOINs to avoid RLS issues)
    const { data: upcomingBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(10);

    const upcomingList = upcomingBookings || [];

    // 6. Fetch related services and experts separately
    const serviceIds = [...new Set(upcomingList.map(b => b.service_id).filter(Boolean))];
    const expertIds = [...new Set(upcomingList.map(b => b.expert_id).filter(Boolean))];

    let servicesMap: Record<string, { title?: string; duration?: number }> = {};
    let expertsMap: Record<string, { full_name?: string }> = {};

    if (serviceIds.length > 0) {
        const { data: services } = await supabase
            .from('services')
            .select('id, title, duration')
            .in('id', serviceIds);
        (services || []).forEach((s: any) => {
            servicesMap[s.id] = { title: s.title, duration: s.duration };
        });
    }

    if (expertIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', expertIds);
        (profiles || []).forEach((p: any) => {
            expertsMap[p.id] = { full_name: p.full_name };
        });
    }

    // 7. Build enriched upcoming list
    const enrichedUpcoming = upcomingList.map(b => ({
        ...b,
        services: servicesMap[b.service_id] || null,
        experts: { profiles: expertsMap[b.expert_id] || null }
    }));

    const now = new Date().getTime();
    const nextSession = enrichedUpcoming.find(b => {
        const ds = String(b?.date || '');
        const ts = String(b?.time || '00:00');
        const iso = `${ds}T${ts}`;
        const t = Number(new Date(iso).getTime());
        return !Number.isNaN(t) && t >= now;
    });

    // 8. Fetch history bookings (no JOINs)
    const { data: historyBookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(20);

    const historyList = historyBookings || [];

    // 9. Fetch services for history
    const historyServiceIds = [...new Set(historyList.map(b => b.service_id).filter(Boolean))];
    let historyServicesMap: Record<string, { title?: string }> = {};

    if (historyServiceIds.length > 0) {
        const { data: historyServices } = await supabase
            .from('services')
            .select('id, title')
            .in('id', historyServiceIds);
        (historyServices || []).forEach((s: any) => {
            historyServicesMap[s.id] = { title: s.title };
        });
    }

    // 10. Build enriched history and filter past bookings
    const enrichedHistory = historyList.map(b => ({
        ...b,
        services: historyServicesMap[b.service_id] || null
    }));

    const pastBookings = enrichedHistory
        .filter(b => {
            const ds = String(b?.date || '');
            const ts = String(b?.time || '00:00');
            const iso = `${ds}T${ts}`;
            const t = Number(new Date(iso).getTime());
            return !Number.isNaN(t) && t < now;
        })
        .sort((a, b) => {
            const ta = Number(new Date(`${String(a?.date || '')}T${String(a?.time || '00:00')}`).getTime());
            const tb = Number(new Date(`${String(b?.date || '')}T${String(b?.time || '00:00')}`).getTime());
            return tb - ta;
        })
        .slice(0, 3);

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Hola, {userName} 👋</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>
                    {nextSession
                        ? 'Te damos la bienvenida de nuevo. Tienes una sesión programada pronto.'
                        : 'Te damos la bienvenida de nuevo. No tienes sesiones próximas.'}
                </p>
            </div>

            {/* Profile Completion Alert */}
            <ProfileCompletionAlert
                percentage={profileCompletion.percentage}
                missingFields={profileCompletion.missingFields}
                profileUrl="/user/profile"
                userType="user"
            />

            {/* Statistics Dashboard */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(var(--primary), 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <BarChart3 size={24} style={{ color: 'rgb(var(--primary))' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'rgb(var(--text-main))' }}>
                            {totalBookings}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                            Total Reservas
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(var(--success), 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <CheckCircle size={24} style={{ color: 'rgb(var(--success))' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'rgb(var(--text-main))' }}>
                            {completedBookings}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                            Completadas
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: 'rgba(var(--secondary), 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <TrendingUp size={24} style={{ color: 'rgb(var(--secondary))' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'rgb(var(--text-main))' }}>
                            {upcomingCount}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                            Próximas
                        </div>
                    </div>
                </div>
            </div>

            {/* Next Appointment Card - Hero like */}
            {nextSession ? (
                <section style={{
                    background: 'linear-gradient(135deg, rgb(var(--primary)) 0%, rgb(var(--secondary)) 100%)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    color: 'white',
                    marginBottom: '3rem',
                    boxShadow: '0 10px 30px rgba(var(--primary), 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <style>{`
                        @media (min-width: 768px) {
                            .hero-card {
                                padding: 2rem !important;
                            }
                            .hero-title {
                                font-size: 2rem !important;
                            }
                            .hero-details {
                                font-size: 1.1rem !important;
                            }
                        }
                    `}</style>
                    <div className="hero-card" style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem',
                            borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem'
                        }}>
                            <Calendar size={16} /> Próxima Sesión
                        </div>
                        <h2 className="hero-title" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {nextSession.services?.title || 'Sesión Reservada'}
                        </h2>
                        <div className="hero-details" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={18} /> {formatDate(nextSession.date)}, {nextSession.time}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Con <strong>{nextSession.experts?.profiles?.full_name || 'Experto'}</strong>
                            </span>
                        </div>
                        <Link href="/user/bookings">
                            <Button style={{
                                background: 'white', color: 'rgb(var(--primary))', border: 'none',
                                fontWeight: 600, padding: '0.75rem 1.5rem', fontSize: '0.95rem'
                            }}>
                                <Video size={18} style={{ marginRight: '0.5rem' }} /> Ver Detalles
                            </Button>
                        </Link>
                    </div>
                </section>
            ) : (
                <section style={{
                    background: 'rgb(var(--surface))',
                    borderRadius: 'var(--radius-lg)',
                    padding: '3rem 2rem',
                    border: '1px solid rgb(var(--border))',
                    marginBottom: '3rem',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center'
                }}>
                    <div style={{
                        width: '60px', height: '60px', borderRadius: '50%', background: 'rgb(var(--surface-hover))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                    }}>
                        <Calendar size={30} color='rgb(var(--text-secondary))' />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sin Sesiones Próximas</h2>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', maxWidth: '400px' }}>
                        No tienes reservas confirmadas para los próximos días. ¡Explora nuestros expertos y agenda tu primera cita!
                    </p>
                    <Link href="/experts">
                        <Button>Explorar Expertos</Button>
                    </Link>
                </section>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Find Expert */}
                <Link href="/experts" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '2rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        height: '100%'
                    }}
                    className="card-hover">
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '50%',
                            background: 'rgba(var(--secondary), 0.1)',
                            color: 'rgb(var(--secondary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '1rem'
                        }}>
                            <Search size={24} />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'rgb(var(--text-main))' }}>
                            Explorar Expertos
                        </h3>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Encuentra profesionales en moda, tecnología, hogar y más.
                        </p>
                        <Button variant="outline" style={{ width: '100%', justifyContent: 'space-between', pointerEvents: 'none' }}>
                            Ver Catálogo <ChevronRight size={16} />
                        </Button>
                    </div>
                </Link>

                {/* Previous Bookings */}
                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '2rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem', color: 'rgb(var(--text-main))' }}>
                        Historial Reciente
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pastBookings && pastBookings.length > 0 ? (
                            pastBookings.map((booking: { id: string; date: string; services?: { title?: string } }) => (
                                <div key={booking.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    paddingBottom: '1rem',
                                    borderBottom: '1px solid rgb(var(--border))'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '8px',
                                        background: 'rgb(var(--surface-hover))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <Calendar size={18} style={{ color: 'rgb(var(--text-secondary))' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'rgb(var(--text-main))' }}>
                                            {booking.services?.title || 'Servicio'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                            {formatDate(booking.date)} • Completado
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{
                                textAlign: 'center',
                                padding: '2rem 1rem',
                                color: 'rgb(var(--text-secondary))'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'rgb(var(--surface-hover))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 0.75rem'
                                }}>
                                    <Calendar size={24} style={{ color: 'rgb(var(--text-muted))' }} />
                                </div>
                                <p style={{ fontSize: '0.9rem', margin: 0 }}>
                                    Aún no has completado ninguna sesión.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* My Recordings */}
                <div style={{
                    background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Mis Grabaciones</h3>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Revisa y reproduce tus sesiones grabadas.
                    </p>
                    <Link href="/user/recordings">
                        <Button variant="outline" style={{ width: '100%', justifyContent: 'space-between' }}>
                            Ir a Mis Grabaciones <ChevronRight size={16} />
                        </Button>
                    </Link>
                </div>

            </div>
        </div>
    );
}
