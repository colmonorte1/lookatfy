import { createClient } from '@/utils/supabase/server';
import StatsCard from '@/components/ui/StatsCard/StatsCard';
import BarChart, { BarChartData } from '@/components/ui/BarChart/BarChart';
import { AlertCircle, Clock, CheckCircle, XCircle, TrendingUp, Users, Timer } from 'lucide-react';

interface DisputeStats {
    // Active disputes
    openCount: number;
    underReviewCount: number;
    // Resolved this month
    resolvedThisMonthCount: number;
    refundedThisMonthCount: number;
    dismissedThisMonthCount: number;
    // Historical
    totalResolved: number;
    totalRefunded: number;
    totalDismissed: number;
    // Metrics
    avgResolutionHours: number;
    refundRate: number;
    // Unique users with disputes
    uniqueUsers: number;
    uniqueExperts: number;
    // Distribution by status
    statusDistribution: { status: string; count: number }[];
    // Distribution by reason
    reasonDistribution: { reason: string; count: number }[];
    // Changes
    openChange: number;
    resolvedChange: number;
}

async function getDisputeStats(): Promise<DisputeStats> {
    const supabase = await createClient();

    // Fetch all disputes
    const { data: allDisputes } = await supabase
        .from('disputes')
        .select('id, status, reason, created_at, resolved_at, booking_id')
        .order('created_at', { ascending: false });

    const disputes = allDisputes || [];

    // Fetch bookings to get user/expert info
    const bookingIds = disputes.map(d => d.booking_id).filter(Boolean);
    let bookingsMap: Record<string, { user_id?: string; expert_id?: string }> = {};

    if (bookingIds.length > 0) {
        const { data: bookings } = await supabase
            .from('bookings')
            .select('id, user_id, expert_id')
            .in('id', bookingIds);

        (bookings || []).forEach(b => {
            bookingsMap[b.id] = { user_id: b.user_id, expert_id: b.expert_id };
        });
    }

    // Date calculations
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Open disputes
    const openCount = disputes.filter(d => d.status === 'open').length;

    // Under review
    const underReviewCount = disputes.filter(d => d.status === 'under_review').length;

    // Resolved this month
    const resolvedThisMonth = disputes.filter(d => {
        if (!['resolved_refunded', 'resolved_dismissed'].includes(d.status)) return false;
        const resolvedAt = d.resolved_at ? new Date(d.resolved_at) : null;
        return resolvedAt && resolvedAt >= startOfMonth;
    });
    const resolvedThisMonthCount = resolvedThisMonth.length;
    const refundedThisMonthCount = resolvedThisMonth.filter(d => d.status === 'resolved_refunded').length;
    const dismissedThisMonthCount = resolvedThisMonth.filter(d => d.status === 'resolved_dismissed').length;

    // Resolved last month (for comparison)
    const resolvedLastMonth = disputes.filter(d => {
        if (!['resolved_refunded', 'resolved_dismissed'].includes(d.status)) return false;
        const resolvedAt = d.resolved_at ? new Date(d.resolved_at) : null;
        return resolvedAt && resolvedAt >= startOfLastMonth && resolvedAt <= endOfLastMonth;
    });

    // Historical totals
    const allResolved = disputes.filter(d => ['resolved_refunded', 'resolved_dismissed'].includes(d.status));
    const totalResolved = allResolved.length;
    const totalRefunded = disputes.filter(d => d.status === 'resolved_refunded').length;
    const totalDismissed = disputes.filter(d => d.status === 'resolved_dismissed').length;

    // Refund rate
    const refundRate = totalResolved > 0 ? (totalRefunded / totalResolved) * 100 : 0;

    // Average resolution time (in hours)
    const resolutionTimes = allResolved
        .filter(d => d.resolved_at && d.created_at)
        .map(d => {
            const created = new Date(d.created_at).getTime();
            const resolved = new Date(d.resolved_at!).getTime();
            return (resolved - created) / (1000 * 60 * 60); // hours
        });
    const avgResolutionHours = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    // Unique users and experts
    const userIds = new Set<string>();
    const expertIds = new Set<string>();
    disputes.forEach(d => {
        const booking = d.booking_id ? bookingsMap[d.booking_id] : null;
        if (booking?.user_id) userIds.add(booking.user_id);
        if (booking?.expert_id) expertIds.add(booking.expert_id);
    });
    const uniqueUsers = userIds.size;
    const uniqueExperts = expertIds.size;

    // Status distribution
    const statusCount: Record<string, number> = {};
    disputes.forEach(d => {
        statusCount[d.status] = (statusCount[d.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

    // Reason distribution
    const reasonCount: Record<string, number> = {};
    disputes.forEach(d => {
        const reason = d.reason || 'Sin especificar';
        reasonCount[reason] = (reasonCount[reason] || 0) + 1;
    });
    const reasonDistribution = Object.entries(reasonCount)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 reasons

    // Open disputes last month
    const openLastMonth = disputes.filter(d => {
        const createdAt = new Date(d.created_at);
        return d.status === 'open' && createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
    }).length;

    // Changes
    const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    return {
        openCount,
        underReviewCount,
        resolvedThisMonthCount,
        refundedThisMonthCount,
        dismissedThisMonthCount,
        totalResolved,
        totalRefunded,
        totalDismissed,
        avgResolutionHours,
        refundRate,
        uniqueUsers,
        uniqueExperts,
        statusDistribution,
        reasonDistribution,
        openChange: calcChange(openCount, openLastMonth),
        resolvedChange: calcChange(resolvedThisMonthCount, resolvedLastMonth.length)
    };
}

export default async function DisputesDashboard() {
    const stats = await getDisputeStats();

    const formatHours = (hours: number) => {
        if (hours < 24) return `${Math.round(hours)}h`;
        const days = Math.floor(hours / 24);
        const remainingHours = Math.round(hours % 24);
        return `${days}d ${remainingHours}h`;
    };

    // Status chart data
    const statusLabels: Record<string, string> = {
        open: 'Abiertas',
        under_review: 'En revisión',
        resolved_refunded: 'Reembolsadas',
        resolved_dismissed: 'Desestimadas'
    };

    const statusColors: Record<string, string> = {
        open: 'rgb(var(--warning))',
        under_review: 'rgb(var(--info))',
        resolved_refunded: 'rgb(var(--success))',
        resolved_dismissed: 'rgb(var(--error))'
    };

    const statusChartData: BarChartData[] = stats.statusDistribution.map(s => ({
        label: statusLabels[s.status] || s.status,
        value: s.count,
        color: statusColors[s.status] || 'rgb(var(--text-muted))'
    }));

    // Reason chart data
    const reasonChartData: BarChartData[] = stats.reasonDistribution.map((r, i) => ({
        label: r.reason.length > 20 ? r.reason.slice(0, 20) + '...' : r.reason,
        value: r.count,
        color: i === 0 ? 'rgb(var(--primary))' : 'rgb(var(--text-muted))'
    }));

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Main KPIs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <StatsCard
                    title="Abiertas"
                    value={stats.openCount}
                    icon={AlertCircle}
                    color="warning"
                    subtitle="Requieren atención"
                    trend={stats.openCount > 0 ? {
                        value: Math.round(stats.openChange),
                        isPositive: stats.openChange < 0
                    } : undefined}
                />
                <StatsCard
                    title="En Revisión"
                    value={stats.underReviewCount}
                    icon={Clock}
                    color="info"
                    subtitle="En proceso"
                />
                <StatsCard
                    title="Resueltas (mes)"
                    value={stats.resolvedThisMonthCount}
                    icon={CheckCircle}
                    color="success"
                    subtitle={`${stats.refundedThisMonthCount} reemb. / ${stats.dismissedThisMonthCount} desest.`}
                    trend={{
                        value: Math.round(stats.resolvedChange),
                        isPositive: stats.resolvedChange >= 0
                    }}
                />
                <StatsCard
                    title="Tiempo Promedio"
                    value={formatHours(stats.avgResolutionHours)}
                    icon={Timer}
                    color="primary"
                    subtitle="Resolución"
                />
                <StatsCard
                    title="Tasa Reembolso"
                    value={`${Math.round(stats.refundRate)}%`}
                    icon={TrendingUp}
                    color={stats.refundRate > 50 ? 'danger' : 'success'}
                    subtitle={`${stats.totalRefunded} de ${stats.totalResolved}`}
                />
                <StatsCard
                    title="Involucrados"
                    value={stats.uniqueUsers + stats.uniqueExperts}
                    icon={Users}
                    color="info"
                    subtitle={`${stats.uniqueUsers} usuarios, ${stats.uniqueExperts} expertos`}
                />
            </div>

            {/* Charts */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                {/* Urgent Alert */}
                {stats.openCount > 0 && (
                    <div style={{
                        background: 'rgba(var(--warning), 0.1)',
                        border: '1px solid rgba(var(--warning), 0.3)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <AlertCircle size={32} style={{ color: 'rgb(var(--warning))' }} />
                        <div>
                            <div style={{ fontWeight: 700, color: 'rgb(var(--warning))', marginBottom: '0.25rem' }}>
                                {stats.openCount} Disputa{stats.openCount !== 1 ? 's' : ''} Pendiente{stats.openCount !== 1 ? 's' : ''}
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                Requieren revisión y resolución
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

                {/* Reason Distribution Chart */}
                {reasonChartData.length > 0 && (
                    <BarChart
                        title="Top Razones de Disputa"
                        data={reasonChartData}
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
                        Resumen Histórico
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgb(var(--text-secondary))' }}>Total resueltas:</span>
                            <span style={{ fontWeight: 700 }}>{stats.totalResolved}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgb(var(--text-secondary))' }}>Reembolsadas:</span>
                            <span style={{ fontWeight: 700, color: 'rgb(var(--success))' }}>{stats.totalRefunded}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgb(var(--text-secondary))' }}>Desestimadas:</span>
                            <span style={{ fontWeight: 700, color: 'rgb(var(--error))' }}>{stats.totalDismissed}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
