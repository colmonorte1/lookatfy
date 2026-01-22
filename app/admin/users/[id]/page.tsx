import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Calendar, Video, PlayCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { notFound } from 'next/navigation';

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (profileError || !profile) {
        notFound();
    }

    // 2. Fetch Bookings (Join with Expert->Profile and Service)
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            *,
            expert:experts!expert_id(
                profile:profiles(full_name)
            ),
            service:services!service_id(title)
        `)
        .eq('user_id', id)
        .order('date', { ascending: false });

    // 3. Calculate KPIs
    const userBookings = bookings || [];
    const totalSpend = userBookings.reduce((sum, b) => {
        if (b.status === 'completed' || b.status === 'confirmed') {
            return sum + (Number(b.price) || 0);
        }
        return sum;
    }, 0);

    const sessionsAttended = userBookings.filter(b => b.status === 'completed').length;
    const upcomingSessions = userBookings.filter(b => b.status === 'confirmed').length;

    // Recordings placeholder (We don't have recordings table yet)
    const recordingsCount = 0;

    // Helper for formatting currency
    const formatMoney = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/users" style={{ display: 'inline-flex', alignItems: 'center', color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem' }}>
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
                                (profile.full_name || '?').charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{profile.full_name || 'Sin Nombre'}</h1>
                            <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                <span>{profile.email}</span>
                                <span>•</span>
                                <span>{profile.city ? `${profile.city}, ${profile.country || ''}` : 'Ubicación no disponible'}</span>
                            </div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px',
                                    border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))'
                                }}>
                                    ID: {id.slice(0, 8)}...
                                </span>
                                <span style={{
                                    fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px',
                                    background: 'rgba(var(--success), 0.1)',
                                    color: 'rgb(var(--success))',
                                    fontWeight: 600
                                }}>
                                    Activo
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Actions currently disabled/placeholder */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" disabled>Enviar Mensaje</Button>
                        <Button style={{ background: 'rgb(var(--text-main))', color: 'rgb(var(--surface))' }} disabled>Editar Usuario</Button>
                    </div>
                </div>
            </div>

            {/* KPIs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Gasto Total</span>
                        <CreditCard size={18} color="rgb(var(--primary))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{formatMoney(totalSpend)}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Sesiones Asistidas</span>
                        <Video size={18} color="rgb(var(--secondary))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{sessionsAttended}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Próximas</span>
                        <Calendar size={18} color="rgb(var(--warning))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{upcomingSessions}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Registrado</span>
                        <Calendar size={18} color="rgb(var(--text-muted))" />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem' }}>
                        {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Bookings/Services Section */}
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} /> Historial de Reservas
                        </h3>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {userBookings.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                No hay reservas registradas.
                            </div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <tbody>
                                    {userBookings.map((booking: { id: string; date?: string; time?: string; status: string; service?: { title?: string | null } | null; expert?: { profile?: { full_name?: string | null } | null } | null }) => (
                                        <tr key={booking.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600 }}>{booking.service?.title || 'Servicio Eliminado'}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>con {booking.expert?.profile?.full_name || 'Experto'}</div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontSize: '0.9rem' }}>{booking.date}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{booking.time}</div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right' }}>
                                                <span style={{
                                                    fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px',
                                                    background: booking.status === 'completed' ? 'rgba(var(--success), 0.1)' :
                                                        booking.status === 'confirmed' ? 'rgba(var(--success), 0.1)' :
                                                            booking.status === 'pending' ? 'rgba(var(--warning), 0.1)' :
                                                                'rgba(var(--error), 0.1)',
                                                    color: booking.status === 'completed' ? 'rgb(var(--success))' :
                                                        booking.status === 'confirmed' ? 'rgb(var(--success))' :
                                                            booking.status === 'pending' ? 'rgb(var(--warning))' :
                                                                'rgb(var(--error))',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Recordings Section (Placeholder for now) */}
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden', opacity: 0.5 }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <PlayCircle size={18} /> Grabaciones Disponibles
                        </h3>
                    </div>
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                        <p>No hay grabaciones disponibles por el momento.</p>
                        <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>(Funcionalidad pendiente de integración de almacenamiento)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
