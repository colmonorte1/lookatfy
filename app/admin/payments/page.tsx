"use client";

import { DollarSign, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';

const TRANSACTIONS = [
    { id: 'TXN-001', date: '2024-01-15', user: 'Ana Lopez', expert: 'Laura García', amount: 45.00, platformFee: 4.50, status: 'completed' },
    { id: 'TXN-002', date: '2024-01-16', user: 'Juan Pérez', expert: 'Pedro Martinez', amount: 80.00, platformFee: 8.00, status: 'completed' },
    { id: 'TXN-003', date: '2024-01-16', user: 'Maria Vega', expert: 'Carlos Ruiz', amount: 25.00, platformFee: 2.50, status: 'pending' },
    { id: 'TXN-004', date: '2024-01-14', user: 'Sofia Lopez', expert: 'Laura García', amount: 120.00, platformFee: 12.00, status: 'completed' },
    { id: 'TXN-005', date: '2024-01-12', user: 'Test User', expert: 'Expert One', amount: 30.00, platformFee: 3.00, status: 'refunded' },
];

export default function AdminPaymentsPage() {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Pagos y Transacciones</h1>
                <Button variant="outline" style={{ gap: '0.5rem' }}>
                    <Download size={18} /> Exportar CSV
                </Button>
            </div>

            {/* Metrics Quick View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Volumen Total (Mes)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>$4,250.00</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Comisiones Plataforma</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'rgb(var(--success))' }}>$425.00</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Transacciones</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>142</div>
                </div>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                        <Input placeholder="Buscar por ID, usuario o experto..." icon={<Search size={18} />} />
                    </div>
                    <Button variant="outline" style={{ gap: '0.5rem' }}>
                        <Filter size={18} /> Filtros
                    </Button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                            <th style={{ padding: '1rem' }}>ID Transacción</th>
                            <th style={{ padding: '1rem' }}>Fecha</th>
                            <th style={{ padding: '1rem' }}>Usuario</th>
                            <th style={{ padding: '1rem' }}>Experto</th>
                            <th style={{ padding: '1rem' }}>Monto</th>
                            <th style={{ padding: '1rem' }}>Fee (10%)</th>
                            <th style={{ padding: '1rem' }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TRANSACTIONS.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.9rem' }}>
                                <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{tx.id}</td>
                                <td style={{ padding: '1rem' }}>{tx.date}</td>
                                <td style={{ padding: '1rem', fontWeight: 500 }}>{tx.user}</td>
                                <td style={{ padding: '1rem' }}>{tx.expert}</td>
                                <td style={{ padding: '1rem', fontWeight: 700 }}>${tx.amount.toFixed(2)}</td>
                                <td style={{ padding: '1rem', color: 'rgb(var(--success))', fontWeight: 600 }}>+${tx.platformFee.toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        textTransform: 'capitalize',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.8rem',
                                        fontWeight: 600,
                                        background: tx.status === 'completed' ? 'rgba(var(--success), 0.1)' :
                                            tx.status === 'pending' ? 'rgba(var(--warning), 0.1)' :
                                                'rgba(var(--error), 0.1)',
                                        color: tx.status === 'completed' ? 'rgb(var(--success))' :
                                            tx.status === 'pending' ? 'rgb(var(--warning))' :
                                                'rgb(var(--error))'
                                    }}>
                                        {tx.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
