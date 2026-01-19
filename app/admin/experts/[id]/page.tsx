import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowLeft, Star, DollarSign, Calendar, Clock, Video, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

export default async function AdminExpertDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Expert Details (joined with profile)
    // 1. Fetch Expert Details (joined with profile)
    const { data: expert, error: expertError } = await supabase
        .from('experts')
        .select(`
            *,
            profiles (
                full_name,
                email,
                avatar_url
            )
        `)
        .eq('id', id)
        .single();

    if (expertError || !expert) {
        return (
            <div className="p-8">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    <h3 className="font-bold">Error</h3>
                    <p>Experto no encontrado: {id}</p>
                    {expertError && <p className="text-sm mt-2">{expertError.message} ({expertError.code})</p>}
                </div>
            </div>
        );
    }

    const { profiles: profile } = expert;

    // 2. Fetch Services
    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('expert_id', id)
        .eq('status', 'active'); // Show only active? or detailed list. Let's show active + non-deleted for admin maybe? Just actives for now as per UI.

    // 3. Fetch Bookings History
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            *,
            profiles!user_id ( full_name ),
            services!service_id ( title )
        `)
        .eq('expert_id', id)
        .order('date', { ascending: false })
        .limit(10); // Last 10 sessions

    // 4. Calculate Stats
    // Total Earnings (completed bookings) - We might need a separate query for ALL time earnings if we limit bookings above.
    const { data: allMetrics } = await supabase
        .from('bookings')
        .select('price, status')
        .eq('expert_id', id);

    const totalEarnings = allMetrics
        ?.filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;

    const totalSessions = allMetrics?.filter(b => b.status === 'completed').length || 0;

    // Format Dates
    // Format Dates
    const joinedDate = new Date(expert.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/experts" style={{ display: 'inline-flex', alignItems: 'center', color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver al listado
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 700, overflow: 'hidden'
                        }}>
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                profile.full_name?.charAt(0) || 'E'
                            )}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{profile.full_name}</h1>
                            <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                <span>{profile.email}</span>
                                <span>•</span>
                                <span>{expert.title || 'Sin título'}</span>
                            </div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px',
                                    border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))'
                                }}>
                                    ID: {id.split('-')[0]}...
                                </span>
                                <span style={{
                                    fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px',
                                    background: expert.verified ? 'rgba(var(--success), 0.1)' : 'rgba(var(--warning), 0.1)',
                                    color: expert.verified ? 'rgb(var(--success))' : 'rgb(var(--warning))',
                                    fontWeight: 600
                                }}>
                                    {expert.verified ? 'Verificado' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline">Contactar</Button>
                        <Button style={{ background: 'rgb(var(--text-main))', color: 'rgb(var(--surface))' }}>Editar Perfil</Button>
                    </div>
                </div>
            </div>

            {/* KPIs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Ingresos Totales</span>
                        <DollarSign size={18} color="rgb(var(--success))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>${totalEarnings.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Calificación</span>
                        <Star size={18} fill="orange" color="orange" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{expert.rating || 'N/A'} <span style={{ fontSize: '0.9rem', color: 'rgb(var(--text-muted))', fontWeight: 400 }}>({expert.reviews_count || 0})</span></div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Sesiones</span>
                        <Video size={18} color="rgb(var(--primary))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{totalSessions}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Antigüedad</span>
                        <Calendar size={18} color="rgb(var(--text-muted))" />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem' }}>{joinedDate}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                {/* Services Section */}
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={18} /> Servicios Ofrecidos
                        </h3>
                        <span style={{ background: 'rgb(var(--surface-hover))', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                            {services?.length || 0} Activos
                        </span>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        {services && services.length > 0 ? (
                            services.map((service: any) => (
                                <div key={service.id} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '1rem', borderBottom: '1px solid rgb(var(--border))',
                                    marginBottom: '0.5rem'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{service.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {service.duration} min</span>
                                            <span>${service.price}</span>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px',
                                        background: 'rgba(var(--success), 0.1)',
                                        color: 'rgb(var(--success))'
                                    }}>
                                        Activo
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>No hay servicios activos.</div>
                        )}
                    </div>
                </div>

                {/* History Section */}
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} /> Últimas Sesiones
                        </h3>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <tbody>
                                {bookings && bookings.length > 0 ? (
                                    bookings.map((session: any) => (
                                        <tr key={session.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{session.profiles?.full_name || 'Usuario'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{session.services?.title || 'Servicio'}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <div style={{ fontWeight: 600 }}>${session.price}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>{new Date(session.date).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                {session.status === 'completed' ?
                                                    <CheckCircle size={16} color="rgb(var(--success))" /> :
                                                    <AlertCircle size={16} color="rgb(var(--warning))" />
                                                }
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '1rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>Sin reservas recientes.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
