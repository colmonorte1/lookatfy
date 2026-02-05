import { DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

export default async function ExpertEarningsPage() {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>No autenticado</div>;

    // 2. Fetch Bookings (Completed & Confirmed)
    // We need user profile for client name, service title.
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            id,
            date,
            status,
            price,
            created_at,
            service:services(title),
            client:profiles!user_id(full_name)
        `)
        .eq('expert_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('date', { ascending: false });

    const { data: disputes } = await supabase
        .from('disputes')
        .select('booking_id, status')
        .in('status', ['open', 'under_review', 'resolved_refunded']);

    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('commission_percentage')
        .single();
    const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;

    // 3. Calculate Metrics
    type BookingRow = { id: string; date: string; status: string; price: number | string; service?: { title?: string } | { title?: string }[]; client?: { full_name?: string } | { full_name?: string }[] };
    type DisputeRow = { booking_id: string; status: string };

    const allBookings = (bookings || []) as BookingRow[];
    const disputedBookingIds = new Set(((disputes || []) as DisputeRow[]).filter(d => d.status === 'open' || d.status === 'under_review').map((d) => d.booking_id));
    const refundedBookingIds = new Set(((disputes || []) as DisputeRow[]).filter(d => d.status === 'resolved_refunded').map((d) => d.booking_id));

    // "Ingresos Totales" -> Sum of COMPLETED
    const totalEarnings = allBookings
        .filter(b => b.status === 'completed' && !refundedBookingIds.has(b.id))
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    // "Pendiente por realizar" -> Sum of CONFIRMED (Future revenue) - Exclude disputed and refunded
    const todayDate = new Date().toISOString().split('T')[0];
    const pendingEarnings = allBookings
        .filter(b => {
            if (b.status !== 'confirmed') return false;
            if (disputedBookingIds.has(b.id)) return false; // Exclude disputed
            if (refundedBookingIds.has(b.id)) return false; // Exclude refunded
            if (b.date < todayDate) return false; // Only future bookings
            return true;
        })
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    // "Servicios Completados" - Exclude refunded bookings
    const completedCount = allBookings
        .filter(b => b.status === 'completed' && !refundedBookingIds.has(b.id))
        .length;

    // "Mes Actual" Revenue (Completed)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const currentMonthEarnings = allBookings
        .filter(b => b.status === 'completed' && b.date >= firstDayOfMonth && !refundedBookingIds.has(b.id))
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    const totalCommission = totalEarnings * commissionRate;
    const totalNet = totalEarnings - totalCommission;
    const monthCommission = currentMonthEarnings * commissionRate;
    const monthNet = currentMonthEarnings - monthCommission;
    const pendingCommission = pendingEarnings * commissionRate;
    const pendingNet = pendingEarnings - pendingCommission;

    const formatCOP = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(val);


    return (
        <div style={{ maxWidth: '100%' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mis Ganancias</h1>

            {/* KPIs Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                {/* Card 1: Total Realizado */}
                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.875rem', fontWeight: 500 }}>Ingresos Totales</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>Neto: {formatCOP(totalNet)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', fontWeight: 500 }}>Bruto: {formatCOP(totalEarnings)} • Comisión: {formatCOP(totalCommission)}</div>
                    </div>
                </div>

                {/* Card 2: Mes Actual */}
                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: 'rgba(var(--primary), 0.1)', color: 'rgb(var(--primary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.875rem', fontWeight: 500 }}>Este Mes</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>Neto: {formatCOP(monthNet)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', fontWeight: 500 }}>Bruto: {formatCOP(currentMonthEarnings)} • Comisión: {formatCOP(monthCommission)}</div>
                    </div>
                </div>

                {/* Card 3: Por Completar (Confirmed) */}
                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    display: 'flex', alignItems: 'center', gap: '1rem'
                }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: 'rgba(var(--warning), 0.1)', color: 'rgb(var(--warning))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Calendar size={24} />
                    </div>
                    <div>
                        <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.875rem', fontWeight: 500 }}>Por Realizar</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>Neto est.: {formatCOP(pendingNet)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', fontWeight: 500 }}>Bruto: {formatCOP(pendingEarnings)} • Comisión est.: {formatCOP(pendingCommission)} — {allBookings.filter(b => b.status === 'confirmed' && !disputedBookingIds.has(b.id) && !refundedBookingIds.has(b.id) && b.date >= todayDate).length} Citas Futuras</div>
                    </div>
                </div>
            </div>

            {/* Transaction History */}
            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                padding: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Historial de Transacciones</h2>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
                        padding: '0.75rem 1rem',
                        background: 'rgb(var(--background))',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem', fontWeight: 600, color: 'rgb(var(--text-secondary))'
                    }}>
                        <div>Servicio</div>
                        <div>Cliente</div>
                        <div>Fecha</div>
                        <div>Estado</div>
                        <div style={{ textAlign: 'right' }}>Monto</div>
                        <div style={{ textAlign: 'right' }}>Comisión</div>
                        <div style={{ textAlign: 'right' }}>Neto</div>
                    </div>

                    {/* Rows */}
                    {allBookings.length > 0 ? (
                        allBookings.map((tx: { id: string; date: string; status: string; price: number | string; service?: { title?: string } | { title?: string }[]; client?: { full_name?: string } | { full_name?: string }[] }) => {
                            const clientObj = Array.isArray(tx.client) ? tx.client[0] : tx.client;
                            const serviceObj = Array.isArray(tx.service) ? tx.service[0] : tx.service;
                            const clientName = clientObj?.full_name || 'Cliente';
                            const serviceName = serviceObj?.title || 'Servicio';
                            const dateStr = new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

                            const isCompleted = tx.status === 'completed';
                            const isRefunded = refundedBookingIds.has(tx.id);

                            return (
                                <div key={tx.id} style={{
                                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr 1fr',
                                    padding: '1rem',
                                    borderBottom: '1px solid rgb(var(--border))',
                                    alignItems: 'center', fontSize: '0.9rem'
                                }}>
                                    <div style={{ fontWeight: 500 }}>{serviceName}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                                            {clientName.charAt(0)}
                                        </div>
                                        {clientName}
                                    </div>
                                    <div style={{ color: 'rgb(var(--text-secondary))' }}>{dateStr}</div>
                                    <div>
                                        <span style={{
                                            background: isRefunded ? 'rgba(var(--error), 0.1)' : (isCompleted ? 'rgba(var(--success), 0.1)' : 'rgba(var(--primary), 0.1)'),
                                            color: isRefunded ? 'rgb(var(--error))' : (isCompleted ? 'rgb(var(--success))' : 'rgb(var(--primary))'),
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600,
                                            textTransform: 'capitalize', marginRight: '0.5rem'
                                        }}>
                                            {isRefunded ? 'Cancelado por disputa' : (tx.status === 'completed' ? 'Pagado' : 'Reservado')}
                                        </span>
                                        {disputedBookingIds.has(tx.id) && (
                                            <span style={{
                                                background: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))',
                                                padding: '0.25rem 0.5rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600
                                            }}>En disputa</span>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 700 }}>{formatCOP(Number(tx.price))}</div>
                                    <div style={{ textAlign: 'right', color: 'rgb(var(--text-secondary))' }}>{formatCOP(isRefunded ? 0 : (Number(tx.price) || 0) * commissionRate)}</div>
                                    <div style={{ textAlign: 'right', fontWeight: 700 }}>{formatCOP(isRefunded ? 0 : ((Number(tx.price) || 0) - (Number(tx.price) || 0) * commissionRate))}</div>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-muted))' }}>
                            No hay transacciones registradas.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
