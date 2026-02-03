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

  // Debounced localStorage writes to avoid excessive writes
  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('admin_range', String(range));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [range, mounted]);

  useEffect(() => {
    if (!mounted) return;
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('admin_range_start', customStart || '');
        window.localStorage.setItem('admin_range_end', customEnd || '');
        window.localStorage.setItem('admin_range_use_custom', useCustom ? '1' : '0');
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [customStart, customEnd, useCustom, mounted]);

  const now = useMemo(() => (mounted ? new Date() : new Date(0)), [mounted]);
  const activeWindow = useMemo(() => {
    if (useCustom && customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(new Date(customEnd).setHours(23, 59, 59, 999));
      return { start, end, startTs: start.getTime(), endTs: end.getTime() };
    }
    const start = new Date(now);
    start.setDate(start.getDate() - range);
    const end = new Date(now);
    return { start, end, startTs: start.getTime(), endTs: end.getTime() };
  }, [useCustom, customStart, customEnd, range, now]);

  // Pre-process bookings with timestamps for performance (avoid repeated Date creation)
  const bookingsWithTs = useMemo(() => {
    return bookings.map(b => ({
      ...b,
      timestamp: new Date(b.created_at).getTime()
    }));
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookingsWithTs.filter(b => {
      return !isNaN(b.timestamp) && b.timestamp >= activeWindow.startTs && b.timestamp <= activeWindow.endTs;
    });
  }, [bookingsWithTs, activeWindow]);

  // Pre-process disputes with timestamps for performance (avoid repeated Date creation)
  const disputesWithTs = useMemo(() => {
    return disputes.map(d => ({
      ...d,
      timestamp: new Date(d.created_at).getTime()
    }));
  }, [disputes]);

  const filteredDisputes = useMemo(() => {
    return disputesWithTs.filter(d => {
      return !isNaN(d.timestamp) && d.timestamp >= activeWindow.startTs && d.timestamp <= activeWindow.endTs;
    });
  }, [disputesWithTs, activeWindow]);

  const txCount = filteredBookings.length;

  // Multi-currency support: group volumes by currency
  const volumeByCurrency = useMemo(() => {
    const currencies = new Map<string, number>();
    filteredBookings.forEach(b => {
      const currency = b.currency || 'USD';
      currencies.set(currency, (currencies.get(currency) || 0) + b.price);
    });
    return currencies;
  }, [filteredBookings]);

  // Primary currency (most used) and its volume
  const primaryCurrency = useMemo(() => {
    let maxCurrency = 'USD';
    let maxCount = 0;
    const currencyCounts = new Map<string, number>();

    filteredBookings.forEach(b => {
      const currency = b.currency || 'USD';
      const count = (currencyCounts.get(currency) || 0) + 1;
      currencyCounts.set(currency, count);
      if (count > maxCount) {
        maxCount = count;
        maxCurrency = currency;
      }
    });

    return maxCurrency;
  }, [filteredBookings]);

  const volume = volumeByCurrency.get(primaryCurrency) || 0;
  const fees = volume * commissionRate;
  const hasMultipleCurrencies = volumeByCurrency.size > 1;

  const txWeekly = useMemo(() => {
    const buckets: { label: string; count: number }[] = [];
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const totalWeeks = Math.max(1, Math.ceil((activeWindow.endTs - activeWindow.startTs) / weekMs));
    const maxWeeks = Math.min(totalWeeks, 12);
    for (let i = 0; i < maxWeeks; i++) {
      const startTs = activeWindow.startTs + i * weekMs;
      const endTs = startTs + weekMs;
      const start = new Date(startTs);
      const count = filteredBookings.filter(b => b.timestamp >= startTs && b.timestamp < endTs).length;
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

    // Pre-process bookings with year/month for efficient grouping
    const bookingsByMonth = new Map<string, number>();
    filteredBookings.forEach(b => {
      const date = new Date(b.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      bookingsByMonth.set(key, (bookingsByMonth.get(key) || 0) + 1);
    });

    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const key = `${y}-${m}`;
      const count = bookingsByMonth.get(key) || 0;
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
    const totalWeeks = Math.max(1, Math.ceil((activeWindow.endTs - activeWindow.startTs) / weekMs));
    const maxWeeks = Math.min(totalWeeks, 12);
    for (let i = 0; i < maxWeeks; i++) {
      const startTs = activeWindow.startTs + i * weekMs;
      const endTs = startTs + weekMs;
      const start = new Date(startTs);
      const count = filteredDisputes.filter(d => d.timestamp >= startTs && d.timestamp < endTs).length;
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

    // Pre-process disputes with year/month for efficient grouping
    const disputesByMonth = new Map<string, number>();
    filteredDisputes.forEach(d => {
      const date = new Date(d.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      disputesByMonth.set(key, (disputesByMonth.get(key) || 0) + 1);
    });

    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      const key = `${y}-${m}`;
      const count = disputesByMonth.get(key) || 0;
      buckets.push({ label: `${y}-${String(m + 1).padStart(2, '0')}`, count });
      m++;
      if (m > 11) { m = 0; y++; }
      if (buckets.length >= 12) break;
    }
    return buckets;
  }, [filteredDisputes, activeWindow]);

  const byCountry = useMemo(() => {
    const map = new Map<string, number>();
    // Only use bookings in primary currency to avoid mixing currencies
    filteredBookings
      .filter(b => (b.currency || 'USD') === primaryCurrency)
      .forEach(b => {
        const key = String(b.service_country || 'N/A');
        map.set(key, (map.get(key) || 0) + b.price);
      });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredBookings, primaryCurrency]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    // Only use bookings in primary currency to avoid mixing currencies
    filteredBookings
      .filter(b => (b.currency || 'USD') === primaryCurrency)
      .forEach(b => {
        const key = String(b.service_category || 'N/A');
        map.set(key, (map.get(key) || 0) + b.price);
      });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filteredBookings, primaryCurrency]);

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
          <span>
            Volumen: {formatMoney(volume, primaryCurrency)}
            {hasMultipleCurrencies && (
              <span style={{ fontSize: '0.75rem', marginLeft: '0.25rem', color: 'rgb(var(--warning))' }} title="Múltiples divisas detectadas">
                ({volumeByCurrency.size} divisas)
              </span>
            )}
          </span>
          <span>Fee: {formatMoney(fees, primaryCurrency)}</span>
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
                <div style={{ minWidth: '160px', textAlign: 'right', fontWeight: 600 }}>{formatMoney(val, primaryCurrency)}</div>
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
                <div style={{ minWidth: '160px', textAlign: 'right', fontWeight: 600 }}>{formatMoney(val, primaryCurrency)}</div>
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
