"use client";

import { Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

const WITHDRAWALS = [
    { id: 1, expert: 'Laura García', amount: 450.00, method: 'Bank Transfer', account: 'ES91 **** 1234', date: '2024-01-16', status: 'pending' },
    { id: 2, expert: 'Pedro Martinez', amount: 1200.00, method: 'PayPal', account: 'pedro@email.com', date: '2024-01-15', status: 'pending' },
    { id: 3, expert: 'Carlos Ruiz', amount: 150.00, method: 'Bank Transfer', account: 'ES12 **** 9999', date: '2024-01-10', status: 'approved' },
];

export default function AdminWithdrawalsPage() {
    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Solicitudes de Retiro</h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {WITHDRAWALS.map(request => (
                    <div key={request.id} style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '50%',
                                background: 'rgb(var(--surface-hover))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700
                            }}>
                                {request.expert.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{request.expert}</div>
                                <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {request.method} • {request.account}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                                    Solicitado el {request.date}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>${request.amount.toFixed(2)}</div>

                            {request.status === 'pending' ? (
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button variant="outline" size="sm" style={{ borderColor: 'rgb(var(--error))', color: 'rgb(var(--error))' }}>
                                        <X size={18} style={{ marginRight: '0.5rem' }} /> Rechazar
                                    </Button>
                                    <Button size="sm" style={{ background: 'rgb(var(--success))', borderColor: 'rgb(var(--success))' }}>
                                        <Check size={18} style={{ marginRight: '0.5rem' }} /> Aprobar Pago
                                    </Button>
                                </div>
                            ) : (
                                <span style={{
                                    padding: '0.5rem 1rem', borderRadius: '2rem',
                                    background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))',
                                    fontWeight: 600, fontSize: '0.9rem'
                                }}>
                                    Aprobado
                                </span>
                            )}
                        </div>
                    </div>
                ))}

                {WITHDRAWALS.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                        No hay solicitudes pendientes.
                    </div>
                )}
            </div>
        </div>
    );
}
