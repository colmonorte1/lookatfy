"use client";

import { Button } from '@/components/ui/Button/Button';
import { Download } from 'lucide-react';

type TransactionView = {
    id: string;
    date: string;
    status: string;
    price: number;
    currency: string;
    userFullName?: string | null;
    expertFullName?: string | null;
    inDispute?: boolean;
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
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
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
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
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
                                                                'rgba(var(--error), 0.1)',
                                                    color: tx.status === 'completed' ? 'rgb(var(--success))' :
                                                        tx.status === 'confirmed' ? 'rgb(var(--primary))' :
                                                            tx.status === 'pending' ? 'rgb(var(--warning))' :
                                                                'rgb(var(--error))'
                                                }}>
                                                    {tx.status === 'confirmed' ? 'Confirmado' :
                                                        tx.status === 'completed' ? 'Completado' :
                                                            tx.status === 'pending' ? 'Pendiente' :
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
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
