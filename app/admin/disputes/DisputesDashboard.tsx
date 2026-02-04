'use client';

import StatsCard from '@/components/ui/StatsCard/StatsCard';
import BarChart, { BarChartData } from '@/components/ui/BarChart/BarChart';
import { AlertCircle, Clock, CheckCircle, TrendingUp, Users, Timer } from 'lucide-react';

export interface DisputeStats {
    openCount: number;
    underReviewCount: number;
    resolvedThisMonthCount: number;
    refundedThisMonthCount: number;
    dismissedThisMonthCount: number;
    totalResolved: number;
    totalRefunded: number;
    totalDismissed: number;
    avgResolutionHours: number;
    refundRate: number;
    uniqueUsers: number;
    uniqueExperts: number;
    statusDistribution: { status: string; count: number }[];
    reasonDistribution: { reason: string; count: number }[];
    openChange: number;
    resolvedChange: number;
}

interface DisputesDashboardProps {
    stats: DisputeStats;
}

export default function DisputesDashboard({ stats }: DisputesDashboardProps) {
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
