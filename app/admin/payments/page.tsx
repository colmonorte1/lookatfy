import { createClient } from '@/utils/supabase/server';
import { DollarSign, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';

export default async function AdminPaymentsPage() {
    const supabase = await createClient();

    // Fetch Bookings that represent payments (confirmed or completed)
    // Fetch Bookings that represent payments (confirmed or completed)
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            *,
            user:profiles!user_id(full_name),
            expert:experts!expert_id(
                profile:profiles(full_name)
            )
        `)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching payments:", error);
    }

    const transactions = bookings || [];

    // Fetch Platform Settings for Commission
    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('commission_percentage')
        .single();

    // Default to 10 if not set
    const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;

    // Calculate Metrics
    const totalVolume = transactions.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    const platformFees = totalVolume * commissionRate;
    const transactionCount = transactions.length;

    // Helper to format currency
    const formatMoney = (amount: number, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Pagos y Transacciones</h1>
                <Button variant="outline" style={{ gap: '0.5rem' }}>
                    <Download size={18} /> Exportar CSV
                </Button>
            </div>

            {/* Metrics Quick View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Volumen Total (Histórico)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{formatMoney(totalVolume)}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Comisiones Plataforma ({commissionRate * 100}%)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'rgb(var(--success))' }}>{formatMoney(platformFees)}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Transacciones Exitosas</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{transactionCount}</div>
                </div>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <Input placeholder="Buscar por ID, usuario o experto..." icon={<Search size={18} />} />
                    </div>
                    <Button variant="outline" style={{ gap: '0.5rem' }}>
                        <Filter size={18} /> Filtros
                    </Button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                        <thead>
                            <tr style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                <th style={{ padding: '1rem' }}>ID Reserva</th>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Usuario</th>
                                <th style={{ padding: '1rem' }}>Experto</th>
                                <th style={{ padding: '1rem' }}>Monto</th>
                                <th style={{ padding: '1rem' }}>Fee ({commissionRate * 100}%)</th>
                                <th style={{ padding: '1rem' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                        No hay transacciones registradas.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx: any) => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'rgb(var(--primary))' }}>
                                            {tx.id.slice(0, 8)}...
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : tx.date}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                                            {tx.user?.full_name || 'Desconocido'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {tx.expert?.profile?.full_name || 'Experto'}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 700 }}>
                                            {formatMoney(Number(tx.price || 0), tx.currency)}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'rgb(var(--success))', fontWeight: 600 }}>
                                            +{formatMoney(Number(tx.price || 0) * 0.10, tx.currency)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                textTransform: 'capitalize',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                background: tx.status === 'completed' ? 'rgba(var(--success), 0.1)' :
                                                    tx.status === 'confirmed' ? 'rgba(var(--success), 0.1)' :
                                                        tx.status === 'pending' ? 'rgba(var(--warning), 0.1)' :
                                                            'rgba(var(--error), 0.1)',
                                                color: tx.status === 'completed' ? 'rgb(var(--success))' :
                                                    tx.status === 'confirmed' ? 'rgb(var(--success))' :
                                                        tx.status === 'pending' ? 'rgb(var(--warning))' :
                                                            'rgb(var(--error))'
                                            }}>
                                                {tx.status === 'confirmed' ? 'Pagado' : tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
