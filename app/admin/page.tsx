import { Users, Video, DollarSign, LayoutDashboard, AlertTriangle, Percent, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import KPICard from '@/components/admin/KPICard';
import { redirect } from 'next/navigation';

// TypeScript interfaces for type safety
interface SupabaseBookingRaw {
    id: string;
    price: number | string;
    currency: string;
    status: string;
    created_at: string;
    user_id: string;
    expert_id: string;
    expert?: Array<{
        profile?: Array<{
            full_name?: string;
        }>;
    }>;
    service?: Array<{
        title?: string;
        category?: string;
        country?: string;
        rating_avg?: number;
    }>;
}

interface ProcessedBooking {
    id: string;
    price: number;
    currency: string;
    status: string;
    created_at: string;
    user_id: string;
    expert_id: string;
    expert_name?: string;
    service_category?: string | null;
    service_country?: string | null;
    service_rating_avg?: number | null;
}

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    // Authentication and authorization check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        redirect('/');
    }

    // Count users (excluding deleted)
    const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

    // Count experts
    const { count: expertsCount } = await supabase
        .from('experts')
        .select('*', { count: 'exact', head: true });

    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('commission_percentage')
        .single();
    const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;

    // Consolidated date creation for performance
    const baseDate = new Date();
    const baseDateTs = baseDate.getTime();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const start30 = new Date(baseDateTs - 30 * DAY_MS);
    const start60 = new Date(baseDateTs - 60 * DAY_MS);
    const start90 = new Date(baseDateTs - 90 * DAY_MS);
    const start90ISO = start90.toISOString();

    const { data: bookings90 } = await supabase
        .from('bookings')
        .select(`
            id, price, currency, status, created_at, user_id, expert_id,
            expert:experts!expert_id(
                profile:profiles(full_name)
            ),
            service:services!service_id(title, category, country, rating_avg)
        `)
        .in('status', ['confirmed', 'completed'])
        .gte('created_at', start90ISO);

    const b90: ProcessedBooking[] = (bookings90 || []).map((b: SupabaseBookingRaw) => ({
        id: b.id,
        price: Number(b.price) || 0,
        currency: b.currency || 'USD',
        status: b.status,
        created_at: b.created_at,
        user_id: b.user_id,
        expert_id: b.expert_id,
        expert_name: b.expert?.[0]?.profile?.[0]?.full_name,
        service_category: b.service?.[0]?.category ?? null,
        service_country: b.service?.[0]?.country ?? null,
        service_rating_avg: b.service?.[0]?.rating_avg ?? null,
    }));

    // Optimized: Calculate all metrics in a single pass
    const metrics = b90.reduce((acc, booking) => {
        const createdAt = new Date(booking.created_at);
        const isCurrent = createdAt >= start30;
        const isPrevious = createdAt >= start60 && createdAt < start30;

        if (isCurrent) {
            acc.current.volume += booking.price;
            acc.current.txCount++;
            if (booking.status === 'completed') acc.current.completed++;
            acc.current.users.add(booking.user_id);
            acc.current.experts.add(booking.expert_id);
        } else if (isPrevious) {
            acc.previous.volume += booking.price;
            acc.previous.txCount++;
            if (booking.status === 'completed') acc.previous.completed++;
            acc.previous.users.add(booking.user_id);
            acc.previous.experts.add(booking.expert_id);
        }

        return acc;
    }, {
        current: { volume: 0, txCount: 0, completed: 0, users: new Set<string>(), experts: new Set<string>() },
        previous: { volume: 0, txCount: 0, completed: 0, users: new Set<string>(), experts: new Set<string>() }
    });

    // Current period (last 30 days)
    const volume30 = metrics.current.volume;
    const fees30 = volume30 * commissionRate;
    const txCount30 = metrics.current.txCount;
    const completed30 = metrics.current.completed;
    const completionRate30 = txCount30 ? (completed30 / txCount30) : 0;
    const uniqueUsers30 = metrics.current.users.size;
    const uniqueExperts30 = metrics.current.experts.size;

    // Previous period (30-60 days ago) for comparison
    const volumePrev = metrics.previous.volume;
    const feesPrev = volumePrev * commissionRate;
    const txCountPrev = metrics.previous.txCount;
    const completedPrev = metrics.previous.completed;
    const completionRatePrev = txCountPrev ? (completedPrev / txCountPrev) : 0;
    const uniqueUsersPrev = metrics.previous.users.size;
    const uniqueExpertsPrev = metrics.previous.experts.size;

    // Calculate percentage changes with division-by-zero protection
    const calcChange = (current: number, previous: number) => {
        if (!isFinite(current) || !isFinite(previous)) return 0;
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Safe ARPU calculation with division-by-zero protection
    const safeArpu = (volume: number, users: number) => {
        if (users === 0 || !isFinite(volume) || !isFinite(users)) return 0;
        return volume / users;
    };

    const arpu30 = safeArpu(volume30, uniqueUsers30);
    const arpuPrev = safeArpu(volumePrev, uniqueUsersPrev);

    const txCountChange = calcChange(txCount30, txCountPrev);
    const volumeChange = calcChange(volume30, volumePrev);
    const feesChange = calcChange(fees30, feesPrev);
    const completionRateChange = calcChange(completionRate30, completionRatePrev);
    const uniqueExpertsChange = calcChange(uniqueExperts30, uniqueExpertsPrev);
    const arpuChange = calcChange(arpu30, arpuPrev);

    const { data: disputesActive } = await supabase
        .from('disputes')
        .select('id, status')
        .in('status', ['open', 'under_review']);
    const activeDisputesCount = (disputesActive || []).length;

    const { data: disputes90 } = await supabase
        .from('disputes')
        .select('id, status, created_at, resolved_at, booking_id')
        .gte('created_at', start90ISO);
    const d90 = (disputes90 || []) as Array<{ id: string; status: string; created_at: string; resolved_at?: string | null; booking_id?: string | null }>;
    const d30 = d90.filter(d => new Date(d.created_at) >= start30);
    const dPrev = d90.filter(d => new Date(d.created_at) >= start60 && new Date(d.created_at) < start30);
    const disputesRate30 = txCount30 ? (d30.length / txCount30) : 0;
    const disputesRatePrev = txCountPrev ? (dPrev.length / txCountPrev) : 0;
    const disputesRateChange = calcChange(disputesRate30, disputesRatePrev);
    const activeDisputesChange = calcChange(activeDisputesCount, dPrev.filter(d => d.status === 'open' || d.status === 'under_review').length);

    const resolvedDurations = d30
        .filter(d => d.status === 'resolved_refunded' || d.status === 'resolved_dismissed')
        .map(d => {
            const start = new Date(d.created_at).getTime();
            const end = d.resolved_at ? new Date(d.resolved_at).getTime() : start;
            return Math.max(0, end - start);
        });
    const avgResolutionDays = resolvedDurations.length
        ? (resolvedDurations.reduce((a, b) => a + b, 0) / resolvedDurations.length) / (1000 * 60 * 60 * 24)
        : 0;

    const resolvedDurationsPrev = dPrev
        .filter(d => d.status === 'resolved_refunded' || d.status === 'resolved_dismissed')
        .map(d => {
            const start = new Date(d.created_at).getTime();
            const end = d.resolved_at ? new Date(d.resolved_at).getTime() : start;
            return Math.max(0, end - start);
        });
    const avgResolutionDaysPrev = resolvedDurationsPrev.length
        ? (resolvedDurationsPrev.reduce((a, b) => a + b, 0) / resolvedDurationsPrev.length) / (1000 * 60 * 60 * 24)
        : 0;
    const avgResolutionChange = calcChange(avgResolutionDays, avgResolutionDaysPrev);

    // Calculate weekly sparkline data (last 4 weeks)
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const sparklineWeeks = 4;

    const txSparkline: number[] = [];
    const volumeSparkline: number[] = [];
    const feesSparkline: number[] = [];

    for (let i = sparklineWeeks - 1; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * weekMs);
        const weekEnd = new Date(now.getTime() - i * weekMs);

        const weekBookings = b90.filter(b => {
            const date = new Date(b.created_at);
            return date >= weekStart && date < weekEnd;
        });

        txSparkline.push(weekBookings.length);
        const weekVolume = weekBookings.reduce((sum, b) => sum + b.price, 0);
        volumeSparkline.push(weekVolume);
        feesSparkline.push(weekVolume * commissionRate);
    }

    const formatMoney = (amount: number, currency = 'USD') => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(amount);
    const formatPct = (n: number) => `${(n * 100).toFixed(1)}%`;

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Dashboard General</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <KPICard
                    title="Usuarios Totales"
                    value={usersCount || 0}
                    change={0}
                    icon={Users}
                    color="primary"
                    tooltip="Total de usuarios registrados en la plataforma"
                />
                <KPICard
                    title="Expertos Totales"
                    value={expertsCount || 0}
                    change={0}
                    icon={Video}
                    color="secondary"
                    tooltip="Total de expertos registrados en la plataforma"
                />
                <KPICard
                    title="Transacciones 30 días"
                    value={txCount30}
                    change={txCountChange}
                    icon={LayoutDashboard}
                    color="warning"
                    tooltip="Número de transacciones completadas en los últimos 30 días vs período anterior"
                    sparkline={txSparkline}
                    threshold={{
                        check: (val: number) => val === 0,
                        message: "No hay transacciones en los últimos 30 días"
                    }}
                />
                <KPICard
                    title="Volumen 30 días"
                    value={formatMoney(volume30)}
                    change={volumeChange}
                    icon={DollarSign}
                    color="success"
                    tooltip="Volumen total facturado en los últimos 30 días vs período anterior"
                    sparkline={volumeSparkline}
                />
                <KPICard
                    title={`Comisiones (${Math.round(commissionRate * 100)}%) 30 días`}
                    value={formatMoney(fees30)}
                    change={feesChange}
                    icon={DollarSign}
                    color="success"
                    tooltip="Comisiones generadas en los últimos 30 días vs período anterior"
                    sparkline={feesSparkline}
                />
                <KPICard
                    title="Finalización 30 días"
                    value={formatPct(completionRate30)}
                    change={completionRateChange}
                    icon={Percent}
                    color="secondary"
                    tooltip="Porcentaje de transacciones completadas exitosamente"
                    threshold={{
                        check: (val: string) => parseFloat(val) < 80,
                        message: "Tasa de finalización por debajo del 80%"
                    }}
                />
                <KPICard
                    title="Expertos activos 30 días"
                    value={uniqueExperts30}
                    change={uniqueExpertsChange}
                    icon={Video}
                    color="primary"
                    tooltip="Número de expertos con al menos 1 transacción en los últimos 30 días"
                    threshold={{
                        check: (val: number) => val === 0,
                        message: "No hay expertos activos"
                    }}
                />
                <KPICard
                    title="ARPU 30 días"
                    value={formatMoney(arpu30)}
                    change={arpuChange}
                    icon={DollarSign}
                    color="primary"
                    tooltip="Ingreso promedio por usuario (Average Revenue Per User)"
                />
                <KPICard
                    title="Disputas activas"
                    value={activeDisputesCount}
                    change={activeDisputesChange}
                    icon={AlertTriangle}
                    color="warning"
                    tooltip="Disputas abiertas o en revisión actualmente"
                    threshold={{
                        check: (val: number) => val > 5,
                        message: "Alto número de disputas activas"
                    }}
                />
                <KPICard
                    title="Tasa de disputa 30 días"
                    value={formatPct(disputesRate30)}
                    change={disputesRateChange}
                    icon={AlertTriangle}
                    color="warning"
                    tooltip="Porcentaje de transacciones que generaron disputas"
                    threshold={{
                        check: (val: string) => parseFloat(val) > 5,
                        message: "Tasa de disputas superior al 5%"
                    }}
                />
                <KPICard
                    title="Tiempo medio resolución"
                    value={`${avgResolutionDays.toFixed(1)} días`}
                    change={avgResolutionChange}
                    icon={Clock}
                    color="secondary"
                    tooltip="Tiempo promedio para resolver disputas"
                    threshold={{
                        check: (val: string) => parseFloat(val) > 7,
                        message: "Tiempo de resolución superior a 7 días"
                    }}
                />
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden',
                padding: '1rem'
            }}>
                <AdminDashboardClient
                    commissionRate={commissionRate}
                    bookings={b90}
                    disputes={(() => {
                        // Pre-index bookings by ID for O(1) lookup
                        const bookingMap = new Map(b90.map(b => [b.id, b]));

                        return d90.map(d => {
                            const bk = d.booking_id ? bookingMap.get(d.booking_id) : undefined;
                            return {
                                id: d.id,
                                status: d.status,
                                created_at: d.created_at,
                                resolved_at: d.resolved_at,
                                booking_id: d.booking_id,
                                booking_price: bk?.price ?? null,
                                booking_currency: bk?.currency ?? null,
                            };
                        });
                    })()}
                />
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
            `}</style>
        </div>
    );
}
