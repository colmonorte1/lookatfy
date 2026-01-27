'use client';

import { useState } from 'react';
import { Withdrawal, FinancialSummary, requestWithdrawal } from '@/app/expert/withdrawals/actions';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { DollarSign, AlertCircle, CheckCircle, History, Info } from 'lucide-react';
import { BankAccount } from '@/app/expert/banks/actions';

interface Props {
    summary: FinancialSummary;
    withdrawals: Withdrawal[];
    banks: BankAccount[];
}

export default function WithdrawalModule({ summary, withdrawals, banks }: Props) {
    const [amount, setAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: summary.currency }).format(val);
    };

    const handleMaxAmount = () => {
        setAmount(summary.available.toString());
    };

    const handleSubmit = async () => {
        setError('');
        setSuccessMsg('');

        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setError('Ingresa un monto válido.');
            return;
        }
        if (Number(amount) > summary.available) {
            setError('No tienes suficiente saldo disponible.');
            return;
        }
        if (!selectedBank) {
            setError('Selecciona una cuenta bancaria.');
            return;
        }
        if (!acceptedTerms) {
            setError('Debes aceptar las condiciones de retiro.');
            return;
        }

        setIsSubmitting(true);
        const res = await requestWithdrawal(Number(amount), selectedBank);
        setIsSubmitting(false);

        if (res.error) {
            setError(res.error);
        } else {
            setSuccessMsg('Solicitud de retiro enviada correctamente.');
            setAmount('');
            setAcceptedTerms(false);
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Pagado';
            case 'approved': return 'Aprobado';
            case 'rejected': return 'Rechazado';
            case 'processing': return 'Procesando';
            default: return 'Pendiente';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* 1. Financial Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <SummaryCard title="Disponible neto" amount={summary.availableNetPreview} currency={summary.currency} icon={<DollarSign size={20} />} active />
                <SummaryCard title="Comisión plataforma" amount={summary.available * summary.commissionRate} currency={summary.currency} icon={<Info size={20} />} />
                <SummaryCard title="Total facturado" amount={summary.totalEarned} currency={summary.currency} icon={<History size={20} />} />
                <SummaryCard title="En disputa" amount={summary.inDispute} currency={summary.currency} icon={<AlertCircle size={20} />} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                
                {/* 2. Withdrawal Form */}
                <div style={{ 
                    background: 'rgb(var(--surface))', 
                    border: '1px solid rgb(var(--border))', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Solicitar Retiro</h3>
                    
                    {error && (
                        <div style={{ padding: '0.75rem', background: 'rgb(var(--error-bg))', color: 'rgb(var(--error))', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}

                    {successMsg && (
                        <div style={{ padding: '0.75rem', background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            {successMsg}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        
                        {/* Bank Selector */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Cuenta de destino</label>
                            <select 
                                value={selectedBank} 
                                onChange={(e) => setSelectedBank(e.target.value)}
                                style={{ 
                                    width: '100%', 
                                    padding: '0.75rem', 
                                    borderRadius: 'var(--radius-md)', 
                                    border: '1px solid rgb(var(--border))',
                                    background: 'rgb(var(--surface))',
                                    color: 'rgb(var(--text-main))'
                                }}
                            >
                                <option value="">Selecciona un banco...</option>
                                {banks.map(b => (
                                    <option key={b.id} value={b.id}>
                                        {b.bank} - *{b.account_number.slice(-4)} ({b.account_type})
                                    </option>
                                ))}
                            </select>
                            {banks.length === 0 && (
                                <p style={{ fontSize: '0.8rem', color: 'rgb(var(--warning))', marginTop: '0.5rem' }}>
                                    No tienes cuentas registradas. <a href="/expert/banks" style={{ textDecoration: 'underline' }}>Agregar cuenta</a>
                                </p>
                            )}
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Monto a retirar</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <Input 
                                        type="number" 
                                        placeholder="0.00" 
                                        value={amount} 
                                        onChange={(e) => setAmount(e.target.value)}
                                        min={0}
                                    />
                                </div>
                                <Button variant="outline" onClick={handleMaxAmount} type="button">Todo</Button>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginTop: '0.25rem' }}>
                                Máximo bruto: {formatCurrency(summary.available)} • Neto estimado: {formatCurrency(summary.availableNetPreview)}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginTop: '0.25rem' }}>
                                Si retiras {amount ? formatCurrency(Number(amount)) : formatCurrency(0)}, comisión: {formatCurrency((Number(amount||0)) * summary.commissionRate)} • recibes: {formatCurrency(Math.max(0, Number(amount||0) - (Number(amount||0) * summary.commissionRate)))}
                            </p>
                        </div>

                        {/* Conditions Box */}
                        <div style={{ 
                            padding: '1rem', 
                            background: 'rgb(var(--surface-hover))', 
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))'
                        }}>
                            <h4 style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Info size={16} /> Condiciones del retiro
                            </h4>
                            <ul style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', paddingLeft: '1.25rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                                <li>Periodo de verificación: 24–48 horas hábiles.</li>
                                <li>Frecuencia de pagos: Procesados semanalmente.</li>
                                <li>Tiempo de procesamiento bancario: 24–72 horas.</li>
                                <li>Sujeto a política de reversos y errores bancarios.</li>
                            </ul>
                            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input 
                                    type="checkbox" 
                                    checked={acceptedTerms} 
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    style={{ marginTop: '0.25rem' }}
                                />
                                <span>He leído y acepto los términos y condiciones de retiro de fondos.</span>
                            </label>
                        </div>

                        <Button 
                            onClick={handleSubmit} 
                            disabled={isSubmitting || !acceptedTerms || !selectedBank || Number(amount) <= 0 || Number(amount) > summary.available}
                            fullWidth
                        >
                            {isSubmitting ? 'Procesando...' : 'Solicitar Retiro'}
                        </Button>
                    </div>
                </div>

                {/* 3. Recent History */}
                <div style={{ 
                    background: 'rgb(var(--surface))', 
                    border: '1px solid rgb(var(--border))', 
                    borderRadius: 'var(--radius-lg)', 
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Historial Reciente</h3>
                    
                    {withdrawals.length === 0 ? (
                        <div style={{ color: 'rgb(var(--text-secondary))', textAlign: 'center', padding: '2rem' }}>
                            No hay retiros registrados.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {withdrawals.map((w) => (
                                <div key={w.id} style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    padding: '0.75rem',
                                    border: '1px solid rgb(var(--border))',
                                    borderRadius: 'var(--radius-md)'
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{formatCurrency(w.amount)}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                            {new Date(w.requested_at).toLocaleDateString()}
                                        </div>
                                        {w.transaction_ref && (
                                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                                Ref: {w.transaction_ref}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600, 
                                            padding: '0.25rem 0.5rem', 
                                            borderRadius: '1rem',
                                            display: 'inline-block',
                                            marginBottom: '0.25rem',
                                            // Quick inline styles for badge colors based on simple logic
                                            backgroundColor: w.status === 'paid' ? 'rgba(var(--success), 0.1)' : 
                                                             w.status === 'rejected' ? 'rgba(var(--error), 0.1)' : 'rgba(var(--warning), 0.1)',
                                            color: w.status === 'paid' ? 'rgb(var(--success))' : 
                                                   w.status === 'rejected' ? 'rgb(var(--error))' : 'rgb(var(--warning))'
                                        }}>
                                            {getStatusLabel(w.status)}
                                        </span>
                                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                            {w.bank_snapshot?.bank}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

function SummaryCard({ title, amount, currency, icon, active = false }: { title: string, amount: number, currency: string, icon: React.ReactNode, active?: boolean }) {
    return (
        <div style={{ 
            background: 'rgb(var(--surface))', 
            border: active ? '2px solid rgb(var(--primary))' : '1px solid rgb(var(--border))', 
            borderRadius: 'var(--radius-lg)', 
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', color: active ? 'rgb(var(--primary))' : 'rgb(var(--text-secondary))' }}>
                {icon}
                <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{title}</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(amount)}
            </div>
        </div>
    );
}
