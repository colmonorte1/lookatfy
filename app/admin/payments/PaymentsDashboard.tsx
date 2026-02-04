import { createClient } from '@/utils/supabase/server';
import StatsCard from '@/components/ui/StatsCard/StatsCard';
import BarChart, { BarChartData } from '@/components/ui/BarChart/BarChart';
import { DollarSign, TrendingUp, CreditCard, Users, AlertTriangle, Percent, Receipt, ArrowUpRight } from 'lucide-react';

interface PaymentStats {
    // Current period (30 days)
    volume30: number;
    fees30: number;
    transactions30: number;
    avgTicket30: number;
    completionRate30: number;
    uniqueUsers30: number;
    uniqueExperts30: number;
    disputes30: number;
    // Previous period (30-60 days) for comparison
    volume30Change: number;
    fees30Change: number;
    transactions30Change: number;
    avgTicket30Change: number;
    completionRate30Change: number;
    // Historical totals
    volumeTotal: number;
    feesTotal: number;
    transactionsTotal: number;
    // Weekly trend data
    weeklyVolume: { label: string; value: number }[];
    weeklyTransactions: { label: string; value: number }[];
}

async function getPaymentStats(): Promise<PaymentStats> {
    const supabase = await createClient();

    // Get commission rate
    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('commission_percentage')
        .single();
    const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;

    // Date calculations
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const start30 = new Date(now.getTime() - 30 * DAY_MS);
    const start60 = new Date(now.getTime() - 60 * DAY_MS);
    const start90 = new Date(now.getTime() - 90 * DAY_MS);

    // Fetch all bookings for last 90 days
    const { data: bookings } = await supabase
        .from('bookings')
        .select('id, price, currency, status, created_at, user_id, expert_id')
        .in('status', ['confirmed', 'completed', 'pending', 'cancelled'])
        .gte('created_at', start90.toISOString());

    const allBookings = bookings || [];

    // Fetch disputes for last 90 days
    const { data: disputes } = await supabase
        .from('disputes')
        .select('id, booking_id, status, created_at')
        .gte('created_at', start90.toISOString());

    const allDisputes = disputes || [];

    // Calculate metrics for current period (last 30 days)
    const current = allBookings.filter(b => new Date(b.created_at) >= start30);
    const currentSuccess = current.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const currentCompleted = current.filter(b => b.status === 'completed');

    const volume30 = currentSuccess.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const fees30 = volume30 * commissionRate;
    const transactions30 = currentSuccess.length;
    const avgTicket30 = transactions30 > 0 ? volume30 / transactions30 : 0;
    const completionRate30 = current.length > 0 ? (currentCompleted.length / current.length) * 100 : 0;
    const uniqueUsers30 = new Set(currentSuccess.map(b => b.user_id).filter(Boolean)).size;
    const uniqueExperts30 = new Set(currentSuccess.map(b => b.expert_id).filter(Boolean)).size;
    const disputes30 = allDisputes.filter(d => new Date(d.created_at) >= start30).length;

    // Calculate metrics for previous period (30-60 days ago)
    const previous = allBookings.filter(b => {
        const date = new Date(b.created_at);
        return date >= start60 && date < start30;
    });
    const previousSuccess = previous.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const previousCompleted = previous.filter(b => b.status === 'completed');

    const volumePrev = previousSuccess.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const feesPrev = volumePrev * commissionRate;
    const transactionsPrev = previousSuccess.length;
    const avgTicketPrev = transactionsPrev > 0 ? volumePrev / transactionsPrev : 0;
    const completionRatePrev = previous.length > 0 ? (previousCompleted.length / previous.length) * 100 : 0;

    // Calculate percentage changes
    const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Historical totals (all time - fetch separately)
    const { data: allTimeBookings } = await supabase
        .from('bookings')
        .select('price')
        .in('status', ['confirmed', 'completed']);

    const allTime = allTimeBookings || [];
    const volumeTotal = allTime.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
    const feesTotal = volumeTotal * commissionRate;
    const transactionsTotal = allTime.length;

    // Weekly trend (last 4 weeks)
    const weeklyVolume: { label: string; value: number }[] = [];
    const weeklyTransactions: { label: string; value: number }[] = [];

    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * DAY_MS);
        const weekEnd = new Date(now.getTime() - i * 7 * DAY_MS);

        const weekBookings = currentSuccess.concat(previousSuccess).filter(b => {
            const date = new Date(b.created_at);
            return date >= weekStart && date < weekEnd;
        });

        const weekVolume = weekBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);
        const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;

        weeklyVolume.push({ label, value: weekVolume });
        weeklyTransactions.push({ label, value: weekBookings.length });
    }

    return {
        volume30,
        fees30,
        transactions30,
        avgTicket30,
        completionRate30,
        uniqueUsers30,
        uniqueExperts30,
        disputes30,
        volume30Change: calcChange(volume30, volumePrev),
        fees30Change: calcChange(fees30, feesPrev),
        transactions30Change: calcChange(transactions30, transactionsPrev),
        avgTicket30Change: calcChange(avgTicket30, avgTicketPrev),
        completionRate30Change: calcChange(completionRate30, completionRatePrev),
        volumeTotal,
        feesTotal,
        transactionsTotal,
        weeklyVolume,
        weeklyTransactions
    };
}

