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
    const router = useRouter();

    useEffect(() => {
        let newCallObject: DailyCall | null = null;

        const initCall = async () => {
            try {
                const existingCall = DailyIframe.getCallInstance();
                if (existingCall) {
                    await existingCall.destroy();
                }

                newCallObject = DailyIframe.createCallObject({
                    url: roomUrl,
                });

                newCallObject.on('error', (e: any) => {
                    console.error('Daily Error:', e);
                    setCallError(e?.errorMsg || 'Error al conectar con la sala.');
                });

                newCallObject.on('left-meeting', () => {
                    if (bookingId) {
                        router.push(`/call/feedback/${bookingId}`);
                    } else {
                        router.push('/');
                    }
                });

                setCallObject(newCallObject);

                await newCallObject.join({ userName });
            } catch (err: any) {
                console.error("Failed to init call", err);
                setCallError(err?.message || "No se pudo iniciar la llamada.");
            }
        };

        initCall();

        return () => {
            if (newCallObject) {
                newCallObject.leave();
                newCallObject.destroy();
            }
        };
    }, [roomUrl, userName]);

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
            <CallUI />
        </DailyProvider>
    );
}
