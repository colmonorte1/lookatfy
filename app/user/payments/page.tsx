import { CreditCard, Download, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function UserPaymentsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    // Fetch bookings as "payments"
    // We assume any booking is a transaction.
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            *,
            services ( title ),
            experts (
                profiles ( full_name )
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const bookingIds = (bookings || []).map((b: { id: string }) => b.id);
    let refundedSet = new Set<string>();
    if (bookingIds.length) {
        const { data: ds } = await supabase
            .from('disputes')
            .select('booking_id, status')
            .in('booking_id', bookingIds)
            .eq('status', 'resolved_refunded');
        refundedSet = new Set(((ds || []) as { booking_id: string }[]).map(d => d.booking_id));
    }

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Historial de Pagos</h1>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden'
            }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                <th style={{ padding: '1rem' }}>Servicio / Experto</th>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Método</th>
                                <th style={{ padding: '1rem' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Monto</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Factura</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!bookings || bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                        No hay transacciones registradas.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking: {
                                    id: string;
                                    status: string;
                                    created_at: string;
                                    price?: number | string | null;
                                    services?: { title?: string };
                                    experts?: { profiles?: { full_name?: string } };
                                }) => {
                                    // Determine Status Label and Style
                                    let statusLabel = 'Pendiente';
                                    let statusStyle = { bg: 'rgba(var(--warning), 0.1)', color: 'rgb(var(--warning))' };

                                    const isRefunded = refundedSet.has(booking.id);
                                    if (isRefunded) {
                                        statusLabel = 'Devolución por disputa';
                                        statusStyle = { bg: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))' };
                                    } else if (booking.status === 'confirmed' || booking.status === 'completed') {
                                        statusLabel = 'Pagado';
                                        statusStyle = { bg: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))' };
                                    } else if (booking.status === 'cancelled') {
                                        statusLabel = 'Cancelado/Reembolsado';
                                        statusStyle = { bg: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))' };
                                    }

                                    return (
                                        <tr key={booking.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.95rem' }}>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ fontWeight: 600, color: 'rgb(var(--text-main))' }}>{booking.services?.title || 'Servicio'}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                                    {booking.experts?.profiles?.full_name || 'Experto'}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={14} /> {new Date(booking.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                                    <CreditCard size={16} color="rgb(var(--text-muted))" />
                                                    Tarjeta •••• 4242 {/* Mocked for now */}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    background: statusStyle.bg,
                                                    color: statusStyle.color,
                                                    padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600
                                                }}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
                                                {booking.price ? `$${Number(booking.price).toFixed(2)}` : '-'}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    style={{ color: 'rgb(var(--primary))' }}
                                                    disabled={booking.status === 'cancelled' || isRefunded}
                                                    title="Descargar Factura"
                                                >
                                                    <Download size={18} />
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
