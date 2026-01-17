"use client";

import { DollarSign, TrendingUp, Calendar, CreditCard, ChevronDown } from 'lucide-react';

const EARNINGS_METRICS = [
    { label: 'Ingresos Totales', value: '$1,250', change: '+12%', icon: DollarSign, color: 'success' },
    { label: 'Mes Actual', value: '$450', change: '+5%', icon: TrendingUp, color: 'primary' },
    { label: 'Servicios Completados', value: '24', change: '+2', icon: Calendar, color: 'secondary' },
];

const TRANSACTIONS = [
    { id: 1, service: 'Asesoría de Estilo', client: 'Juan Pérez', date: '15 Ene 2024', amount: 45, status: 'paid' },
    { id: 2, service: 'Personal Shopper', client: 'María Lopez', date: '12 Ene 2024', amount: 80, status: 'paid' },
    { id: 3, service: 'Asesoría Tech', client: 'Carlos Ruiz', date: '10 Ene 2024', amount: 30, status: 'paid' },
    { id: 4, service: 'Revisión de Armario', client: 'Ana García', date: '05 Ene 2024', amount: 60, status: 'paid' },
    { id: 5, service: 'Asesoría de Imagen', client: 'Lucía Méndez', date: '02 Ene 2024', amount: 50, status: 'paid' },
];

export default function ExpertEarningsPage() {
    return (
        <div style={{ maxWidth: '1000px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mis Ganancias</h1>

            {/* KPIs Section */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                {EARNINGS_METRICS.map((metric, idx) => (
                    <div key={idx} style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex', alignItems: 'center', gap: '1rem'
                    }}>
                        <div style={{
                            width: '50px', height: '50px', borderRadius: '50%',
                            background: `rgba(var(--${metric.color}), 0.1)`,
                            color: `rgb(var(--${metric.color}))`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <metric.icon size={24} />
                        </div>
                        <div>
                            <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.875rem', fontWeight: 500 }}>{metric.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0.25rem 0' }}>{metric.value}</div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--success))', fontWeight: 600 }}>{metric.change} vs mes anterior</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Transaction History */}
            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                padding: '2rem'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Historial de Transacciones</h2>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        background: 'none', border: '1px solid rgb(var(--border))',
                        padding: '0.5rem 1rem', borderRadius: '2rem', cursor: 'pointer',
                        fontSize: '0.875rem', fontWeight: 500
                    }}>
                        Últimos 30 días <ChevronDown size={14} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
                        padding: '0.75rem 1rem',
                        background: 'rgb(var(--background))',
                        borderRadius: '8px',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem', fontWeight: 600, color: 'rgb(var(--text-secondary))'
                    }}>
                        <div>Servicio</div>
                        <div>Cliente</div>
                        <div>Fecha</div>
                        <div>Estado</div>
                        <div style={{ textAlign: 'right' }}>Monto</div>
                    </div>

                    {/* Rows */}
                    {TRANSACTIONS.map(tx => (
                        <div key={tx.id} style={{
                            display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr',
                            padding: '1rem',
                            borderBottom: '1px solid rgb(var(--border))',
                            alignItems: 'center', fontSize: '0.9rem'
                        }}>
                            <div style={{ fontWeight: 500 }}>{tx.service}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                    {tx.client.charAt(0)}
                                </div>
                                {tx.client}
                            </div>
                            <div style={{ color: 'rgb(var(--text-secondary))' }}>{tx.date}</div>
                            <div>
                                <span style={{
                                    background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))',
                                    padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600
                                }}>
                                    Pagado
                                </span>
                            </div>
                            <div style={{ textAlign: 'right', fontWeight: 700 }}>${tx.amount.toFixed(2)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
