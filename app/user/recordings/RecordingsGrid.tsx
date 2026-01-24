"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';

export default function RecordingsGrid({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('recordings')
      .select(`
        *,
        booking:bookings!booking_id(
          id,
          date,
          time,
          service:services!service_id(title, duration),
          expert:experts!expert_id(
            profile:profiles(full_name)
          )
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const t = setInterval(() => {
      if (items.some((r) => !r.storage_url)) fetchData();
    }, 5000);
    return () => clearInterval(t);
  }, [userId, items]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-lg)' }}>Cargando...</div>;
  }

  if (!items.length) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-lg)' }}>No tienes grabaciones aún.</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
      {items.map((r) => {
        const title = r?.booking?.service?.title || 'Sesión grabada';
        const expert = r?.booking?.expert?.profile?.full_name || 'Experto';
        const dateStr = r?.booking?.date ? new Date(r.booking.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(r.created_at).toLocaleDateString('es-ES');
        const timeStr = r?.booking?.time || '';
        const durMin = (() => {
          if (r?.ended_at && r?.created_at) {
            const ms = new Date(r.ended_at).getTime() - new Date(r.created_at).getTime();
            if (ms > 0) return Math.round(ms / 60000);
          }
          const d = Number(r?.booking?.service?.duration || 0);
          return d > 0 ? d : undefined;
        })();
        return (
          <div key={r.id} style={{ border: '1px solid rgb(var(--border))', borderRadius: '16px', overflow: 'hidden', background: 'white' }}>
            <div style={{ height: '160px', background: 'linear-gradient(135deg, #c0d0ff 0%, #e0d1ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '16px solid rgb(var(--primary))' }} />
              </div>
              {durMin ? (
                <div style={{ position: 'absolute', right: '12px', bottom: '12px', background: 'rgba(0,0,0,0.75)', color: 'white', fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>{durMin} min</div>
              ) : null}
            </div>
            <div style={{ padding: '1rem 1rem 0.75rem 1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{title}</div>
              <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.95rem' }}>con {expert}</div>
              <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginTop: '0.6rem' }}>
                <span>{dateStr}</span>
                {timeStr && <span>{timeStr}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                {r.storage_url ? (
                  <Link href={r.storage_url} target="_blank">
                    <Button style={{ background: 'rgb(var(--primary))', color: 'white' }}>Ver Ahora</Button>
                  </Link>
                ) : (
                  <Button disabled>Procesando…</Button>
                )}
                <a
                  href={r.storage_url || '#'}
                  download
                  style={{ width: '36px', height: '36px', borderRadius: '18px', border: '1px solid rgb(var(--border))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--text-secondary))', pointerEvents: r.storage_url ? 'auto' : 'none', opacity: r.storage_url ? 1 : 0.5 }}
                  aria-label="Descargar grabación"
                >
                  ↓
                </a>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
