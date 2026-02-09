"use client";

import { Button } from '@/components/ui/Button/Button';
import { Download, CheckCircle, XCircle, FileText } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateInvoicePDF, type InvoiceData } from '@/utils/generateInvoicePDF';

type TransactionView = {
    id: string;
    date: string;
    status: string;
    price: number;
    currency: string;
    userFullName?: string | null;
    expertFullName?: string | null;
    inDispute?: boolean;
    userEmail?: string | null;
    serviceName?: string | null;
    bookingDate?: string | null;
    bookingTime?: string | null;
};

type DisputeRow = { created_at: string; status: string };

export default function AdminPaymentsClient({
    transactions,
    commissionRate,
    disputedIds,
    disputes
}: {
    transactions: TransactionView[];
    commissionRate: number;
    disputedIds: string[];
    disputes: DisputeRow[];
}) {
    const router = useRouter();
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        bookingId: string;
        action: 'approve' | 'reject';
    } | null>(null);

    const exportCSV = () => {
        const headers = ['booking_id', 'date', 'user', 'expert', 'price', 'currency', 'fee', 'net', 'status', 'in_dispute'];
        const rows = transactions.map((t) => {
            const fee = t.price * commissionRate;
            const net = t.price - fee;
            const inDispute = disputedIds.includes(t.id);
            return [
                t.id,
                new Date(t.date).toISOString(),
                t.userFullName || '',
                t.expertFullName || '',
                t.price.toFixed(2),
                t.currency,
                fee.toFixed(2),
                net.toFixed(2),
                t.status,
                inDispute ? 'true' : 'false'
            ];
        });
        const csv = [headers.join(','), ...rows.map(r => r.map(val => typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val)).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payments_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const formatMoney = (n: number, currency: string) => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(n);

    const handleApprove = async (bookingId: string) => {
        setLoadingAction(bookingId);
        try {
            const response = await fetch(`/api/admin/payments/${bookingId}/approve`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al aprobar el pago');
            }

            // Refresh the page to show updated data
            router.refresh();
        } catch (error) {
            console.error('Error approving payment:', error);
            alert(error instanceof Error ? error.message : 'Error al aprobar el pago');
        } finally {
            setLoadingAction(null);
            setConfirmDialog(null);
        }
    };

    const handleReject = async (bookingId: string) => {
        setLoadingAction(bookingId);
        try {
            const response = await fetch(`/api/admin/payments/${bookingId}/reject`, {
                method: 'POST',
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al rechazar el pago');
            }

            // Refresh the page to show updated data
            router.refresh();
        } catch (error) {
            console.error('Error rejecting payment:', error);
            alert(error instanceof Error ? error.message : 'Error al rechazar el pago');
        } finally {
            setLoadingAction(null);
            setConfirmDialog(null);
        }
    };

    const handleDownloadInvoice = async (transaction: TransactionView) => {
        try {
            const fee = transaction.price * commissionRate;
            const netAmount = transaction.price - fee;

            const invoiceData: InvoiceData = {
                id: transaction.id,
                date: transaction.date,
                userName: transaction.userFullName || 'Usuario',
                userEmail: transaction.userEmail || undefined,
                expertName: transaction.expertFullName || 'Experto',
                serviceName: transaction.serviceName || undefined,
                price: transaction.price,
                currency: transaction.currency,
                fee: fee,
                netAmount: netAmount,
                status: transaction.status,
                bookingDate: transaction.bookingDate || undefined,
                bookingTime: transaction.bookingTime || undefined,
            };

            await generateInvoicePDF(invoiceData);
        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Error al generar la factura. Asegúrate de tener instalada la librería jspdf.');
        }
    };

    return (
        <div>
            {/* Header with export button */}
            <div style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgb(var(--border))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                    {transactions.length} transacción{transactions.length !== 1 ? 'es' : ''}
                </span>
                <Button variant="outline" size="sm" style={{ gap: '0.5rem' }} onClick={exportCSV}>
                    <Download size={16} />
                    Exportar CSV
                </Button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                    <thead>
                        <tr style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                            <th style={{ padding: '1rem' }}>ID Reserva</th>
                            <th style={{ padding: '1rem' }}>Fecha</th>
                            <th style={{ padding: '1rem' }}>Usuario</th>
                            <th style={{ padding: '1rem' }}>Experto</th>
                            <th style={{ padding: '1rem' }}>Monto</th>
                            <th style={{ padding: '1rem' }}>Fee ({Math.round(commissionRate * 100)}%)</th>
                            <th style={{ padding: '1rem' }}>Neto Experto</th>
                            <th style={{ padding: '1rem' }}>Estado</th>
                            <th style={{ padding: '1rem', textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                    No se encontraron transacciones.
                                </td>
                            </tr>
                        ) : (
                            transactions.map((tx) => {
                                const fee = tx.price * commissionRate;
                                const net = tx.price - fee;
                                const inDispute = disputedIds.includes(tx.id);

                                return (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.9rem' }}>
                                        <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'rgb(var(--primary))' }}>
                                            {tx.id.slice(0, 8)}...
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {new Date(tx.date).toLocaleDateString('es-CO', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 500 }}>
                                            {tx.userFullName || 'Desconocido'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {tx.expertFullName || 'Experto'}
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 700 }}>
                                            {formatMoney(tx.price, tx.currency)}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'rgb(var(--success))', fontWeight: 600 }}>
                                            +{formatMoney(fee, tx.currency)}
                                        </td>
                                        <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                            {formatMoney(net, tx.currency)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                <span style={{
                                                    textTransform: 'capitalize',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: '1rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    background: tx.status === 'completed' ? 'rgba(var(--success), 0.1)' :
                                                        tx.status === 'confirmed' ? 'rgba(var(--primary), 0.1)' :
                                                            tx.status === 'pending' ? 'rgba(var(--warning), 0.1)' :
                                                                tx.status === 'cancelled' ? 'rgba(var(--text-muted), 0.1)' :
                                                                    'rgba(var(--error), 0.1)',
                                                    color: tx.status === 'completed' ? 'rgb(var(--success))' :
                                                        tx.status === 'confirmed' ? 'rgb(var(--primary))' :
                                                            tx.status === 'pending' ? 'rgb(var(--warning))' :
                                                                tx.status === 'cancelled' ? 'rgb(var(--text-muted))' :
                                                                    'rgb(var(--error))'
                                                }}>
                                                    {tx.status === 'confirmed' ? 'Confirmado' :
                                                        tx.status === 'completed' ? 'Completado' :
                                                            tx.status === 'pending' ? 'Pendiente' :
                                                                tx.status === 'cancelled' ? 'Cancelado' :
                                                                    tx.status}
                                                </span>
                                                {inDispute && (
                                                    <span style={{
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '0.75rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        background: 'rgba(var(--error), 0.1)',
                                                        color: 'rgb(var(--error))'
                                                    }}>
                                                        En disputa
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center' }}>
                                                {/* Download Invoice Button */}
                                                <button
                                                    onClick={() => handleDownloadInvoice(tx)}
                                                    style={{
                                                        background: 'rgba(var(--primary), 0.1)',
                                                        border: '1px solid rgba(var(--primary), 0.3)',
                                                        borderRadius: 'var(--radius-md)',
                                                        padding: '0.5rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.background = 'rgba(var(--primary), 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.background = 'rgba(var(--primary), 0.1)';
                                                    }}
                                                    title="Descargar factura PDF"
                                                >
                                                    <FileText size={16} style={{ color: 'rgb(var(--primary))' }} />
                                                </button>

                                                {/* Approve/Reject buttons - only for pending/confirmed payments */}
                                                {(tx.status === 'pending' || tx.status === 'confirmed') && !inDispute && (
                                                    <>
                                                        <button
                                                            onClick={() => setConfirmDialog({ isOpen: true, bookingId: tx.id, action: 'approve' })}
                                                            disabled={loadingAction === tx.id}
                                                            style={{
                                                                background: 'rgba(var(--success), 0.1)',
                                                                border: '1px solid rgba(var(--success), 0.3)',
                                                                borderRadius: 'var(--radius-md)',
                                                                padding: '0.5rem',
                                                                cursor: loadingAction === tx.id ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                opacity: loadingAction === tx.id ? 0.5 : 1,
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (loadingAction !== tx.id) {
                                                                    e.currentTarget.style.background = 'rgba(var(--success), 0.2)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'rgba(var(--success), 0.1)';
                                                            }}
                                                            title="Aprobar pago"
                                                        >
                                                            <CheckCircle size={16} style={{ color: 'rgb(var(--success))' }} />
                                                        </button>

                                                        <button
                                                            onClick={() => setConfirmDialog({ isOpen: true, bookingId: tx.id, action: 'reject' })}
                                                            disabled={loadingAction === tx.id}
                                                            style={{
                                                                background: 'rgba(var(--error), 0.1)',
                                                                border: '1px solid rgba(var(--error), 0.3)',
                                                                borderRadius: 'var(--radius-md)',
                                                                padding: '0.5rem',
                                                                cursor: loadingAction === tx.id ? 'not-allowed' : 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                opacity: loadingAction === tx.id ? 0.5 : 1,
                                                                transition: 'all 0.2s'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (loadingAction !== tx.id) {
                                                                    e.currentTarget.style.background = 'rgba(var(--error), 0.2)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = 'rgba(var(--error), 0.1)';
                                                            }}
                                                            title="Rechazar pago"
                                                        >
                                                            <XCircle size={16} style={{ color: 'rgb(var(--error))' }} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Confirmation Dialog */}
            {confirmDialog?.isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={() => setConfirmDialog(null)}
                >
                    <div
                        style={{
                            background: 'rgb(var(--surface))',
                            borderRadius: 'var(--radius-lg)',
                            padding: '2rem',
                            maxWidth: '400px',
                            width: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            border: '1px solid rgb(var(--border))'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: confirmDialog.action === 'approve'
                                        ? 'rgba(var(--success), 0.1)'
                                        : 'rgba(var(--error), 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {confirmDialog.action === 'approve' ? (
                                    <CheckCircle size={24} style={{ color: 'rgb(var(--success))' }} />
                                ) : (
                                    <XCircle size={24} style={{ color: 'rgb(var(--error))' }} />
                                )}
                            </div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
                                {confirmDialog.action === 'approve' ? 'Aprobar Pago' : 'Rechazar Pago'}
                            </h3>
                        </div>

                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            {confirmDialog.action === 'approve'
                                ? '¿Estás seguro de que deseas aprobar este pago? Esta acción enviará notificaciones al usuario y al experto.'
                                : '¿Estás seguro de que deseas rechazar este pago? El usuario y el experto serán notificados de esta decisión.'}
                        </p>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outline"
                                onClick={() => setConfirmDialog(null)}
                                disabled={loadingAction !== null}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant={confirmDialog.action === 'approve' ? 'primary' : 'secondary'}
                                onClick={() => {
                                    if (confirmDialog.action === 'approve') {
                                        handleApprove(confirmDialog.bookingId);
                                    } else {
                                        handleReject(confirmDialog.bookingId);
                                    }
                                }}
                                disabled={loadingAction !== null}
                                style={{
                                    background: confirmDialog.action === 'reject' ? 'rgb(var(--error))' : undefined,
                                    color: confirmDialog.action === 'reject' ? 'white' : undefined
                                }}
                            >
                                {loadingAction !== null ? 'Procesando...' : confirmDialog.action === 'approve' ? 'Aprobar' : 'Rechazar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
