"use client";

import { CreditCard, Download, ExternalLink, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

const PAYMENTS = [
    {
        id: 'INV-001',
        service: 'Asesoría de Estilo Virtual',
        expert: 'Laura García',
        date: '12 Ene 2024',
        amount: 45.00,
        status: 'paid',
        method: 'Visa •••• 4242'
    },
    {
        id: 'INV-002',
        service: 'Personal Shopper (Reserva)',
        expert: 'Pedro Martinez',
        date: '10 Ene 2024',
        amount: 80.00,
        status: 'paid',
        method: 'Mastercard •••• 8899'
    },
    {
        id: 'INV-003',
        service: 'Consulta Técnica',
        expert: 'Carlos Ruiz',
        date: '05 Ene 2024',
        amount: 30.00,
        status: 'refunded',
        method: 'PayPal'
    }
];

export default function UserPaymentsPage() {
    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Historial de Pagos</h1>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden' // For rounded corners on table
            }}>
                {/* Desktop Table View */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
                        <thead>
                            <tr style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                <th style={{ padding: '1rem' }}>Servicio / Experto</th>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Método</th>
                                <th style={{ padding: '1rem' }}>Estado</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Monto</th>
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Factura</th>
                            </tr>
                        </thead>
                        <tbody>
                            {PAYMENTS.map(payment => (
                                <tr key={payment.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.95rem' }}>
                                    <td style={{ padding: '1.25rem 1rem' }}>
                                        <div style={{ fontWeight: 600, color: 'rgb(var(--text-main))' }}>{payment.service}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>{payment.expert}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Calendar size={14} /> {payment.date}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                            <CreditCard size={16} color="rgb(var(--text-muted))" />
                                            {payment.method}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        {payment.status === 'paid' && (
                                            <span style={{
                                                background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))',
                                                padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600
                                            }}>
                                                Pagado
                                            </span>
                                        )}
                                        {payment.status === 'refunded' && (
                                            <span style={{
                                                background: 'rgba(var(--text-secondary), 0.1)', color: 'rgb(var(--text-secondary))',
                                                padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600
                                            }}>
                                                Reembolsado
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 700 }}>
                                        ${payment.amount.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                        <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--primary))' }}>
                                            <Download size={18} />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
