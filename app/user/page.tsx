import { Button } from '@/components/ui/Button/Button';
import { Calendar, Clock, Video, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

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

    const { data: upcomingList } = await supabase
        .from('bookings')
        .select(`
            *,
            services ( title, duration ),
            experts (
                id,
                profiles ( full_name )
            )
        `)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(10);

    const now = new Date().getTime();
    const nextSession = (upcomingList || []).find(b => {
        const ds = String(b?.date || '');
        const ts = String(b?.time || '00:00');
        const iso = `${ds}T${ts}`;
        const t = Number(new Date(iso).getTime());
        return !Number.isNaN(t) && t >= now;
    });

    const { data: historyList } = await supabase
        .from('bookings')
        .select(`
            *,
            services ( title )
        `)
        .eq('user_id', user.id)
        .in('status', ['confirmed','completed'])
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(20);

    const pastBookings = (historyList || [])
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
                        ? 'Bienvenida de nuevo. Tienes una sesión programada pronto.'
                        : 'Bienvenida de nuevo. No tienes sesiones próximas.'}
                </p>
            </div>

            {/* Next Appointment Card - Hero like */}
            {nextSession ? (
                <section style={{
                    background: 'linear-gradient(135deg, rgb(var(--primary)) 0%, #ff6b6b 100%)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '2rem',
                    color: 'white',
                    marginBottom: '3rem',
                    boxShadow: '0 10px 30px rgba(var(--primary), 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem',
                            borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem'
                        }}>
                            <Calendar size={16} /> Próxima Sesión
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                            {nextSession.services?.title || 'Sesión Reservada'}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', fontSize: '1.1rem', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={20} /> {new Date(nextSession.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}, {nextSession.time}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Con <strong>{nextSession.experts?.profiles?.full_name || 'Experto'}</strong>
                            </span>
                        </div>
                        <Link href="/user/bookings">
                            <Button style={{
                                background: 'white', color: 'rgb(var(--primary))', border: 'none',
                                fontWeight: 600, padding: '0.75rem 2rem', fontSize: '1rem'
                            }}>
                                <Video size={20} style={{ marginRight: '0.5rem' }} /> Ver Detalles
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
                <div style={{
                    background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))', transition: 'all 0.2s', cursor: 'pointer'
                }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: 'rgba(var(--secondary), 0.1)', color: 'rgb(var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                    }}>
                        <Search size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Explorar Expertos</h3>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Encuentra profesionales en moda, tecnología, hogar y más.
                    </p>
                    <Link href="/experts">
                        <Button variant="outline" style={{ width: '100%', justifyContent: 'space-between' }}>
                            Ver Catálogo <ChevronRight size={16} />
                        </Button>
                    </Link>
                </div>

                {/* Previous Bookings */}
                <div style={{
                    background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Historial Reciente</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {pastBookings && pastBookings.length > 0 ? (
                            pastBookings.map((booking: { id: string; date: string; services?: { title?: string } }) => (
                                <div key={booking.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))'
                                }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{booking.services?.title || 'Servicio'}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                            {new Date(booking.date).toLocaleDateString()} • Completado
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', padding: '1rem 0' }}>
                                Aún no has completado ninguna sesión.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
