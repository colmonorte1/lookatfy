import { createClient } from '@/utils/supabase/server';
import StatsCard from '@/components/ui/StatsCard/StatsCard';
import BarChart, { BarChartData } from '@/components/ui/BarChart/BarChart';
import { Wallet, Clock, CheckCircle, XCircle, AlertTriangle, DollarSign, TrendingUp, Users } from 'lucide-react';

interface WithdrawalStats {
    // Pending
    pendingCount: number;
    pendingAmount: number;
    // Approved (waiting payment)
    approvedCount: number;
    approvedAmount: number;
    // Paid this month
    paidThisMonthCount: number;
    paidThisMonthAmount: number;
    // Rejected this month
    rejectedThisMonthCount: number;
    // Total paid (historical)
    totalPaidAmount: number;
    totalPaidCount: number;
    // Risk alerts
    fraudAlerts: number;
    // Unique experts with withdrawals
    uniqueExperts: number;
    // Distribution by status
    statusDistribution: { status: string; count: number }[];
    // Changes vs previous period
    pendingChange: number;
    paidChange: number;
}

async function getWithdrawalStats(): Promise<WithdrawalStats> {
    const supabase = await createClient();

    // Fetch all withdrawals
    const { data: allWithdrawals } = await supabase
        .from('withdrawals')
        .select('id, expert_id, amount, status, requested_at, processed_at')
        .order('requested_at', { ascending: false });

    const withdrawals = allWithdrawals || [];

    // Date calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Pending
    const pending = withdrawals.filter(w => w.status === 'pending');
    const pendingCount = pending.length;
    const pendingAmount = pending.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Approved (waiting for payment)
    const approved = withdrawals.filter(w => w.status === 'approved');
    const approvedCount = approved.length;
    const approvedAmount = approved.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Paid this month
    const paidThisMonth = withdrawals.filter(w => {
        if (w.status !== 'paid') return false;
        const processedAt = w.processed_at ? new Date(w.processed_at) : null;
        return processedAt && processedAt >= startOfMonth;
    });
    const paidThisMonthCount = paidThisMonth.length;
    const paidThisMonthAmount = paidThisMonth.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Paid last month (for comparison)
    const paidLastMonth = withdrawals.filter(w => {
        if (w.status !== 'paid') return false;
        const processedAt = w.processed_at ? new Date(w.processed_at) : null;
        return processedAt && processedAt >= startOfLastMonth && processedAt <= endOfLastMonth;
    });
    const paidLastMonthAmount = paidLastMonth.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // Rejected this month
    const rejectedThisMonth = withdrawals.filter(w => {
        if (w.status !== 'rejected') return false;
        const requestedAt = new Date(w.requested_at);
        return requestedAt >= startOfMonth;
    });
    const rejectedThisMonthCount = rejectedThisMonth.length;

    // Total paid (historical)
    const allPaid = withdrawals.filter(w => w.status === 'paid');
    const totalPaidAmount = allPaid.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const totalPaidCount = allPaid.length;

    // Unique experts
    const uniqueExperts = new Set(withdrawals.map(w => w.expert_id)).size;

    // Status distribution
    const statusCount: Record<string, number> = {};
    withdrawals.forEach(w => {
        statusCount[w.status] = (statusCount[w.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

    // Fraud alerts - check experts with 3+ lost disputes
    const { data: disputes } = await supabase
        .from('disputes')
        .select('id, status, booking:bookings(expert_id)')
        .eq('status', 'resolved_refunded');

    const expertLostDisputes: Record<string, number> = {};
    (disputes || []).forEach((d: any) => {
        const expertId = d.booking?.expert_id;
        if (expertId) {
            expertLostDisputes[expertId] = (expertLostDisputes[expertId] || 0) + 1;
        }
    });
    const fraudAlerts = Object.values(expertLostDisputes).filter(count => count >= 3).length;

    // Changes
    const pendingLastMonth = withdrawals.filter(w => {
        const requestedAt = new Date(w.requested_at);
        return w.status === 'pending' && requestedAt >= startOfLastMonth && requestedAt <= endOfLastMonth;
    }).length;

    const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return {
        pendingCount,
        pendingAmount,
        approvedCount,
        approvedAmount,
        paidThisMonthCount,
        paidThisMonthAmount,
        rejectedThisMonthCount,
        totalPaidAmount,
        totalPaidCount,
        fraudAlerts,
        uniqueExperts,
        statusDistribution,
        pendingChange: calcChange(pendingCount, pendingLastMonth),
        paidChange: calcChange(paidThisMonthAmount, paidLastMonthAmount)
    };
}

export default async function WithdrawalsDashboard() {
    const stats = await getWithdrawalStats();

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Status chart data
    const statusLabels: Record<string, string> = {
        pending: 'Pendientes',
        approved: 'Aprobados',
        paid: 'Pagados',
        rejected: 'Rechazados',
        processing: 'Procesando'
    };

    const statusColors: Record<string, string> = {
        pending: 'rgb(var(--warning))',
        approved: 'rgb(var(--primary))',
        paid: 'rgb(var(--success))',
        rejected: 'rgb(var(--error))',
        processing: 'rgb(var(--info))'
    };

    const statusChartData: BarChartData[] = stats.statusDistribution.map(s => ({
        label: statusLabels[s.status] || s.status,
        value: s.count,
        color: statusColors[s.status] || 'rgb(var(--text-muted))'
    }));

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Main KPIs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <StatsCard
                    title="Pendientes"
                    value={stats.pendingCount}
                    icon={Clock}
                    color="warning"
                    subtitle={formatMoney(stats.pendingAmount)}
                />
                <StatsCard
                    title="Por Pagar"
                    value={stats.approvedCount}
                    icon={Wallet}
                    color="primary"
                    subtitle={formatMoney(stats.approvedAmount)}
                />
                <StatsCard
                    title="Pagados (mes)"
                    value={stats.paidThisMonthCount}
                    icon={CheckCircle}
                    color="success"
                    subtitle={formatMoney(stats.paidThisMonthAmount)}
                    trend={{
                        value: Math.round(stats.paidChange),
                        isPositive: stats.paidChange >= 0
                    }}
                />
                <StatsCard
                    title="Rechazados (mes)"
                    value={stats.rejectedThisMonthCount}
                    icon={XCircle}
                    color="danger"
                    subtitle="Este mes"
                />
                <StatsCard
                    title="Total Pagado"
                    value={formatMoney(stats.totalPaidAmount)}
                    icon={DollarSign}
                    color="success"
                    subtitle={`${stats.totalPaidCount} retiros históricos`}
                />
                <StatsCard
                    title="Expertos"
                    value={stats.uniqueExperts}
                    icon={Users}
                    color="info"
                    subtitle="Con retiros"
                />
            </div>

            {/* Alerts and Charts */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Fraud Alert Card */}
                {stats.fraudAlerts > 0 && (
                    <div style={{
                        background: 'rgba(var(--error), 0.1)',
                        border: '1px solid rgba(var(--error), 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <AlertTriangle size={32} style={{ color: 'rgb(var(--error))' }} />
                        <div>
                            <div style={{ fontWeight: 700, color: 'rgb(var(--error))', marginBottom: '0.25rem' }}>
                                {stats.fraudAlerts} Alerta{stats.fraudAlerts !== 1 ? 's' : ''} de Fraude
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                Expertos con 3+ disputas perdidas
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Distribution Chart */}
                {statusChartData.length > 0 && (
                    <BarChart
                        title="Distribución por Estado"
                        data={statusChartData}
                        height={160}
                    />
                )}

                {/* Quick Summary */}
                <div style={{
                    background: 'rgb(var(--surface))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem'
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                        Resumen de Acción
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgb(var(--text-secondary))' }}>Requieren aprobación:</span>
                            <span style={{
                                fontWeight: 700,
                                color: stats.pendingCount > 0 ? 'rgb(var(--warning))' : 'rgb(var(--text-muted))'
                            }}>
                                {stats.pendingCount}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgb(var(--text-secondary))' }}>Requieren pago:</span>
                            <span style={{
                                fontWeight: 700,
                                color: stats.approvedCount > 0 ? 'rgb(var(--primary))' : 'rgb(var(--text-muted))'
                            }}>
                                {stats.approvedCount}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgb(var(--text-secondary))' }}>Monto por desembolsar:</span>
                            <span style={{ fontWeight: 700, color: 'rgb(var(--text-main))' }}>
                                {formatMoney(stats.pendingAmount + stats.approvedAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
