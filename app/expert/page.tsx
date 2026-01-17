import { DollarSign, Calendar, Clock, Star, TrendingUp } from 'lucide-react';

const KPICard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div style={{
        background: 'rgb(var(--surface))',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid rgb(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: `rgba(var(--${color}), 0.1)`,
                color: `rgb(var(--${color}))`
            }}>
                <Icon size={24} />
            </div>
            {subtext && (
                <span style={{
                    fontSize: '0.875rem',
                    color: 'rgb(var(--text-muted))',
                }}>
                    {subtext}
                </span>
            )}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(var(--text-main))' }}>
            {value}
        </div>
        <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.875rem', fontWeight: 500 }}>
            {title}
        </div>
    </div>
);

export default function ExpertDashboardPage() {
    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Hola, Ana 👋</h1>
                <p style={{ color: 'rgb(var(--text-secondary))' }}>Aquí tienes el resumen de tu actividad.</p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <KPICard
                    title="Ingresos este mes"
                    value="$850.00"
                    subtext="+12% vs mes anterior"
                    icon={DollarSign}
                    color="success"
                />
                <KPICard
                    title="Próximas Reservas"
                    value="4"
                    subtext="Hoy: 2 citas"
                    icon={Calendar}
                    color="primary"
                />
                <KPICard
                    title="Horas Realizadas"
                    value="12.5h"
                    subtext="Total histórico"
                    icon={Clock}
                    color="secondary"
                />
                <KPICard
                    title="Calificación"
                    value="4.9"
                    subtext="Base en 45 reseñas"
                    icon={Star}
                    color="warning"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '2rem' }}>
                {/* Placeholder for Revenue Chart */}
                <div style={{
                    background: 'rgb(var(--surface))',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid rgb(var(--border))',
                    minHeight: '300px'
                }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Rendimiento Mensual</h3>
                    <div style={{
                        height: '250px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgb(var(--text-muted))',
                        background: 'rgb(var(--surface-hover))',
                        borderRadius: 'var(--radius-md)'
                    }}>
                        Gráfico de Ingresos
                    </div>
                </div>

                {/* Upcoming Appointments List Placeholder */}
                <div style={{
                    background: 'rgb(var(--surface))',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    border: '1px solid rgb(var(--border))'
                }}>
                    <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Próximas Citas</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} style={{
                                display: 'flex',
                                gap: '1rem',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                background: 'rgb(var(--surface-hover))'
                            }}>
                                <div style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgb(var(--surface))', padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                                    border: '1px solid rgb(var(--border))', minWidth: '50px'
                                }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgb(var(--text-secondary))' }}>ENE</span>
                                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>{16 + i}</span>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600 }}>Consulta Tech</div>
                                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>10:00 AM - 11:00 AM</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
