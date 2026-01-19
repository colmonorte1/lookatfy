import { DollarSign, TrendingUp, Calendar, CreditCard, ChevronDown } from 'lucide-react';
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
            services ( title ),
            profiles:user_id ( full_name )
        `)
        .eq('expert_id', user.id)
        .in('status', ['confirmed', 'completed'])
        .order('date', { ascending: false });

    // 3. Calculate Metrics
    const allBookings = bookings || [];

    // "Ingresos Totales" -> Sum of COMPLETED
    const totalEarnings = allBookings
        .filter(b => b.status === 'completed')
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    // "Pendiente por realizar" -> Sum of CONFIRMED (Future revenue)
    const pendingEarnings = allBookings
        .filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    // "Servicios Completados"
    const completedCount = allBookings.filter(b => b.status === 'completed').length;

    // "Mes Actual" Revenue (Completed)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const currentMonthEarnings = allBookings
        .filter(b => b.status === 'completed' && b.date >= firstDayOfMonth)
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);


    return (
        <div style={{ maxWidth: '1000px' }}>
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
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>${totalEarnings.toFixed(2)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', fontWeight: 500 }}>Histórico</div>
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
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>${currentMonthEarnings.toFixed(2)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', fontWeight: 500 }}>Procesado</div>
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
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>${pendingEarnings.toFixed(2)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', fontWeight: 500 }}>{allBookings.filter(b => b.status === 'confirmed').length} Citas Futuras</div>
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
                        display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
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
                    </div>

                    {/* Rows */}
                    {allBookings.length > 0 ? (
                        allBookings.map((tx: any) => {
                            const clientName = tx.profiles?.full_name || 'Cliente';
                            const serviceName = tx.services?.title || 'Servicio';
                            const dateStr = new Date(tx.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

                            const isCompleted = tx.status === 'completed';

                            return (
                                <div key={tx.id} style={{
                                    display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
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
                                            background: isCompleted ? 'rgba(var(--success), 0.1)' : 'rgba(var(--primary), 0.1)',
                                            color: isCompleted ? 'rgb(var(--success))' : 'rgb(var(--primary))',
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600,
                                            textTransform: 'capitalize'
                                        }}>
                                            {tx.status === 'completed' ? 'Pagado' : 'Reservado'}
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: 700 }}>${Number(tx.price).toFixed(2)}</div>
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
