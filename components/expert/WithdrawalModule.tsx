'use client';

import { useState, useMemo } from 'react';
import { Withdrawal, FinancialSummary, requestWithdrawal } from '@/app/expert/withdrawals/actions';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { DollarSign, AlertCircle, CheckCircle, History, Info, X, Loader2, Clock, XCircle, TrendingUp, Search, Filter, Calendar } from 'lucide-react';
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

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Filter and search state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: summary.currency }).format(val);
    };

    // Toast notification function
    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Quick amount buttons
    const handleQuickAmount = (percentage: number) => {
        const quickAmount = summary.available * percentage;
        setAmount(quickAmount.toFixed(2));
    };

    const handleMaxAmount = () => {
        setAmount(summary.available.toString());
    };

    // Open confirmation modal (validation first)
    const handleOpenConfirmModal = () => {
        // Validation
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            showToast('Ingresa un monto válido mayor a 0', 'warning');
            return;
        }
        if (Number(amount) < MINIMUM_WITHDRAWAL) {
            showToast(`El monto mínimo para retiro es ${formatCurrency(MINIMUM_WITHDRAWAL)}`, 'warning');
            return;
        }
        if (Number(amount) > summary.available) {
            showToast(`El monto máximo disponible es ${formatCurrency(summary.available)}`, 'warning');
            return;
        }
        if (!selectedBank) {
            showToast('Selecciona una cuenta bancaria de destino', 'warning');
            return;
        }
        if (!acceptedTerms) {
            showToast('Debes aceptar las condiciones de retiro', 'warning');
            return;
        }

        // All validations passed, show confirmation modal
        setShowConfirmModal(true);
    };

    // Actual withdrawal submission
    const handleConfirmWithdrawal = async () => {
        setShowConfirmModal(false);
        setIsSubmitting(true);

        try {
            const res = await requestWithdrawal(Number(amount), selectedBank);

            if (res.error) {
                showToast(res.error, 'error');
            } else {
                showToast('¡Solicitud de retiro enviada exitosamente! Será procesada en 24-48 horas.', 'success');
                setAmount('');
                setAcceptedTerms(false);
                setSelectedBank('');
            }
        } catch (error) {
            showToast('Error al procesar el retiro. Por favor, intenta nuevamente.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate KPIs from withdrawals
    const kpis = useMemo(() => {
        const totalWithdrawn = withdrawals
            .filter(w => w.status === 'paid')
            .reduce((sum, w) => sum + w.amount, 0);

        const totalRequested = withdrawals.reduce((sum, w) => sum + w.amount, 0);

        const successCount = withdrawals.filter(w => w.status === 'paid').length;
        const totalCount = withdrawals.length;
        const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;

        const avgWithdrawal = successCount > 0 ? totalWithdrawn / successCount : 0;

        const pendingCount = withdrawals.filter(w => ['pending', 'processing', 'approved'].includes(w.status)).length;

        return {
            totalWithdrawn,
            totalRequested,
            successRate,
            avgWithdrawal,
            pendingCount
        };
    }, [withdrawals]);

    // Filter and search withdrawals
    const filteredWithdrawals = useMemo(() => {
        let filtered = [...withdrawals];

        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(w => w.status === filterStatus);
        }

        // Apply search
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filtered.filter(w =>
                w.transaction_ref?.toLowerCase().includes(search) ||
                w.bank_snapshot?.bank?.toLowerCase().includes(search) ||
                w.bank_snapshot?.account_number?.includes(search)
            );
        }

        return filtered;
    }, [withdrawals, filterStatus, searchTerm]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Pagado';
            case 'approved': return 'Aprobado';
            case 'rejected': return 'Rechazado';
            case 'processing': return 'Procesando';
            default: return 'Pendiente';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid': return <CheckCircle size={14} />;
            case 'approved': return <CheckCircle size={14} />;
            case 'rejected': return <XCircle size={14} />;
            case 'processing': return <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />;
            default: return <Clock size={14} />;
        }
    };

    const getProcessingTimeInfo = (status: string, requestedAt: string) => {
        const daysSince = Math.floor((Date.now() - new Date(requestedAt).getTime()) / (1000 * 60 * 60 * 24));

        switch (status) {
            case 'pending':
                return { text: 'Verificación en proceso (24-48h)', color: 'rgb(var(--warning))' };
            case 'processing':
                return { text: 'Procesando transferencia', color: 'rgb(var(--primary))' };
            case 'approved':
                return { text: 'Aprobado, transferencia pendiente', color: 'rgb(var(--success))' };
            case 'paid':
                return { text: `Completado (${daysSince} día${daysSince !== 1 ? 's' : ''})`, color: 'rgb(var(--success))' };
            case 'rejected':
                return { text: 'Rechazado', color: 'rgb(var(--error))' };
            default:
                return { text: 'Pendiente', color: 'rgb(var(--text-muted))' };
        }
    };

    const MINIMUM_WITHDRAWAL = 5000; // Minimum in summary.currency

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* 1. Financial Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <SummaryCard title="Disponible neto" amount={summary.availableNetPreview} currency={summary.currency} icon={<DollarSign size={20} />} active />
                <SummaryCard title="Comisión plataforma" amount={summary.available * summary.commissionRate} currency={summary.currency} icon={<Info size={20} />} />
                <SummaryCard title="Total facturado" amount={summary.totalEarned} currency={summary.currency} icon={<History size={20} />} />
                <SummaryCard title="En disputa" amount={summary.inDispute} currency={summary.currency} icon={<AlertCircle size={20} />} />
            </div>

            {/* KPIs Dashboard */}
            {withdrawals.length > 0 && (
                <div style={{
                    background: 'rgb(var(--surface))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem'
                }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} /> Estadísticas de Retiros
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Total Retirado
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'rgb(var(--success))' }}>
                                {formatCurrency(kpis.totalWithdrawn)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                                De {withdrawals.filter(w => w.status === 'paid').length} retiro{withdrawals.filter(w => w.status === 'paid').length !== 1 ? 's' : ''} exitoso{withdrawals.filter(w => w.status === 'paid').length !== 1 ? 's' : ''}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Promedio por Retiro
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                {formatCurrency(kpis.avgWithdrawal)}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                                Por transacción exitosa
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Tasa de Éxito
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: kpis.successRate >= 80 ? 'rgb(var(--success))' : 'rgb(var(--warning))' }}>
                                {kpis.successRate.toFixed(1)}%
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                                {withdrawals.filter(w => w.status === 'paid').length} de {withdrawals.length} solicitudes
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem', fontWeight: 500 }}>
                                Pendientes
                            </div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'rgb(var(--warning))' }}>
                                {kpis.pendingCount}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.25rem' }}>
                                En proceso o aprobados
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <label style={{ fontWeight: 500, fontSize: '0.9rem' }}>Monto a retirar</label>
                                <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Info size={12} />
                                    Mín: {formatCurrency(MINIMUM_WITHDRAWAL)}
                                </div>
                            </div>

                            {/* Quick Amount Buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                <Button
                                    variant="outline"
                                    onClick={() => handleQuickAmount(0.25)}
                                    type="button"
                                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                >
                                    25%
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleQuickAmount(0.50)}
                                    type="button"
                                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                >
                                    50%
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleQuickAmount(0.75)}
                                    type="button"
                                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                >
                                    75%
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleMaxAmount}
                                    type="button"
                                    style={{ fontSize: '0.85rem', padding: '0.5rem' }}
                                >
                                    100%
                                </Button>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <div style={{ flex: 1 }}>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min={0}
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>
                                Disponible: {formatCurrency(summary.available)} • Neto estimado: {formatCurrency(summary.availableNetPreview)}
                            </p>
                            {amount && Number(amount) > 0 && (
                                <div style={{
                                    marginTop: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(var(--primary), 0.05)',
                                    border: '1px solid rgba(var(--primary), 0.2)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.8rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span>Monto bruto:</span>
                                        <strong>{formatCurrency(Number(amount))}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', color: 'rgb(var(--warning))' }}>
                                        <span>Comisión ({(summary.commissionRate * 100).toFixed(1)}%):</span>
                                        <strong>-{formatCurrency(Number(amount) * summary.commissionRate)}</strong>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid rgb(var(--border))', color: 'rgb(var(--primary))', fontWeight: 600 }}>
                                        <span>Recibirás:</span>
                                        <strong>{formatCurrency(Number(amount) - (Number(amount) * summary.commissionRate))}</strong>
                                    </div>
                                </div>
                            )}
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
                            onClick={handleOpenConfirmModal}
                            disabled={isSubmitting || !acceptedTerms || !selectedBank || !amount || Number(amount) <= 0}
                            fullWidth
                            style={{ gap: '0.5rem' }}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                    Procesando...
                                </>
                            ) : (
                                'Solicitar Retiro'
                            )}
                        </Button>
                    </div>
                </div>

                {/* 3. Withdrawal History with Filters */}
                <div style={{
                    background: 'rgb(var(--surface))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Historial de Retiros</h3>
                        <Button
                            variant="ghost"
                            onClick={() => setShowFilters(!showFilters)}
                            style={{ gap: '0.5rem', fontSize: '0.85rem' }}
                        >
                            <Filter size={16} />
                            {showFilters ? 'Ocultar filtros' : 'Filtros'}
                        </Button>
                    </div>

                    {/* Filters Section */}
                    {showFilters && (
                        <div style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            background: 'rgb(var(--background))',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))'
                        }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {/* Search */}
                                <div style={{ position: 'relative' }}>
                                    <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--text-muted))' }} />
                                    <input
                                        type="text"
                                        placeholder="Buscar por referencia, banco o cuenta..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.5rem 0.75rem 0.5rem 2.5rem',
                                            border: '1px solid rgb(var(--border))',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'rgb(var(--surface))',
                                            fontSize: '0.85rem'
                                        }}
                                    />
                                </div>

                                {/* Status Filter */}
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, minWidth: '60px' }}>Estado:</span>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem 0.75rem',
                                            border: '1px solid rgb(var(--border))',
                                            borderRadius: 'var(--radius-md)',
                                            background: 'rgb(var(--surface))',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        <option value="all">Todos</option>
                                        <option value="pending">Pendientes</option>
                                        <option value="processing">Procesando</option>
                                        <option value="approved">Aprobados</option>
                                        <option value="paid">Pagados</option>
                                        <option value="rejected">Rechazados</option>
                                    </select>
                                </div>

                                {(searchTerm || filterStatus !== 'all') && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            setSearchTerm('');
                                            setFilterStatus('all');
                                        }}
                                        style={{ fontSize: '0.85rem', gap: '0.5rem', alignSelf: 'flex-start' }}
                                    >
                                        <X size={14} />
                                        Limpiar filtros
                                    </Button>
                                )}

                                <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))' }}>
                                    Mostrando {filteredWithdrawals.length} de {withdrawals.length} retiros
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Withdrawal List */}
                    {withdrawals.length === 0 ? (
                        <div style={{ color: 'rgb(var(--text-secondary))', textAlign: 'center', padding: '2rem' }}>
                            No hay retiros registrados.
                        </div>
                    ) : filteredWithdrawals.length === 0 ? (
                        <div style={{ color: 'rgb(var(--text-secondary))', textAlign: 'center', padding: '2rem' }}>
                            No se encontraron retiros con los filtros aplicados.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredWithdrawals.map((w) => {
                                const timeInfo = getProcessingTimeInfo(w.status, w.requested_at);
                                return (
                                    <div key={w.id} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        padding: '1rem',
                                        border: '1px solid rgb(var(--border))',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgb(var(--background))'
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
                                                {formatCurrency(w.amount)}
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Calendar size={12} />
                                                    {new Date(w.requested_at).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                </div>
                                                {w.transaction_ref && (
                                                    <div>Ref: {w.transaction_ref}</div>
                                                )}
                                                <div>{w.bank_snapshot?.bank} - *{w.bank_snapshot?.account_number?.slice(-4)}</div>
                                            </div>
                                        </div>

                                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                                            {/* Status Badge with Icon */}
                                            <span style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                padding: '0.375rem 0.75rem',
                                                borderRadius: '1rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.375rem',
                                                backgroundColor: w.status === 'paid' ? 'rgba(var(--success), 0.15)' :
                                                    w.status === 'rejected' ? 'rgba(var(--error), 0.15)' :
                                                        w.status === 'approved' ? 'rgba(var(--success), 0.1)' : 'rgba(var(--warning), 0.15)',
                                                color: w.status === 'paid' ? 'rgb(var(--success))' :
                                                    w.status === 'rejected' ? 'rgb(var(--error))' :
                                                        w.status === 'approved' ? 'rgb(var(--success))' : 'rgb(var(--warning))'
                                            }}>
                                                {getStatusIcon(w.status)}
                                                {getStatusLabel(w.status)}
                                            </span>

                                            {/* Processing Time Indicator */}
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: timeInfo.color,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.375rem'
                                            }}>
                                                <Clock size={12} />
                                                {timeInfo.text}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem'
                    }}
                    onClick={() => setShowConfirmModal(false)}
                >
                    <div
                        style={{
                            background: 'rgb(var(--background))',
                            padding: '2rem',
                            borderRadius: 'var(--radius-lg)',
                            maxWidth: '500px',
                            width: '100%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Confirmar Retiro</h2>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'rgb(var(--text-secondary))',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 'var(--radius-md)'
                                }}
                                title="Cerrar"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{
                            background: 'rgb(var(--surface))',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgb(var(--border))',
                            padding: '1.5rem',
                            marginBottom: '1.5rem'
                        }}>
                            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                DESGLOSE DEL RETIRO
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                    <span>Monto solicitado:</span>
                                    <strong>{formatCurrency(Number(amount))}</strong>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', color: 'rgb(var(--warning))' }}>
                                    <span>Comisión plataforma ({(summary.commissionRate * 100).toFixed(1)}%):</span>
                                    <strong>-{formatCurrency(Number(amount) * summary.commissionRate)}</strong>
                                </div>

                                <div style={{ height: '1px', background: 'rgb(var(--border))', margin: '0.5rem 0' }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, color: 'rgb(var(--primary))' }}>
                                    <span>Total a recibir:</span>
                                    <span>{formatCurrency(Number(amount) - (Number(amount) * summary.commissionRate))}</span>
                                </div>

                                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                    <div style={{ marginBottom: '0.25rem' }}>
                                        <strong>Cuenta destino:</strong> {banks.find(b => b.id === selectedBank)?.bank}
                                    </div>
                                    <div>
                                        <strong>Cuenta:</strong> *{banks.find(b => b.id === selectedBank)?.account_number.slice(-4)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            padding: '1rem',
                            background: 'rgba(var(--primary), 0.08)',
                            border: '1px solid rgba(var(--primary), 0.2)',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '1.5rem',
                            fontSize: '0.85rem',
                            lineHeight: '1.5'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                <Info size={16} style={{ marginTop: '2px', flexShrink: 0, color: 'rgb(var(--primary))' }} />
                                <div>
                                    <strong>Tiempo de procesamiento:</strong>
                                    <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', marginBottom: 0 }}>
                                        <li>Verificación: 24-48 horas hábiles</li>
                                        <li>Transferencia bancaria: 24-72 horas adicionales</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmModal(false)}
                                style={{ flex: 1 }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirmWithdrawal}
                                style={{ flex: 1, gap: '0.5rem' }}
                            >
                                <CheckCircle size={18} />
                                Confirmar Retiro
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    right: '1.5rem',
                    background: toast.type === 'success' ? 'rgb(var(--success))' : toast.type === 'warning' ? 'rgb(var(--warning))' : 'rgb(var(--error))',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 9999,
                    maxWidth: '400px',
                    fontWeight: 500,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.message}
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
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