export default async function PaymentsDashboard() {
    const stats = await getPaymentStats();

    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    // Prepare chart data
    const volumeChartData: BarChartData[] = stats.weeklyVolume.map(w => ({
        label: w.label,
        value: w.value,
        color: 'rgb(var(--success))'
    }));

    const transactionsChartData: BarChartData[] = stats.weeklyTransactions.map(w => ({
        label: w.label,
        value: w.value,
        color: 'rgb(var(--primary))'
    }));

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Main KPIs - 30 days with trends */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <StatsCard
                    title="Volumen 30 días"
                    value={formatMoney(stats.volume30)}
                    icon={DollarSign}
                    color="success"
                    trend={{
                        value: Math.round(stats.volume30Change),
                        isPositive: stats.volume30Change >= 0
                    }}
                />
                <StatsCard
                    title="Comisiones 30 días"
                    value={formatMoney(stats.fees30)}
                    icon={TrendingUp}
                    color="success"
                    trend={{
                        value: Math.round(stats.fees30Change),
                        isPositive: stats.fees30Change >= 0
                    }}
                />
                <StatsCard
                    title="Transacciones 30 días"
                    value={stats.transactions30}
                    icon={CreditCard}
                    color="primary"
                    trend={{
                        value: Math.round(stats.transactions30Change),
                        isPositive: stats.transactions30Change >= 0
                    }}
                />
                <StatsCard
                    title="Ticket Promedio"
                    value={formatMoney(stats.avgTicket30)}
                    icon={Receipt}
                    color="primary"
                    trend={{
                        value: Math.round(stats.avgTicket30Change),
                        isPositive: stats.avgTicket30Change >= 0
                    }}
                />
                <StatsCard
                    title="Tasa Completación"
                    value={`${stats.completionRate30.toFixed(1)}%`}
                    icon={Percent}
                    color="success"
                    trend={{
                        value: Math.round(stats.completionRate30Change),
                        isPositive: stats.completionRate30Change >= 0
                    }}
                />
                <StatsCard
                    title="Disputas 30 días"
                    value={stats.disputes30}
                    icon={AlertTriangle}
                    color={stats.disputes30 > 0 ? 'warning' : 'success'}
                    subtitle={stats.disputes30 > 0 ? 'Requieren atención' : 'Sin disputas'}
                />
            </div>

            {/* Secondary KPIs */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1.5rem'
            }}>
                <StatsCard
                    title="Usuarios activos"
                    value={stats.uniqueUsers30}
                    icon={Users}
                    color="info"
                    subtitle="Últimos 30 días"
                />
                <StatsCard
                    title="Expertos activos"
                    value={stats.uniqueExperts30}
                    icon={ArrowUpRight}
                    color="info"
                    subtitle="Últimos 30 días"
                />
                <StatsCard
                    title="Volumen histórico"
                    value={formatMoney(stats.volumeTotal)}
                    icon={DollarSign}
                    color="primary"
                    subtitle="Total acumulado"
                />
                <StatsCard
                    title="Comisiones históricas"
                    value={formatMoney(stats.feesTotal)}
                    icon={TrendingUp}
                    color="success"
                    subtitle="Total acumulado"
                />
            </div>

            {/* Charts */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                <BarChart
                    title="Volumen Semanal (4 semanas)"
                    data={volumeChartData}
                    height={160}
                />
                <BarChart
                    title="Transacciones Semanales"
                    data={transactionsChartData}
                    height={160}
                />
            </div>
        </div>
    );
}
