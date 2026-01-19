import { Users, Video, DollarSign, TrendingUp, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

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

    // Fetch real counts
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: expertsCount } = await supabase.from('experts').select('*', { count: 'exact', head: true });

    // We don't have real payments yet, so we mock or use bookings count
    const { count: bookingsCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });

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
                    title="Reservas Totales"
                    value={bookingsCount || 0}
                    change="N/A"
                    icon={LayoutDashboard}
                    color="warning"
                />
                <KPICard
                    title="Ingresos Estimados"
                    value={`$${(bookingsCount || 0) * 50}`} // Mock avg price
                    change="N/A"
                    icon={DollarSign}
                    color="success"
                />
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                border: '1px solid rgb(var(--border))',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgb(var(--text-muted))'
            }}>
                Gráfico de Actividad (Próximamente con datos reales)
            </div>
        </div>
    );
}
