import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Calendar, Video, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ExpertBookingsPage() {
    const supabase = await createClient();

    // Get current user (Expert)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Fetch bookings for this expert
    // Schema: bookings -> user:profiles (customer info)
    // bookings -> service:services

    // Note: 'user_id' in bookings points to profiles(id)
    // We join 'user:profiles!user_id(*)' or similar syntax if needed, checking schema again.
    // Bookings has 'user_id'. Relations are usually auto-detected if FK exists.
    // 'user_id' refs profiles(id).

    const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
            *,
            service:services ( title, type, price ),
            user:profiles ( full_name, email, avatar_url )
        `)
        .eq('expert_id', user.id) // expert_id is same as auth uid for experts
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching bookings:", error);
        return <div>Error cargando reservas.</div>;
    }

    const bookings = bookingsData || [];

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mis Reservas</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <Button variant="primary" size="sm" style={{ borderRadius: '2rem' }}>Todas</Button>
                {/* Future: Implement filtering */}
            </div>

            {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'rgb(var(--text-secondary))' }}>
                    No tienes reservas aún.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {bookings.map(booking => {
                        const customerName = booking.user?.full_name || booking.user?.email || 'Cliente';
                        const serviceTitle = booking.service?.title || 'Servicio';
                        const serviceType = booking.service?.type || 'Virtual';
                        // Use booking price if stored, or service price
                        const price = booking.price || booking.service?.price || 0;
                        const status = booking.status || 'pending';

                        return (
                            <div key={booking.id} style={{
                                background: 'rgb(var(--surface))',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgb(var(--border))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '50px', height: '50px', borderRadius: '50%', background: 'rgb(var(--surface-hover))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600,
                                        overflow: 'hidden'
                                    }}>
                                        {booking.user?.avatar_url ? (
                                            <img src={booking.user.avatar_url} alt={customerName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            customerName.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{customerName}</div>
                                        <div style={{ fontSize: '0.9rem', color: 'rgb(var(--primary))', fontWeight: 500, margin: '0.2rem 0' }}>
                                            {serviceTitle} • <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', background: 'rgba(var(--primary), 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{serviceType}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Calendar size={14} /> {booking.date}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <Clock size={14} /> {booking.time}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>${price}</div>

                                    {(status === 'confirmed' || status === 'pending') && (
                                        booking.meeting_url ? (
                                            (() => {
                                                const getMeetingDateTime = () => {
                                                    try {
                                                        return new Date(`${booking.date} ${booking.time}`);
                                                    } catch (e) { return null; }
                                                };
                                                const meetingDate = getMeetingDateTime();
                                                const now = new Date();
                                                const isJoinable = meetingDate ? (now.getTime() >= meetingDate.getTime() - 60 * 60 * 1000) : false;

                                                if (isJoinable) {
                                                    return (
                                                        <Link href={`/call?roomUrl=${encodeURIComponent(booking.meeting_url)}&userName=${encodeURIComponent(user.email || 'Experto')}&bookingId=${booking.id}`} target="_blank">
                                                            <Button style={{ gap: '0.5rem' }}>
                                                                <Video size={18} />
                                                                Entrar
                                                            </Button>
                                                        </Link>
                                                    );
                                                } else {
                                                    return (
                                                        <div style={{ textAlign: 'center' }}>
                                                            <Button disabled style={{ gap: '0.5rem', opacity: 0.6 }}>
                                                                <Video size={18} />
                                                                Entrar
                                                            </Button>
                                                            <div style={{ fontSize: '0.7rem', color: 'rgb(var(--text-secondary))', marginTop: '0.1rem' }}>
                                                                Habilitado 1h antes
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })()
                                        ) : (
                                            <span style={{ fontSize: '0.9rem', color: 'rgb(var(--text-muted))' }}>Sin Sala</span>
                                        )
                                    )}

                                    {status === 'completed' && (
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))',
                                            fontSize: '0.875rem', fontWeight: 500
                                        }}>
                                            Completada
                                        </span>
                                    )}
                                    {status === 'cancelled' && (
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))',
                                            fontSize: '0.875rem', fontWeight: 500
                                        }}>
                                            Cancelada
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
