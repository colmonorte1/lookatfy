'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Video } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface Props {
  bookingId: string;
  status: string;
  meetingUrl?: string;
  date: string;
  time: string;
  duration?: number;
}

export default function ExpertBookingActions({ bookingId, status, meetingUrl, date, time, duration }: Props) {
  const [hasReview, setHasReview] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isJoinable, setIsJoinable] = useState(false);

  const meetingDate = (() => {
    try { return new Date(`${date} ${time}`); } catch { return null; }
  })();

  

  useEffect(() => {
    const durMin = duration ?? 60;
    if (!meetingDate) return;
    const endTs = meetingDate.getTime() + durMin * 60 * 1000;
    const update = () => {
      const nowMs = Date.now();
      const remain = Math.max(0, Math.floor((endTs - nowMs) / 1000));
      setRemaining(remain);
      setIsJoinable(nowMs >= meetingDate.getTime() - 60 * 60 * 1000 && remain > 0);
    };
    const t0 = setTimeout(update, 0);
    const timer = setInterval(update, 1000);
    return () => { clearTimeout(t0); clearInterval(timer); };
  }, [meetingDate, duration]);

  useEffect(() => {
    const markCompleted = async () => {
      if (remaining === 0 && status !== 'completed' && status !== 'cancelled') {
        try {
          const supabase = createClient();
          await supabase
            .from('bookings')
            .update({ status: 'completed' })
            .eq('id', bookingId);
        } catch {}
      }
    };
    markCompleted();
  }, [remaining, status, bookingId]);

  useEffect(() => {
    const checkReview = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
          .from('reviews')
          .select('id')
          .eq('booking_id', bookingId)
          .eq('reviewer_id', user.id)
          .limit(1);
        if (data && data.length > 0) setHasReview(true);
      } catch {}
    };
    checkReview();
  }, [bookingId]);

  if (status === 'completed' || status === 'cancelled') {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {meetingUrl ? (
        isJoinable ? (
          <Link href={`/call?roomUrl=${encodeURIComponent(meetingUrl)}&userName=${encodeURIComponent('Experto')}&bookingId=${bookingId}`} target="_blank">
            <Button style={{ gap: '0.5rem' }}>
              <Video size={18} /> Entrar
            </Button>
          </Link>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <Button disabled style={{ gap: '0.5rem', opacity: 0.6 }}>
              <Video size={18} /> Entrar
            </Button>
            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))', marginTop: '0.2rem' }}>
              Habilitado 1h antes
            </div>
          </div>
        )
      ) : (
        <span style={{ fontSize: '0.9rem', color: 'rgb(var(--text-muted))' }}>Sin Sala</span>
      )}

      {remaining !== null && (
        <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
          {remaining > 0 ? (
            <span>Quedan {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span>
          ) : (
            <span>Sesión finalizada</span>
          )}
        </div>
      )}

      {remaining !== null && remaining > 0 && remaining <= 600 && (
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgb(var(--warning))' }}>
          Sesión por expirar (~10 min)
        </div>
      )}

      {remaining !== null && remaining === 0 && !hasReview && (
        <Link href={`/call/feedback/${bookingId}`}>
          <Button variant="outline">Calificar usuario</Button>
        </Link>
      )}
    </div>
  );
}
