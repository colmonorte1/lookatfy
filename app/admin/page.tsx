import { Users, Video, DollarSign, TrendingUp, LayoutDashboard } from 'lucide-react';

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

export default function AdminDashboardPage() {
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
                    value="1,234"
                    change="+12%"
                    icon={Users}
                    color="primary"
                />
                <KPICard
                    title="Expertos Activos"
                    value="56"
                    change="+3"
                    icon={Video}
                    color="secondary"
                />
                <KPICard
                    title="Ingresos del Mes"
                    value="$12,450"
                    change="+8.2%"
                    icon={DollarSign}
                    color="success"
                />
                <KPICard
                    title="Videollamadas Hoy"
                    value="24"
                    change="+15%"
                    icon={LayoutDashboard}
                    color="warning"
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
                Gráfico de Actividad (Placeholder)
            </div>
        </div>
    );
}
