import { CreditCard, Calendar, Banknote, Smartphone } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

// Format date to readable format
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

// Format currency
const formatAmount = (amount: number | null | undefined, currency: string = 'USD') => {
    if (!amount) return '-';
    if (currency === 'COP') {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
    }
    if (currency === 'EUR') {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

// Get payment method icon and label
const getPaymentMethodInfo = (method: string | null) => {
    switch (method?.toUpperCase()) {
        case 'PSE': return { icon: Banknote, label: 'PSE' };
        case 'NEQUI': return { icon: Smartphone, label: 'Nequi' };
        case 'DAVIPLATA': return { icon: Smartphone, label: 'Daviplata' };
        case 'CARD': return { icon: CreditCard, label: 'Tarjeta' };
        default: return { icon: CreditCard, label: method || 'Pago' };
    }
};

export default async function UserPaymentsPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    // 1. Fetch bookings without JOINs (RLS compatible)
    const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const bookings = bookingsData || [];
    const bookingIds = bookings.map(b => b.id);

    // 2. Fetch related data separately
    const serviceIds = [...new Set(bookings.map(b => b.service_id).filter(Boolean))];
    const expertIds = [...new Set(bookings.map(b => b.expert_id).filter(Boolean))];

    let servicesMap: Record<string, { title?: string }> = {};
    let expertsMap: Record<string, { full_name?: string }> = {};
    let transactionsMap: Record<string, { payment_method?: string; status?: string; wompi_status?: string }> = {};
    let refundedSet = new Set<string>();

    if (serviceIds.length > 0) {
        const { data: services } = await supabase
            .from('services')
            .select('id, title')
            .in('id', serviceIds);
        (services || []).forEach((s: any) => {
            servicesMap[s.id] = { title: s.title };
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

    if (bookingIds.length > 0) {
        // Fetch payment transactions
        const { data: transactions } = await supabase
            .from('payment_transactions')
            .select('wompi_reference, payment_method, status')
            .in('wompi_reference', bookingIds);
        (transactions || []).forEach((t: any) => {
            transactionsMap[t.wompi_reference] = {
                payment_method: t.payment_method,
                status: t.status,
                wompi_status: t.status
            };
        });

        // Fetch refunded disputes
        const { data: disputes } = await supabase
            .from('disputes')
            .select('booking_id, status')
            .in('booking_id', bookingIds)
            .eq('status', 'resolved_refunded');
        refundedSet = new Set((disputes || []).map((d: any) => d.booking_id));
    }

    // 3. Enrich bookings with related data
    const enrichedBookings = bookings.map(b => ({
        ...b,
        serviceTitle: servicesMap[b.service_id]?.title || 'Servicio',
        expertName: expertsMap[b.expert_id]?.full_name || 'Experto',
        transaction: transactionsMap[b.id] || null,
        isRefunded: refundedSet.has(b.id)
    }));

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
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
                        <thead>
                            <tr style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                <th style={{ padding: '1rem' }}>Servicio / Experto</th>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Método</th>
                                <th style={{ padding: '1rem' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrichedBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                        No hay transacciones registradas.
                                    </td>
                                </tr>
                            ) : (
                                enrichedBookings.map((booking) => {
                                    // Determine Status Label and Style
                                    let statusLabel = 'Pendiente';
                                    let statusStyle = { bg: 'rgba(var(--warning), 0.1)', color: 'rgb(var(--warning))' };

                                    if (booking.isRefunded) {
                                        statusLabel = 'Reembolsado';
                                        statusStyle = { bg: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))' };
                                    } else if (booking.status === 'confirmed' || booking.status === 'completed') {
                                        statusLabel = 'Pagado';
                                        statusStyle = { bg: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))' };
                                    } else if (booking.status === 'cancelled') {
                                        statusLabel = 'Cancelado';
                                        statusStyle = { bg: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))' };
                                    }

                                    const paymentInfo = getPaymentMethodInfo(booking.transaction?.payment_method || null);
                                    const PaymentIcon = paymentInfo.icon;

                                    return (
                                        <tr key={booking.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.95rem' }}>
                                            <td style={{ padding: '1.25rem 1rem' }}>
                                                <div style={{ fontWeight: 600, color: 'rgb(var(--text-main))' }}>{booking.serviceTitle}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                                    con {booking.expertName}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={14} /> {formatDate(booking.created_at)}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                                    <PaymentIcon size={16} color="rgb(var(--text-muted))" />
                                                    {paymentInfo.label}
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
                                                {formatAmount(Number(booking.price), booking.currency || 'USD')}
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
