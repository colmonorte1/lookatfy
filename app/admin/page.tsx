import { Users, Video, DollarSign, TrendingUp, LayoutDashboard, AlertTriangle, Percent, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

const KPICard = ({ title, value, change, icon: Icon, color }: any) => (
    <div style={{
        background: 'rgb(var(--surface))',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid rgb(var(--border))'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: `rgba(var(--${color}), 0.1)`,
                color: `rgb(var(--${color}))`
            }}>
                <Icon size={24} />
            </div>
            {change && (
                <span style={{
                    fontSize: '0.875rem',
                    color: 'rgb(var(--success))',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                }}>
                    <TrendingUp size={14} />
                    {change}
                </span>
            )}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.25rem', color: 'rgb(var(--text-main))' }}>
            {value}
        </div>
        <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.875rem' }}>
            {title}
        </div>
    </div>
);

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: expertsCount } = await supabase.from('experts').select('*', { count: 'exact', head: true });

    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('commission_percentage')
        .single();
    const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;

    const start30 = new Date();
    start30.setDate(start30.getDate() - 30);
    const start30ISO = start30.toISOString();

    const start90 = new Date();
    start90.setDate(start90.getDate() - 90);
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

    const b90 = (bookings90 || []).map((b: any) => ({
        id: b.id as string,
        price: Number(b.price) || 0,
        currency: b.currency || 'USD',
        status: b.status as string,
        created_at: b.created_at as string,
        user_id: b.user_id as string,
        expert_id: b.expert_id as string,
        expert_name: b.expert?.profile?.full_name || null,
        service_category: b.service?.category ?? null,
        service_country: b.service?.country ?? null,
        service_rating_avg: b.service?.rating_avg ?? null,
    }));

    const volume30 = b90.filter(x => new Date(x.created_at) >= start30).reduce((sum, x) => sum + x.price, 0);
    const fees30 = volume30 * commissionRate;
    const txCount30 = b90.filter(x => new Date(x.created_at) >= start30).length;
    const completed30 = b90.filter(x => new Date(x.created_at) >= start30 && x.status === 'completed').length;
    const completionRate30 = txCount30 ? (completed30 / txCount30) : 0;
    const uniqueUsers30 = new Set(b90.filter(x => new Date(x.created_at) >= start30).map(x => x.user_id)).size;
    const uniqueExperts30 = new Set(b90.filter(x => new Date(x.created_at) >= start30).map(x => x.expert_id)).size;

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
    const disputesRate30 = txCount30 ? (d30.length / txCount30) : 0;
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
                    change="+0%"
                    icon={Users}
                    color="primary"
                />
                <KPICard
                    title="Expertos Activos"
                    value={expertsCount || 0}
                    change={expertsCount ? "+100%" : "0%"}
                    icon={Video}
                    color="secondary"
                />
                <KPICard
                    title="Transacciones 30 días"
                    value={txCount30}
                    change={txCount30 ? "+" : "0%"}
                    icon={LayoutDashboard}
                    color="warning"
                />
                <KPICard
                    title="Volumen 30 días"
                    value={formatMoney(volume30)}
                    change={txCount30 ? "+" : "0%"}
                    icon={DollarSign}
                    color="success"
                />
                <KPICard
                    title={`Comisiones (${Math.round(commissionRate * 100)}%) 30 días`}
                    value={formatMoney(fees30)}
                    change={txCount30 ? "+" : "0%"}
                    icon={DollarSign}
                    color="success"
                />
                <KPICard
                    title="Finalización 30 días"
                    value={formatPct(completionRate30)}
                    change=""
                    icon={Percent}
                    color="secondary"
                />
                <KPICard
                    title="Expertos activos 30 días"
                    value={uniqueExperts30}
                    change=""
                    icon={Video}
                    color="primary"
                />
                <KPICard
                    title="ARPU 30 días"
                    value={uniqueUsers30 ? formatMoney(volume30 / uniqueUsers30) : formatMoney(0)}
                    change=""
                    icon={DollarSign}
                    color="primary"
                />
                <KPICard
                    title="Disputas activas"
                    value={activeDisputesCount}
                    change=""
                    icon={AlertTriangle}
                    color="warning"
                />
                <KPICard
                    title="Tasa de disputa 30 días"
                    value={formatPct(disputesRate30)}
                    change=""
                    icon={AlertTriangle}
                    color="warning"
                />
                <KPICard
                    title="Tiempo medio resolución"
                    value={`${avgResolutionDays.toFixed(1)} días`}
                    change=""
                    icon={Clock}
                    color="secondary"
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
                    disputes={d90.map(d => {
                        const bk = b90.find(x => x.id === d.booking_id);
                        return {
                            id: d.id,
                            status: d.status,
                            created_at: d.created_at,
                            resolved_at: d.resolved_at,
                            booking_id: d.booking_id,
                            booking_price: bk?.price ?? null,
                            booking_currency: bk?.currency ?? null,
                        };
                    })}
                />
            </div>
        </div>
    );
}
