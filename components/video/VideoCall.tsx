"use client";

import { useEffect, useState } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import { DailyProvider } from '@daily-co/daily-react';
import CallUI from './CallUI';
import { AlertCircle } from 'lucide-react';

import { useRouter } from 'next/navigation';

export default function VideoCall({ roomUrl, userName, bookingId }: { roomUrl: string; userName: string; bookingId?: string }) {
    const [callObject, setCallObject] = useState<DailyCall | null>(null);
    const [callError, setCallError] = useState<string | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const [warnSoon, setWarnSoon] = useState(false);
    const [endReason, setEndReason] = useState<'none' | 'timer' | 'user'>('none');
    const router = useRouter();

    useEffect(() => {
        let newCallObject: DailyCall | null = null;
        let hasJoined = false;
        let attemptedRecovery = false;

        const initCall = async () => {
            try {
                const existingCall = DailyIframe.getCallInstance();
                if (existingCall) {
                    await existingCall.destroy();
                }

                newCallObject = DailyIframe.createCallObject({
                    url: roomUrl,
                });

                newCallObject.on('error', async (e: unknown) => {
                    console.error('Daily Error:', e);
                    const msg = (e as { errorMsg?: string }).errorMsg || 'Error al conectar con la sala.';

                    // Try recovery once when any join error happens and we have bookingId
                    if (!attemptedRecovery && bookingId) {
                        attemptedRecovery = true;
                        try {
                            const res = await fetch('/api/daily/room', { method: 'POST' });
                            if (res.ok) {
                                const j = await res.json();
                                const newUrl = j.url as string;
                                if (newUrl) {
                                    const supabase = (await import('@/utils/supabase/client')).createClient();
                                    await supabase
                                        .from('bookings')
                                        .update({ meeting_url: newUrl })
                                        .eq('id', bookingId);

                                    try {
                                        await newCallObject?.destroy();
                                    } catch {}

                                    newCallObject = DailyIframe.createCallObject({ url: newUrl });

                                    newCallObject.on('left-meeting', () => {
                                        if (bookingId && hasJoined) {
                                            router.push(`/call/feedback/${bookingId}`);
                                        } else {
                                            router.push('/');
                                        }
                                    });
                                    newCallObject.on('joined-meeting', () => { hasJoined = true; });
                                    setCallError(null);
                                    setCallObject(newCallObject);
                                    await newCallObject.join({ userName });
                                    // hasJoined will be set by event
                                }
                            }
                        } catch (recErr) {
                            console.error('Recovery failed', recErr);
                            setCallError(msg);
                        }
                    } else {
                        setCallError(msg);
                    }
                });

                newCallObject.on('left-meeting', () => {
                    console.log('Left meeting. hasJoined=', hasJoined, 'reason=', endReason);
                    if (endReason === 'timer' && bookingId && hasJoined) {
                        router.push(`/call/feedback/${bookingId}`);
                    }
                });

                setCallObject(newCallObject);

                await newCallObject.join({ userName });
                newCallObject.on('joined-meeting', () => { hasJoined = true; });

                // Setup countdown based on booking duration and start
                if (bookingId) {
                    try {
                        const supabase = (await import('@/utils/supabase/client')).createClient();
                        const { data: booking } = await supabase
                            .from('bookings')
                            .select('date, time, service:services!service_id(duration)')
                            .eq('id', bookingId)
                            .single();

                        const durationMin: number = (booking?.service && !Array.isArray(booking.service))
                            ? Number(booking.service.duration) || 60
                            : Number(Array.isArray(booking?.service) ? booking?.service?.[0]?.duration : undefined) || 60;
                        const scheduledStart = (() => {
                            try {
                                const [y, m, d] = String(booking?.date || '').split('-').map(Number);
                                const [hh, mm] = String(booking?.time || '00:00').slice(0,5).split(':').map(Number);
                                return new Date(y || new Date().getFullYear(), (m || 1) - 1, d || new Date().getDate(), hh || 0, mm || 0);
                            } catch { return new Date(); }
                        })();

                        const baseline = scheduledStart.getTime();
                        const endTs = baseline + durationMin * 60 * 1000;
                        let closedByTimer = false;

                        const tick = () => {
                            const now = new Date().getTime();
                            const remain = Math.max(0, Math.floor((endTs - now) / 1000));
                            setRemainingSeconds(remain);
                            if (remain <= 600 && remain > 0) setWarnSoon(true);
                            if (remain === 0 && !closedByTimer) {
                                closedByTimer = true;
                                setEndReason('timer');
                                try { newCallObject?.leave(); } catch {}
                            }
                        };
                        tick();
                        const timer = setInterval(tick, 1000);
                        newCallObject.on('left-meeting', () => clearInterval(timer));
                    } catch (e) {
                        console.warn('Countdown setup failed', e);
                    }
                }
            } catch (err: unknown) {
                console.error("Failed to init call", err);
                const msg = (err as { message?: string }).message || "No se pudo iniciar la llamada.";
                setCallError(msg);
            }
        };

        initCall();

        return () => {
            if (newCallObject) {
                newCallObject.leave();
                newCallObject.destroy();
            }
        };
    }, [roomUrl, userName, bookingId, router]);

    if (callError) {
        return (
            <div style={{
                height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                background: '#1a1a1a', color: 'white', gap: '1rem', padding: '2rem', textAlign: 'center'
            }}>
                <AlertCircle size={48} color="#ff4444" />
                <h2 style={{ fontSize: '1.5rem' }}>No se pudo unir a la llamada</h2>
                <p style={{ maxWidth: '400px', opacity: 0.8 }}>{callError}</p>
                <p style={{ fontSize: '0.9rem', color: '#888' }}>
                    Verifica que la URL de la sala sea válida y no haya expirado.<br />
                    URL actual: {roomUrl}
                </p>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        marginTop: '1rem', padding: '0.75rem 1.5rem', borderRadius: '8px',
                        background: 'white', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 600
                    }}
                >
                    Volver
                </button>
            </div>
        );
    }

    if (!callObject) {
        return (
            <div style={{
                height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#1a1a1a', color: 'white'
            }}>
                Cargando cámara y micrófono...
            </div>
        );
    }

    return (
        <DailyProvider callObject={callObject}>
            <div style={{ position: 'relative', height: '100%' }}>
                {remainingSeconds !== null && (
                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {warnSoon && remainingSeconds > 0 && (
                            <div style={{
                                background: 'rgba(var(--warning), 0.15)',
                                color: 'rgb(var(--warning))',
                                border: '1px solid rgba(var(--warning), 0.3)',
                                padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600
                            }}>
                                Quedan ~10 minutos. Tu sesión está por expirar.
                            </div>
                        )}
                        <div style={{
                            background: 'rgba(255,255,255,0.9)', color: '#111',
                            border: '1px solid #ddd', padding: '0.35rem 0.6rem', borderRadius: '0.5rem', fontWeight: 700,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)', textAlign: 'center'
                        }}>
                            {(() => {
                                const mm = String(Math.floor(remainingSeconds / 60)).padStart(2, '0');
                                const ss = String(remainingSeconds % 60).padStart(2, '0');
                                return `${mm}:${ss}`;
                            })()}
                        </div>
                    </div>
                )}
                <CallUI />
            </div>
        </DailyProvider>
    );
}
