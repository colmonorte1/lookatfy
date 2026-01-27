"use client";

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Search } from 'lucide-react';

type TransactionView = {
  id: string;
  date: string;
  status: string;
  price: number;
  currency: string;
  userFullName?: string;
  expertFullName?: string;
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
  const [query, setQuery] = useState('');
  const [onlyDisputed, setOnlyDisputed] = useState(false);
  const [onlyCompleted, setOnlyCompleted] = useState(false);
  const [last30Days, setLast30Days] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      if (onlyDisputed && !disputedIds.includes(t.id)) return false;
      if (onlyCompleted && t.status !== 'completed') return false;
      if (last30Days) {
        const d = new Date(t.date);
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 30);
        if (isNaN(d.getTime()) || d < cutoff) return false;
      }
      if (!q) return true;
      const haystack = `${t.id} ${t.userFullName || ''} ${t.expertFullName || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [transactions, query, onlyDisputed, onlyCompleted, last30Days, disputedIds]);

  const exportCSV = () => {
    const headers = ['booking_id', 'date', 'user', 'expert', 'price', 'currency', 'fee', 'net', 'status', 'in_dispute'];
    const rows = filtered.map((t) => {
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

  const weeklyTrend = useMemo(() => {
    // last 8 weeks
    const buckets: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i * 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const count = disputes.filter((d) => {
        const ts = new Date(d.created_at).getTime();
        return ts >= start.getTime() && ts < end.getTime() && (d.status === 'open' || d.status === 'under_review');
      }).length;
      buckets.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, count });
    }
    return buckets;
  }, [disputes]);

  const monthlyTrend = useMemo(() => {
    // last 6 months
    const buckets: { label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.getMonth();
      const year = d.getFullYear();
      const count = disputes.filter((x) => {
        const dx = new Date(x.created_at);
        return dx.getFullYear() === year && dx.getMonth() === month && (x.status === 'open' || x.status === 'under_review');
      }).length;
      buckets.push({ label: `${year}-${String(month + 1).padStart(2, '0')}`, count });
    }
    return buckets;
  }, [disputes]);

  const formatMoney = (n: number, currency: string) => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(n);

  return (
    <div>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Input placeholder="Buscar por ID, usuario o experto..." icon={<Search size={18} />} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={onlyDisputed} onChange={(e) => setOnlyDisputed(e.target.checked)} /> Solo en disputa
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={onlyCompleted} onChange={(e) => setOnlyCompleted(e.target.checked)} /> Solo completadas
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" checked={last30Days} onChange={(e) => setLast30Days(e.target.checked)} /> Últimos 30 días
        </label>
        <Button variant="outline" style={{ gap: '0.5rem' }} onClick={exportCSV}>Exportar CSV</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', gap: '1rem', padding: '1rem' }}>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Disputas por semana (8 semanas)</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            {weeklyTrend.map((b, i) => (
              <div key={i} title={`${b.label}: ${b.count}`} style={{ width: '28px', height: `${Math.min(8, b.count) * 12}px`, background: 'rgba(var(--error), 0.15)', border: '1px solid rgb(var(--error))', borderRadius: '4px' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgb(var(--text-secondary))' }}>
            {weeklyTrend.map((b, i) => (<span key={i}>{b.label}</span>))}
          </div>
        </div>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Disputas por mes (6 meses)</div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            {monthlyTrend.map((b, i) => (
              <div key={i} title={`${b.label}: ${b.count}`} style={{ width: '40px', height: `${Math.min(12, b.count) * 10}px`, background: 'rgba(var(--warning), 0.15)', border: '1px solid rgb(var(--warning))', borderRadius: '4px' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'rgb(var(--text-secondary))' }}>
            {monthlyTrend.map((b, i) => (<span key={i}>{b.label}</span>))}
          </div>
        </div>
      </div>

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
              <th style={{ padding: '1rem' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>Sin resultados.</td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.9rem' }}>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', color: 'rgb(var(--primary))' }}>{tx.id.slice(0, 8)}...</td>
                  <td style={{ padding: '1rem' }}>{new Date(tx.date).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', fontWeight: 500 }}>{tx.userFullName || 'Desconocido'}</td>
                  <td style={{ padding: '1rem' }}>{tx.expertFullName || 'Experto'}</td>
                  <td style={{ padding: '1rem', fontWeight: 700 }}>{formatMoney(tx.price, tx.currency)}</td>
                  <td style={{ padding: '1rem', color: 'rgb(var(--success))', fontWeight: 600 }}>+{formatMoney(tx.price * commissionRate, tx.currency)}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      textTransform: 'capitalize',
                      padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600,
                      background: tx.status === 'completed' ? 'rgba(var(--success), 0.1)' : tx.status === 'confirmed' ? 'rgba(var(--success), 0.1)' : tx.status === 'pending' ? 'rgba(var(--warning), 0.1)' : 'rgba(var(--error), 0.1)',
                      color: tx.status === 'completed' ? 'rgb(var(--success))' : tx.status === 'confirmed' ? 'rgb(var(--success))' : tx.status === 'pending' ? 'rgb(var(--warning))' : 'rgb(var(--error))'
                    }}>{tx.status === 'confirmed' ? 'Pagado' : tx.status}</span>
                    {disputedIds.includes(tx.id) && (
                      <span style={{ marginLeft: '0.5rem', padding: '0.15rem 0.5rem', borderRadius: '0.75rem', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))' }}>En disputa</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
