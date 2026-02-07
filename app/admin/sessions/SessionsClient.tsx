'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { Calendar, Tag, CheckCircle, Clock, Check, X, AlertCircle } from 'lucide-react';
import { checkDailyRoomStatus, approveBooking, rejectBooking } from './actions';
import { useRouter } from 'next/navigation';

interface Session {
    id: string;
    date: string;
    time: string;
    status: string;
    expert: { profile?: { full_name?: string } } | null;
    user_profile: { full_name?: string } | null;
    service: { title?: string; duration?: number; price?: number; currency?: string } | null;
    meeting_url?: string;
    cancellation_reason?: string;
    expires_at?: string;
}

export const SessionsClient = ({ sessions }: { sessions: Session[] }) => {
    const router = useRouter();
    const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
    const [statusMap, setStatusMap] = useState<Record<string, { participants: number, active: boolean, checked: boolean }>>({});
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update current time every second for countdown
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleCheckLive = async (sessionId: string, url: string | undefined) => {
        if (!url) return;
        setLoadingMap(prev => ({ ...prev, [sessionId]: true }));
        try {
            const status = await checkDailyRoomStatus(url);
            setStatusMap(prev => ({
                ...prev,
                [sessionId]: {
                    participants: status.participants,
                    active: status.active,
                    checked: true
                }
            }));
        } catch {
            // handle error
        } finally {
            setLoadingMap(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    const handleApprove = async (sessionId: string) => {
        if (!confirm('¿Confirmar pago y crear sala de reunión?')) return;

        setActionLoading(prev => ({ ...prev, [sessionId]: true }));
        try {
            const result = await approveBooking(sessionId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || 'Error al aprobar');
            }
        } catch (error) {
            alert('Error al aprobar el pago');
        } finally {
            setActionLoading(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    const handleReject = async (sessionId: string) => {
        const reason = prompt('Motivo de rechazo (opcional):');
        if (reason === null) return; // User cancelled

        setActionLoading(prev => ({ ...prev, [sessionId]: true }));
        try {
            const result = await rejectBooking(sessionId, reason || undefined);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || 'Error al rechazar');
            }
        } catch (error) {
            alert('Error al rechazar el pago');
        } finally {
            setActionLoading(prev => ({ ...prev, [sessionId]: false }));
        }
    };

    const formatTimeRemaining = (expiresAt: string | undefined) => {
        if (!expiresAt) return null;

        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - currentTime.getTime();

        if (diff <= 0) return 'Expirado';

        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {sessions.map(session => {
                const now = new Date();
                const sessionStart = new Date(`${session.date}T${session.time}`);
                const duration = session.service?.duration || 60;
                const sessionEnd = new Date(sessionStart.getTime() + duration * 60 * 1000);

                const isOngoing = now >= sessionStart && now <= sessionEnd;
                const isUpcoming = now < sessionStart;

                // Status badge
                let statusColor = 'var(--text-secondary)';
                let statusBg = 'var(--surface-hover)';
                let statusLabel = session.status;

                if (session.status === 'confirmed') {
                    statusColor = 'var(--success)';
                    statusBg = 'rgba(var(--success), 0.1)';
                    statusLabel = 'Confirmada';
                } else if (session.status === 'pending') {
                    statusColor = 'var(--warning)';
                    statusBg = 'rgba(var(--warning), 0.1)';
                    statusLabel = 'Pendiente';
                } else if (session.status === 'cancelled') {
                    statusColor = 'var(--error)';
                    statusBg = 'rgba(var(--error), 0.1)';
                    statusLabel = 'Cancelada';
                } else if (session.status === 'completed') {
                    statusColor = 'var(--primary)';
                    statusBg = 'rgba(var(--primary), 0.1)';
                    statusLabel = 'Finalizada';
                }

                // Check live button usage
                const liveStatus = statusMap[session.id];
                const checking = loadingMap[session.id];
                const isActionLoading = actionLoading[session.id];
                const timeRemaining = session.status === 'pending' ? formatTimeRemaining(session.expires_at) : null;

                return (
                    <div key={session.id} style={{
                        background: 'rgb(var(--surface))',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                    {session.service?.title || 'Servicio'}
                                </h3>
                                <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                    ID: <span style={{ fontFamily: 'monospace' }}>{session.id.slice(0, 8)}...</span>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                        background: statusBg, color: `rgb(${statusColor})`,
                                        fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                    }}>
                                        {statusLabel}
                                    </span>
                                    {isOngoing && session.status === 'confirmed' && (
                                        <span style={{
                                            padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                            background: 'rgba(var(--primary), 0.1)', color: 'rgb(var(--primary))',
                                            fontSize: '0.8rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem'
                                        }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgb(var(--primary))', display: 'inline-block' }} /> En curso
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                                <div style={{ fontWeight: 600 }}>{session.date}</div>
                                <div style={{ color: 'rgb(var(--text-secondary))' }}>{session.time} ({duration} min)</div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgb(var(--surface-hover))', borderRadius: 'var(--radius-md)' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.25rem' }}>CLIENTE</div>
                                <div style={{ fontWeight: 600 }}>{session.user_profile?.full_name || 'Desconocido'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.25rem' }}>EXPERTO</div>
                                <div style={{ fontWeight: 600 }}>{session.expert?.profile?.full_name || 'Desconocido'}</div>
                            </div>
                            {session.service?.price && (
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.25rem' }}>PRECIO</div>
                                    <div style={{ fontWeight: 600 }}>
                                        ${session.service.price} {session.service.currency || 'USD'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {session.status === 'cancelled' && session.cancellation_reason && (
                            <div style={{ padding: '0.75rem', background: 'rgba(var(--error), 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--error), 0.2)' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgb(var(--error))', marginBottom: '0.25rem' }}>Motivo de cancelación:</div>
                                <div style={{ fontSize: '0.9rem' }}>{session.cancellation_reason}</div>
                            </div>
                        )}

                        {/* Pending booking - show countdown and actions */}
                        {session.status === 'pending' && (
                            <div style={{ padding: '1rem', background: 'rgba(var(--warning), 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(var(--warning), 0.2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgb(var(--warning))', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Clock size={16} />
                                            Pendiente de confirmación de pago
                                        </div>
                                        {timeRemaining && (
                                            <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                                {timeRemaining === 'Expirado' ? (
                                                    <span style={{ color: 'rgb(var(--error))', fontWeight: 600 }}>⚠️ Tiempo expirado - Se cancelará automáticamente</span>
                                                ) : (
                                                    <>Expira en: <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{timeRemaining}</span></>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <Button
                                        size="sm"
                                        onClick={() => handleApprove(session.id)}
                                        disabled={isActionLoading || timeRemaining === 'Expirado'}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                    >
                                        <Check size={16} />
                                        {isActionLoading ? 'Procesando...' : 'Aprobar Pago'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleReject(session.id)}
                                        disabled={isActionLoading}
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'rgb(var(--error))', borderColor: 'rgb(var(--error))' }}
                                    >
                                        <X size={16} />
                                        Rechazar
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                            {session.status === 'confirmed' && session.meeting_url ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCheckLive(session.id, session.meeting_url)}
                                        disabled={checking}
                                    >
                                        {checking ? 'Verificando...' : 'Verificar Conexión'}
                                    </Button>

                                    {liveStatus?.checked && (
                                        <div style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            {liveStatus.active ? (
                                                <span style={{ color: 'rgb(var(--success))', fontWeight: 600 }}>Online: {liveStatus.participants} conectados</span>
                                            ) : (
                                                <span style={{ color: 'rgb(var(--text-muted))' }}>Offline (0 conectados)</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div />
                            )}

                            {session.meeting_url && (
                                <Link href={session.meeting_url} target="_blank" style={{ fontSize: '0.85rem', color: 'rgb(var(--primary))', textDecoration: 'underline' }}>
                                    Link de la sala
                                </Link>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
