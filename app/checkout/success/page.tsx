"use client";

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Calendar, Clock, Video, User, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import confetti from 'canvas-confetti';

function SuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const orderId = searchParams.get('id') || 'ORD-ERROR';
    const serviceTitle = searchParams.get('title') || 'Servicio';
    const expertName = searchParams.get('expert') || 'Experto';
    const date = searchParams.get('date');
    const time = searchParams.get('time');

    useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#10b981', '#f59e0b']
        });
    }, []);

    const roomUrl = searchParams.get('roomUrl');

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '600px', textAlign: 'center' }}>
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgb(var(--success))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)' }}>
                    <CheckCircle size={40} color="white" />
                </div>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', background: 'linear-gradient(to right, rgb(var(--primary)), rgb(var(--secondary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                ¡Reserva Confirmada!
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'rgb(var(--text-secondary))', marginBottom: '3rem' }}>
                Tu sesión ha sido agendada correctamente. Guarda el enlace de tu sala.
            </p>

            <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden', textAlign: 'left', marginBottom: '2rem' }}>
                <div style={{ background: 'rgb(var(--surface-hover))', padding: '1rem 1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', fontWeight: 500 }}>Orden #{orderId}</span>
                    <button onClick={() => { navigator.clipboard.writeText(roomUrl || ''); alert('Enlace copiado!'); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--primary))', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem' }}>
                        <Copy size={14} /> Copiar Enlace Sala
                    </button>
                </div>

                <div style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', lineHeight: '1.4' }}>{serviceTitle}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(var(--primary), 0.1)', borderRadius: '8px' }}><User size={20} color="rgb(var(--primary))" /></div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>Experto</div>
                                <div style={{ fontWeight: 500 }}>{expertName}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(var(--primary), 0.1)', borderRadius: '8px' }}><Calendar size={20} color="rgb(var(--primary))" /></div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>Fecha</div>
                                <div style={{ fontWeight: 500 }}>{date}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(var(--primary), 0.1)', borderRadius: '8px' }}><Clock size={20} color="rgb(var(--primary))" /></div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>Hora</div>
                                <div style={{ fontWeight: 500 }}>{time}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(var(--warning), 0.1)', borderRadius: '8px' }}><Video size={20} color="rgb(var(--warning))" /></div>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>Ubicación</div>
                                <div style={{ fontWeight: 500 }}>Sala de Video Privada</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem', background: 'rgb(var(--surface-hover))', borderTop: '1px solid rgb(var(--border))', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    <Button fullWidth onClick={() => router.push('/user/bookings')} style={{ background: 'rgb(var(--secondary))', color: 'white' }}>
                        Ver mis reservaciones
                    </Button>
                    <Button variant="outline" fullWidth onClick={() => router.push('/')}>
                        Volver al Inicio
                    </Button>
                </div>
            </div>

            <Link href="/" style={{ color: 'rgb(var(--text-secondary))', textDecoration: 'none', fontSize: '0.9rem' }}>
                Volver al inicio
            </Link>
        </div >
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando confirmación...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
