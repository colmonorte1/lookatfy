import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Calendar, Clock } from 'lucide-react';
import ExpertBookingActions from '@/components/expert/ExpertBookingActions';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ExpertBookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab } = await searchParams;
    const supabase = await createClient();

    // Get current user (Expert)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Fetch bookings for this expert
    const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
            *,
            service:services ( title, type, price, duration ),
            user:profiles ( full_name, email, avatar_url )
        `)
        .eq('expert_id', user.id)
        .order('date', { ascending: true })
        .order('time', { ascending: true });

    // Fetch disputes to identify problematic bookings
    const { data: disputes } = await supabase
        .from('disputes')
        .select('booking_id, status')
        .in('status', ['open', 'under_review', 'resolved_refunded']);

    if (error) {
        console.error("Error fetching bookings:", error);
        return <div>Error cargando reservas.</div>;
    }

    const bookings = bookingsData || [];

    // Build sets of disputed and refunded booking IDs
    type DisputeRow = { booking_id: string; status: string };
    const disputedBookingIds = new Set(
        ((disputes || []) as DisputeRow[])
            .filter(d => d.status === 'open' || d.status === 'under_review')
            .map(d => d.booking_id)
    );
    const refundedBookingIds = new Set(
        ((disputes || []) as DisputeRow[])
            .filter(d => d.status === 'resolved_refunded')
            .map(d => d.booking_id)
    );

    // Current date for filtering
    const today = new Date().toISOString().split('T')[0];

    // Filter bookings by category
    const scheduled = bookings.filter(b =>
        (b.status === 'confirmed' || b.status === 'pending') &&
        b.date >= today &&
        !refundedBookingIds.has(b.id)
    );

    const finalized = bookings.filter(b =>
        b.status === 'completed' &&
        !refundedBookingIds.has(b.id)
    ).reverse(); // Reverse to show most recent first

    const problematic = bookings.filter(b =>
        b.status === 'cancelled' ||
        disputedBookingIds.has(b.id) ||
        refundedBookingIds.has(b.id)
    ).reverse(); // Reverse to show most recent first

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mis Reservas</h1>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div></div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`?tab=scheduled`}>
                        <Button variant={!tab || tab === 'scheduled' ? 'primary' : 'outline'} size="sm">
                            Programadas ({scheduled.length})
                        </Button>
                    </Link>
                    <Link href={`?tab=finalized`}>
                        <Button variant={tab === 'finalized' ? 'primary' : 'outline'} size="sm">
                            Finalizadas ({finalized.length})
                        </Button>
                    </Link>
                    <Link href={`?tab=problematic`}>
                        <Button variant={tab === 'problematic' ? 'primary' : 'outline'} size="sm">
                            Problemáticas ({problematic.length})
                        </Button>
                    </Link>
                </div>
            </div>

            {(() => {
                const currentBookings = tab === 'finalized' ? finalized : tab === 'problematic' ? problematic : scheduled;
                const emptyMessage = tab === 'finalized'
                    ? 'No tienes reservas finalizadas.'
                    : tab === 'problematic'
                    ? 'No tienes reservas problemáticas.'
                    : 'No tienes reservas programadas.';

                if (currentBookings.length === 0) {
                    return (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgb(var(--text-secondary))' }}>
                            {emptyMessage}
                        </div>
                    );
                }

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {currentBookings.map(booking => {
                        const customerName = booking.user?.full_name || booking.user?.email || 'Cliente';
                        const serviceTitle = booking.service?.title || 'Servicio';
                        const serviceType = booking.service?.type || 'Virtual';
                        const price = booking.price || booking.service?.price || 0;
                        const status = booking.status || 'pending';

                        const isDisputed = disputedBookingIds.has(booking.id);
                        const isRefunded = refundedBookingIds.has(booking.id);

                        return (
                            <div key={booking.id} style={{
                                background: 'rgb(var(--surface))',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: isDisputed ? '1px solid rgba(var(--warning), 0.5)' : isRefunded ? '1px solid rgba(var(--error), 0.5)' : '1px solid rgb(var(--border))',
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

                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>${price}</div>

                                    {(status === 'confirmed' || status === 'pending') && !isRefunded && !isDisputed && (
                                        <ExpertBookingActions
                                            bookingId={booking.id}
                                            status={status}
                                            meetingUrl={booking.meeting_url}
                                            date={booking.date}
                                            time={booking.time}
                                            duration={booking.service?.duration}
                                        />
                                    )}

                                    {status === 'completed' && !isRefunded && !isDisputed && (
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))',
                                            fontSize: '0.875rem', fontWeight: 500
                                        }}>
                                            Completada
                                        </span>
                                    )}

                                    {status === 'pending' && !isRefunded && !isDisputed && (
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: 'rgba(var(--primary), 0.1)', color: 'rgb(var(--primary))',
                                            fontSize: '0.875rem', fontWeight: 500
                                        }}>
                                            Pendiente
                                        </span>
                                    )}

                                    {status === 'cancelled' && !isRefunded && (
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))',
                                            fontSize: '0.875rem', fontWeight: 500
                                        }}>
                                            Cancelada
                                        </span>
                                    )}

                                    {isRefunded && (
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))',
                                            fontSize: '0.875rem', fontWeight: 600
                                        }}>
                                            Reembolsada
                                        </span>
                                    )}

                                    {isDisputed && !isRefunded && (
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: 'rgba(var(--warning), 0.1)', color: 'rgb(var(--warning))',
                                            fontSize: '0.875rem', fontWeight: 600
                                        }}>
                                            En disputa
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                );
            })()}
        </div>
    );
}
