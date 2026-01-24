"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

type BookingView = {
  id: string;
  price: number;
  currency: string;
  status: string;
  created_at: string;
  user_id?: string;
  expert_id?: string;
  expert_name?: string;
  service_category?: string | null;
  service_country?: string | null;
  service_rating_avg?: number | null;
};

type DisputeView = {
  id: string;
  status: string;
  created_at: string;
  resolved_at?: string | null;
  booking_id?: string | null;
  booking_price?: number | null;
  booking_currency?: string | null;
};

export default function AdminDashboardClient({
  commissionRate,
  bookings,
  disputes
}: {
  commissionRate: number;
  bookings: BookingView[];
  disputes: DisputeView[];
}) {
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [customStart, setCustomStart] = useState<string | null>(null);
  const [customEnd, setCustomEnd] = useState<string | null>(null);
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const savedRange = window.localStorage.getItem('admin_range');
      if (savedRange === '7' || savedRange === '30' || savedRange === '90') {
        setRange(Number(savedRange) as 7 | 30 | 90);
      }
      const start = window.localStorage.getItem('admin_range_start');
      const end = window.localStorage.getItem('admin_range_end');
      const use = window.localStorage.getItem('admin_range_use_custom');
      setCustomStart(start || null);
      setCustomEnd(end || null);
      setUseCustom(use === '1');
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('admin_range', String(range));
    }
  }, [range]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('admin_range_start', customStart || '');
      window.localStorage.setItem('admin_range_end', customEnd || '');
      window.localStorage.setItem('admin_range_use_custom', useCustom ? '1' : '0');
    }
  }, [customStart, customEnd, useCustom]);

  const now = useMemo(() => (mounted ? new Date() : new Date(0)), [mounted]);
  const activeWindow = useMemo(() => {
    if (useCustom && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(new Date(customEnd).setHours(23, 59, 59, 999));
      return { start, end };
    }
    const start = new Date(now);
    start.setDate(start.getDate() - range);
    const end = new Date(now);
    return { start, end };
  }, [useCustom, customStart, customEnd, range, now]);
  const filteredBookings = useMemo(() => {
    if (useCustom && customStart && customEnd) {
      const startTs = new Date(customStart).getTime();
      const endTs = new Date(new Date(customEnd).setHours(23, 59, 59, 999)).getTime();
      return bookings.filter(b => {
        const ts = new Date(b.created_at).getTime();
        return !isNaN(ts) && ts >= startTs && ts <= endTs;
      });
    }
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - range);
    return bookings.filter(b => {
      const ts = new Date(b.created_at).getTime();
      return !isNaN(ts) && ts >= cutoff.getTime();
    });
  }, [bookings, range, now, useCustom, customStart, customEnd]);

  const filteredDisputes = useMemo(() => {
    if (useCustom && customStart && customEnd) {
      const startTs = new Date(customStart).getTime();
      const endTs = new Date(new Date(customEnd).setHours(23, 59, 59, 999)).getTime();
      return disputes.filter(d => {
        const ts = new Date(d.created_at).getTime();
        return !isNaN(ts) && ts >= startTs && ts <= endTs;
      });
    }
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - range);
    return disputes.filter(d => {
      const ts = new Date(d.created_at).getTime();
      return !isNaN(ts) && ts >= cutoff.getTime();
    });
  }, [disputes, range, now, useCustom, customStart, customEnd]);

  const txCount = filteredBookings.length;
  const volume = filteredBookings.reduce((s, b) => s + b.price, 0);
  const fees = volume * commissionRate;

  const txWeekly = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks = Math.max(1, Math.ceil((activeWindow.end.getTime() - activeWindow.start.getTime()) / weekMs));
    const maxWeeks = Math.min(totalWeeks, 12);
    for (let i = 0; i < maxWeeks; i++) {
      const start = new Date(activeWindow.start.getTime() + i * weekMs);
      const end = new Date(start.getTime() + weekMs);
      const count = filteredBookings.filter(b => {
        const t = new Date(b.created_at).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      buckets.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, count });
    }
    return buckets;
  }, [filteredBookings, activeWindow]);

  const txMonthly = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const startYear = activeWindow.start.getFullYear();
    const startMonth = activeWindow.start.getMonth();
    const endYear = activeWindow.end.getFullYear();
    const endMonth = activeWindow.end.getMonth();
    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const count = filteredBookings.filter(b => {
        const t = new Date(b.created_at);
        return t.getFullYear() === y && t.getMonth() === m;
      }).length;
      buckets.push({ label: `${y}-${String(m + 1).padStart(2, '0')}`, count });
      m++;
      if (m > 11) { m = 0; y++; }
      if (buckets.length >= 12) break;
    }
    return buckets;
  }, [filteredBookings, activeWindow]);

  const disputesWeekly = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks = Math.max(1, Math.ceil((activeWindow.end.getTime() - activeWindow.start.getTime()) / weekMs));
    const maxWeeks = Math.min(totalWeeks, 12);
    for (let i = 0; i < maxWeeks; i++) {
      const start = new Date(activeWindow.start.getTime() + i * weekMs);
      const end = new Date(start.getTime() + weekMs);
      const count = filteredDisputes.filter(d => {
        const t = new Date(d.created_at).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;
      buckets.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, count });
    }
    return buckets;
  }, [filteredDisputes, activeWindow]);

  const disputesMonthly = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const startYear = activeWindow.start.getFullYear();
    const startMonth = activeWindow.start.getMonth();
    const endYear = activeWindow.end.getFullYear();
    const endMonth = activeWindow.end.getMonth();
    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const count = filteredDisputes.filter(x => {
        const t = new Date(x.created_at);
        return t.getFullYear() === y && t.getMonth() === m;
      }).length;
      buckets.push({ label: `${y}-${String(m + 1).padStart(2, '0')}`, count });
      m++;
      if (m > 11) { m = 0; y++; }
      if (buckets.length >= 12) break;
    }
    return buckets;
  }, [filteredDisputes, activeWindow]);

  const byCountry = useMemo(() => {
    const map = new Map<string, number>();
    filteredBookings.forEach(b => {
      const key = String(b.service_country || 'N/A');
      map.set(key, (map.get(key) || 0) + b.price);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredBookings]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredBookings.forEach(b => {
      const key = String(b.service_category || 'N/A');
      map.set(key, (map.get(key) || 0) + b.price);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredBookings]);

  const refundsInRange = useMemo(() => filteredDisputes.filter(d => d.status === 'resolved_refunded'), [filteredDisputes]);
  const refundRate = txCount ? refundsInRange.length / txCount : 0;
  const refundImpactByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    refundsInRange.forEach(d => {
      const cur = d.booking_currency || 'USD';
      const price = Number(d.booking_price || 0);
      const impact = price * commissionRate;
      map.set(cur, (map.get(cur) || 0) + impact);
    });
    return Array.from(map.entries());
  }, [refundsInRange, commissionRate]);

  const topExperts = useMemo(() => {
    const agg = new Map<string, { name: string; volume: number; rating?: number | null }>();
    filteredBookings.forEach(b => {
      const key = b.expert_id || 'unknown';
      const prev = agg.get(key);
      const vol = (prev?.volume || 0) + b.price;
      agg.set(key, { name: b.expert_name || key, volume: vol, rating: b.service_rating_avg ?? null });
    });
    return Array.from(agg.values()).sort((a, b) => b.volume - a.volume).slice(0, 5);
  }, [filteredBookings]);

  const formatMoney = (n: number, currency: string) => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(n);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Button variant={range === 7 ? undefined : 'outline'} onClick={() => setRange(7)}>7 días</Button>
        <Button variant={range === 30 ? undefined : 'outline'} onClick={() => setRange(30)}>30 días</Button>
        <Button variant={range === 90 ? undefined : 'outline'} onClick={() => setRange(90)}>90 días</Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.5rem', borderLeft: '1px solid rgb(var(--border))' }}>
          <input type="date" value={customStart || ''} onChange={(e) => setCustomStart(e.target.value || null)} style={{ padding: '0.5rem', border: '1px solid rgb(var(--border))', borderRadius: '6px', background: 'rgb(var(--surface))' }} />
          <span style={{ color: 'rgb(var(--text-secondary))' }}>—</span>
          <input type="date" value={customEnd || ''} onChange={(e) => setCustomEnd(e.target.value || null)} style={{ padding: '0.5rem', border: '1px solid rgb(var(--border))', borderRadius: '6px', background: 'rgb(var(--surface))' }} />
          <Button variant={useCustom ? undefined : 'outline'} onClick={() => setUseCustom(true)}>Aplicar</Button>
          <Button variant="outline" onClick={() => { setUseCustom(false); }}>Limpiar</Button>
        </div>
        <div style={{ marginLeft: 'auto', color: 'rgb(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span>Tx: {txCount}</span>
          <span>Volumen: {formatMoney(volume, filteredBookings[0]?.currency || 'USD')}</span>
          <span>Fee: {formatMoney(fees, filteredBookings[0]?.currency || 'USD')}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Transacciones por semana</div>
          <Line
            data={{
              labels: txWeekly.map(b => b.label),
              datasets: [{
                label: 'Transacciones',
                data: txWeekly.map(b => b.count),
                borderColor: 'rgb(var(--primary))',
                backgroundColor: 'rgba(var(--primary), 0.2)',
                tension: 0.3,
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false } }, y: { ticks: { precision: 0 } } }
            }}
          />
        </div>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Transacciones por mes</div>
          <Bar
            data={{
              labels: txMonthly.map(b => b.label),
              datasets: [{
                label: 'Transacciones',
                data: txMonthly.map(b => b.count),
                backgroundColor: 'rgba(var(--primary), 0.3)',
                borderColor: 'rgb(var(--primary))',
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false } }, y: { ticks: { precision: 0 } } }
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Disputas por semana</div>
          <Line
            data={{
              labels: disputesWeekly.map(b => b.label),
              datasets: [{
                label: 'Disputas',
                data: disputesWeekly.map(b => b.count),
                borderColor: 'rgb(var(--warning))',
                backgroundColor: 'rgba(var(--warning), 0.2)',
                tension: 0.3,
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false } }, y: { ticks: { precision: 0 } } }
            }}
          />
        </div>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Disputas por mes</div>
          <Bar
            data={{
              labels: disputesMonthly.map(b => b.label),
              datasets: [{
                label: 'Disputas',
                data: disputesMonthly.map(b => b.count),
                backgroundColor: 'rgba(var(--error), 0.3)',
                borderColor: 'rgb(var(--error))',
              }]
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
              scales: { x: { grid: { display: false } }, y: { ticks: { precision: 0 } } }
            }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Ingresos por país</div>
          {byCountry.length === 0 ? (
            <div style={{ color: 'rgb(var(--text-secondary))' }}>Sin datos</div>
          ) : (
            byCountry.map(([country, val]) => (
              <div key={country} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, background: 'rgba(var(--primary), 0.1)', height: '10px', borderRadius: '6px' }}>
                  <div style={{ width: `${Math.min(100, (val / byCountry[0][1]) * 100)}%`, height: '10px', borderRadius: '6px', background: 'rgb(var(--primary))' }} />
                </div>
                <div style={{ minWidth: '140px', textAlign: 'right', fontSize: '0.9rem' }}>{country}</div>
                <div style={{ minWidth: '160px', textAlign: 'right', fontWeight: 600 }}>{formatMoney(val, filteredBookings[0]?.currency || 'USD')}</div>
              </div>
            ))
          )}
        </div>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Ingresos por categoría</div>
          {byCategory.length === 0 ? (
            <div style={{ color: 'rgb(var(--text-secondary))' }}>Sin datos</div>
          ) : (
            byCategory.map(([cat, val]) => (
              <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <div style={{ flex: 1, background: 'rgba(var(--primary), 0.1)', height: '10px', borderRadius: '6px' }}>
                  <div style={{ width: `${Math.min(100, (val / byCategory[0][1]) * 100)}%`, height: '10px', borderRadius: '6px', background: 'rgb(var(--primary))' }} />
                </div>
                <div style={{ minWidth: '140px', textAlign: 'right', fontSize: '0.9rem' }}>{cat}</div>
                <div style={{ minWidth: '160px', textAlign: 'right', fontWeight: 600 }}>{formatMoney(val, filteredBookings[0]?.currency || 'USD')}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.75rem' }}>Tasa de reembolso e impacto</div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ padding: '0.75rem', border: '1px solid rgb(var(--border))', borderRadius: '8px' }}>Tasa: {(refundRate * 100).toFixed(1)}%</div>
          {refundImpactByCurrency.map(([cur, amt]) => (
            <div key={cur} style={{ padding: '0.75rem', border: '1px solid rgb(var(--border))', borderRadius: '8px' }}>
              Impacto {cur}: {formatMoney(amt, cur)}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
        <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.75rem' }}>Top expertos</div>
        {topExperts.length === 0 ? (
          <div style={{ color: 'rgb(var(--text-secondary))' }}>Sin datos</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                <th style={{ padding: '0.75rem' }}>Experto</th>
                <th style={{ padding: '0.75rem' }}>Volumen</th>
                <th style={{ padding: '0.75rem' }}>Satisfacción</th>
              </tr>
            </thead>
            <tbody>
              {topExperts.map((e, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{e.name}</td>
                  <td style={{ padding: '0.75rem', fontWeight: 600 }}>{formatMoney(e.volume, filteredBookings[0]?.currency || 'USD')}</td>
                  <td style={{ padding: '0.75rem' }}>{e.rating != null ? `${e.rating.toFixed(1)}/5` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
