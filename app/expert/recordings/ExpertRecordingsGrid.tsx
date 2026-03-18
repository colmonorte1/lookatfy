'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';

interface ExpertRecordingsGridProps {
    expertId: string;
}

export default function ExpertRecordingsGrid({ expertId }: ExpertRecordingsGridProps) {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        const supabase = createClient();

        // 1. Obtener los booking IDs del experto
        const { data: bookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('expert_id', expertId);

        if (!bookings || bookings.length === 0) {
            setItems([]);
            setLoading(false);
            return;
        }

        const bookingIds = bookings.map(b => b.id);

        // 2. Obtener grabaciones de esos bookings
        const { data } = await supabase
            .from('recordings')
            .select(`
                *,
                booking:bookings!booking_id(
                    id,
                    date,
                    time,
                    service:services!service_id(title, duration),
                    client:profiles!user_id(full_name)
                )
            `)
            .in('booking_id', bookingIds)
            .order('created_at', { ascending: false });

        setItems(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // Polling para grabaciones que aún están procesando
        const t = setInterval(() => {
            if (items.some(r => !r.storage_url)) fetchData();
        }, 5000);
        return () => clearInterval(t);
    }, [expertId, items.length]);

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-lg)' }}>
                Cargando grabaciones...
            </div>
        );
    }

    if (!items.length) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'rgb(var(--text-secondary))', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ marginBottom: '0.5rem', fontWeight: 500 }}>No hay grabaciones aún.</p>
                <p style={{ fontSize: '0.875rem' }}>Las grabaciones aparecerán aquí después de completar sesiones con grabación activada.</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {items.map((r) => {
                const title = r?.booking?.service?.title || 'Sesión grabada';
                const clientName = r?.booking?.client?.full_name || 'Cliente';
                const dateStr = r?.booking?.date
                    ? new Date(r.booking.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                    : new Date(r.created_at).toLocaleDateString('es-ES');
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
                    <div key={r.id} style={{
                        border: '1px solid rgb(var(--border))',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        background: 'rgb(var(--surface))',
                    }}>
                        {/* Thumbnail */}
                        <div style={{
                            height: '160px',
                            background: 'linear-gradient(135deg, #c0d0ff 0%, #e0d1ff 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            position: 'relative',
                        }}>
                            <div style={{
                                width: '64px', height: '64px', borderRadius: '50%',
                                background: 'rgba(255,255,255,0.7)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <div style={{
                                    width: 0, height: 0,
                                    borderTop: '10px solid transparent',
                                    borderBottom: '10px solid transparent',
                                    borderLeft: '16px solid rgb(var(--primary))',
                                }} />
                            </div>
                            {durMin && (
                                <div style={{
                                    position: 'absolute', right: '12px', bottom: '12px',
                                    background: 'rgba(0,0,0,0.75)', color: 'white',
                                    fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '8px',
                                }}>
                                    {durMin} min
                                </div>
                            )}
                            {!r.storage_url && (
                                <div style={{
                                    position: 'absolute', top: '12px', left: '12px',
                                    background: 'rgba(234, 179, 8, 0.9)', color: 'white',
                                    fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '6px',
                                }}>
                                    Procesando...
                                </div>
                            )}
                        </div>

                        {/* Info */}
                        <div style={{ padding: '1rem 1rem 0.75rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>{title}</div>
                            <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>
                                con <strong style={{ color: 'rgb(var(--text-main))' }}>{clientName}</strong>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-muted))', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                <span>{dateStr}</span>
                                {timeStr && <span>{timeStr}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                                {r.storage_url ? (
                                    <Link href={r.storage_url} target="_blank">
                                        <Button style={{ background: 'rgb(var(--primary))', color: 'white' }}>
                                            Ver ahora
                                        </Button>
                                    </Link>
                                ) : (
                                    <Button disabled>Procesando...</Button>
                                )}
                                <a
                                    href={r.storage_url || '#'}
                                    download
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '18px',
                                        border: '1px solid rgb(var(--border))',
                                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                        color: 'rgb(var(--text-secondary))',
                                        pointerEvents: r.storage_url ? 'auto' : 'none',
                                        opacity: r.storage_url ? 1 : 0.4,
                                        textDecoration: 'none',
                                    }}
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
