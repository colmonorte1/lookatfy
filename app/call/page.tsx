"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import VideoCall from '@/components/video/VideoCall';
import { Video } from 'lucide-react';

function CallContent() {
    const searchParams = useSearchParams();
    const initialRoomUrl = searchParams.get('roomUrl') || '';
    const initialUserName = searchParams.get('userName') || '';
    const bookingId = searchParams.get('bookingId') || '';

    const [roomUrl, setRoomUrl] = useState(initialRoomUrl);
    const [userName, setUserName] = useState(initialUserName);
    const [isJoined, setIsJoined] = useState(false);
    const [isPreparing, setIsPreparing] = useState(false);

    const handleJoin = async () => {
        if (isPreparing) return;
        setIsPreparing(true);
        try {
            let finalUrl = roomUrl;
            if (!finalUrl && bookingId) {
                const supabase = (await import('@/utils/supabase/client')).createClient();
                const { data: booking } = await supabase
                    .from('bookings')
                    .select('meeting_url')
                    .eq('id', bookingId)
                    .single();

                finalUrl = booking?.meeting_url || '';
                if (!finalUrl) {
                    const res = await fetch('/api/daily/room', { method: 'POST' });
                    if (res.ok) {
                        const j = await res.json();
                        finalUrl = j.url || '';
                        if (finalUrl) {
                            await supabase
                                .from('bookings')
                                .update({ meeting_url: finalUrl })
                                .eq('id', bookingId);
                        }
                    }
                }
            }

            if (finalUrl) {
                try {
                    const name = (() => {
                        try {
                            const u = new URL(finalUrl);
                            return u.pathname.replace(/^\//, '');
                        } catch { return ''; }
                    })();

                    if (name) {
                        const verify = await fetch(`/api/daily/room?name=${encodeURIComponent(name)}`);
                        if (!verify.ok) {
                            const res = await fetch('/api/daily/room', { method: 'POST' });
                            if (res.ok) {
                                const j = await res.json();
                                finalUrl = j.url || finalUrl;
                                if (bookingId) {
                                    const supabase = (await import('@/utils/supabase/client')).createClient();
                                    await supabase
                                        .from('bookings')
                                        .update({ meeting_url: finalUrl })
                                        .eq('id', bookingId);
                                }
                            }
                        }
                    }
                } catch {}
                setRoomUrl(finalUrl);
                setIsJoined(true);
            }
        } finally {
            setIsPreparing(false);
        }
    };

    if (isJoined && roomUrl) {
        return (
            <div style={{ height: '100vh', width: '100vw' }}>
                <VideoCall roomUrl={roomUrl} userName={userName || 'Invitado'} bookingId={bookingId} />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgb(var(--background))', padding: '1rem'
        }}>
            <div style={{
                maxWidth: '500px', width: '100%',
                background: 'rgb(var(--surface))',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgb(var(--border))',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '60px', height: '60px', background: 'rgba(var(--primary), 0.1)',
                    color: 'rgb(var(--primary))', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Video size={30} />
                </div>

                <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Iniciar Videollamada</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem' }}>
                    {roomUrl ? 'Sala lista. Ingresa tu nombre para unirte.' : 'Ingresa el enlace de tu sala Daily.co para probar la integración.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
                    <Input
                        label="Nombre"
                        placeholder="Tu nombre (ej. Ana)"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                </div>

                <Button
                    onClick={handleJoin}
                    disabled={isPreparing || !userName}
                    style={{ width: '100%' }}
                >
                    {isPreparing ? 'Preparando sala...' : 'Unirse a la Llamada'}
                </Button>
            </div>
        </div>
    );
}

export default function CallPage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando sala...</div>}>
            <CallContent />
        </Suspense>
    );
}
