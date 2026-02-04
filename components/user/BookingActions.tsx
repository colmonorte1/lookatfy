'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { XCircle, Video as VideoIcon, CheckCircle, AlertCircle, X } from 'lucide-react';
import { cancelBooking } from '@/app/user/actions';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { toISOTimeInTZ } from '@/utils/timezone';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface BookingActionsProps {
    bookingId: string;
    status: string;
    meetingUrl?: string; // Optional
    userName?: string;
    date: string;
    time: string;
    duration?: number;
    dispute?: { id: string; status: string } | null;
    startAt?: string;
    expertTimezone?: string | null;
    userTimezone?: string | null;
}

export function BookingActions({ bookingId, status, meetingUrl, userName, date, time, duration, dispute, startAt, expertTimezone, userTimezone }: BookingActionsProps) {
    const [loading, setLoading] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('no_show');
    const [disputeDescription, setDisputeDescription] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [remaining, setRemaining] = useState<number | null>(null);
    const [hasReview, setHasReview] = useState(false);
    const [existingDispute, setExistingDispute] = useState(dispute || null);
    type SimpleDispute = { id: string; status: string };

    // Toast notification state
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // DateTime Parsing Logic
    const getMeetingDateTime = () => {
        try {
            if (startAt) return new Date(startAt);
            const dateTimeStr = `${date} ${time}`;
            return new Date(dateTimeStr);
        } catch {
            return null;
        }
    };

    const meetingDate = getMeetingDateTime();
    const now = new Date();
    // Enable 1 hour before
    const isJoinable = meetingDate ? (now.getTime() >= meetingDate.getTime() - 60 * 60 * 1000) : false;

    useEffect(() => {
        const durMin = duration ?? 60;
        if (!meetingDate) {
            setRemaining(null);
            return;
        }
        const endTs = meetingDate.getTime() + durMin * 60 * 1000;
        const tick = () => {
            const nowMs = Date.now();
            const remain = Math.max(0, Math.floor((endTs - nowMs) / 1000));
            setRemaining(remain);
        };
        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
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

    useEffect(() => {
        const checkDispute = async () => {
            try {
                if (existingDispute) return;
                const supabase = createClient();
                const { data } = await supabase
                    .from('disputes')
                    .select('id, status')
                    .eq('booking_id', bookingId)
                    .limit(1);
                if (data && data.length > 0) setExistingDispute(data[0] as SimpleDispute);
            } catch {}
        };
        checkDispute();
    }, [bookingId, existingDispute]);

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            showToast('Por favor indica el motivo de la cancelación.', 'warning');
            return;
        }

        setLoading(true);
        const res = await cancelBooking(bookingId, cancelReason);
        setLoading(false);
        setCancelModalOpen(false);

        if (!res.success) {
            showToast('Error al cancelar: ' + res.error, 'error');
        } else {
            showToast('Reserva cancelada correctamente.', 'success');
        }
    };

    const handleDispute = async () => {
        if (!disputeDescription.trim()) {
            showToast('Por favor describe el problema.', 'warning');
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const attachments: string[] = [];
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && files.length) {
                const bucket = supabase.storage.from('disputes-evidence');
                for (const f of files) {
                    const path = `${user.id}/${bookingId}/${Date.now()}_${f.name}`;
                    const { getDisputeEvidenceSignedUpload } = await import('@/app/admin/disputes/actions');
                    const { token, error: signErr } = await getDisputeEvidenceSignedUpload(path);
                    if (signErr || !token) {
                        showToast(signErr || 'No se pudo firmar la subida', 'error');
                        continue;
                    }
                    const { error: upErr } = await bucket.uploadToSignedUrl(path, token, f);
                    if (!upErr) attachments.push(path);
                }
            }
        } catch {}

        const { createDispute } = await import('@/app/admin/disputes/actions');
        const res = await createDispute({
            booking_id: bookingId,
            reason: disputeReason,
            description: disputeDescription,
            attachments
        });
        setLoading(false);
        setDisputeModalOpen(false);

        if (res.error) {
            showToast(res.error, 'error');
        } else {
            showToast('Disputa enviada. Un administrador revisará tu caso.', 'success');
        }
    };

    if (status === 'completed' || status === 'cancelled') {
        const elapsedMs = meetingDate ? (Date.now() - meetingDate.getTime()) : 0;
        const reportWindowMs = 24 * 60 * 60 * 1000;
        const windowOpen = elapsedMs <= reportWindowMs;
        const disabledReport = !!existingDispute || !windowOpen;
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <Button variant="outline" fullWidth disabled>
                    {status === 'completed' ? 'Completada' : 'Cancelada'}
                </Button>

                {status === 'completed' && !hasReview && (
                    <div style={{ marginTop: '0.25rem' }}>
                        <Link href={`/call/feedback/${bookingId}`} style={{ width: '100%' }}>
                            <Button fullWidth variant="outline">Calificar experiencia</Button>
                        </Link>
                    </div>
                )}

                <Button
                    variant="ghost"
                    fullWidth
                    size="sm"
                    style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', textDecoration: 'underline' }}
                    onClick={() => !disabledReport && setDisputeModalOpen(true)}
                    disabled={disabledReport}
                    >
                    Reportar un problema
                </Button>
                {disabledReport && (
                    <span style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))' }}>
                        {existingDispute ? 'Ya existe una disputa para esta reserva.' : 'La ventana de reporte vence a las 24h.'}
                    </span>
                )}

                {/* Dispute Modal */}
                {disputeModalOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                    }}>
                        <div style={{
                            background: 'rgb(var(--surface))',
                            padding: '2rem',
                            borderRadius: 'var(--radius-lg)',
                            maxWidth: '400px',
                            width: '100%',
                            boxShadow: 'var(--shadow-lg)'
                        }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Reportar Problema</h3>
                            <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                Si tuviste un inconveniente con esta sesión, describe lo sucedido para que nuestro equipo lo revise.
                            </p>

                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Motivo</label>
                            <select
                                value={disputeReason}
                                onChange={(e) => setDisputeReason(e.target.value)}
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)',
                                    border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', marginBottom: '1rem'
                                }}
                            >
                                <option value="no_show">El experto no se presentó</option>
                                <option value="technical_issue">Problemas técnicos</option>
                                <option value="inappropriate">Comportamiento inapropiado</option>
                                <option value="other">Otro</option>
                            </select>

                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Descripción</label>
                            <textarea
                                value={disputeDescription}
                                onChange={(e) => setDisputeDescription(e.target.value)}
                                placeholder="Detalla lo sucedido..."
                                style={{
                                    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)',
                                    border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))',
                                    minHeight: '100px', marginBottom: '1.5rem', resize: 'vertical'
                                }}
                            />

                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>Evidencia (imágenes/pdf)</label>
                            <input
                                type="file"
                                multiple
                                accept="image/*,.pdf"
                                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                                style={{ marginBottom: '1rem' }}
                            />

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <Button variant="outline" onClick={() => setDisputeModalOpen(false)} disabled={loading}>Cancelar</Button>
                                <Button onClick={handleDispute} disabled={loading}>{loading ? 'Enviando...' : 'Enviar Reporte'}</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Toast Notifications */}
                {toasts.length > 0 && (
                    <div style={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        maxWidth: '400px'
                    }}>
                        {toasts.map(toast => (
                            <div
                                key={toast.id}
                                style={{
                                    background: 'rgb(var(--surface))',
                                    border: '1px solid rgb(var(--border))',
                                    borderLeft: `4px solid ${
                                        toast.type === 'success' ? 'rgb(var(--success))' :
                                        toast.type === 'error' ? 'rgb(var(--error))' :
                                        toast.type === 'warning' ? 'rgb(var(--warning))' :
                                        'rgb(var(--primary))'
                                    }`,
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    borderRadius: '8px',
                                    padding: '0.875rem 1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    animation: 'slideIn 0.3s ease-out'
                                }}
                            >
                                {toast.type === 'success' ? (
                                    <CheckCircle size={20} style={{ color: 'rgb(var(--success))', flexShrink: 0 }} />
                                ) : toast.type === 'error' ? (
                                    <XCircle size={20} style={{ color: 'rgb(var(--error))', flexShrink: 0 }} />
                                ) : (
                                    <AlertCircle size={20} style={{ color: toast.type === 'warning' ? 'rgb(var(--warning))' : 'rgb(var(--primary))', flexShrink: 0 }} />
                                )}
                                <span style={{ flex: 1, fontSize: '0.9rem', color: 'rgb(var(--text-main))' }}>
                                    {toast.message}
                                </span>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '0.25rem',
                                        color: 'rgb(var(--text-secondary))',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <style>{`
                    @keyframes slideIn {
                        from {
                            transform: translateX(100%);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(0);
                            opacity: 1;
                        }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            {status === 'confirmed' && meetingUrl && (
                <div style={{ width: '100%' }}>
                    {isJoinable && (remaining === null || remaining > 0) ? (
                        <Link href={`/call?roomUrl=${encodeURIComponent(meetingUrl)}&userName=${encodeURIComponent(userName || 'Usuario')}&bookingId=${bookingId}`} target="_blank" style={{ width: '100%' }}>
                            <Button fullWidth style={{ gap: '0.5rem' }}>
                                <VideoIcon size={16} /> Unirse ahora
                            </Button>
                        </Link>
                    ) : (
                        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
                            <Button fullWidth disabled style={{ gap: '0.5rem', opacity: 0.6 }}>
                                <VideoIcon size={16} /> Unirse ahora
                            </Button>
                            <span style={{ fontSize: '0.75rem', color: 'rgb(var(--text-secondary))', display: 'block', marginTop: '0.25rem' }}>
                                {(() => {
                                    const userTz = userTimezone || (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
                                    const expTz = expertTimezone || 'UTC';
                                    if (!meetingDate) return `Habilitado 1h antes (${date} ${time})`;
                                    const userLabel = toISOTimeInTZ(meetingDate, userTz);
                                    const expertLabel = toISOTimeInTZ(meetingDate, expTz);
                                    return `Habilitado 1h antes (Tu hora ${userLabel} • Experto ${expertLabel})`;
                                })()}
                            </span>
                        </div>
                    )}
                    {remaining !== null && (
                        <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                            {remaining > 0 ? (
                                <span>Quedan {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span>
                            ) : (
                                <span>Sesión finalizada</span>
                            )}
                        </div>
                    )}
                    {remaining !== null && remaining > 0 && remaining <= 600 && (
                        <div style={{ marginTop: '0.25rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600,
                            color: 'rgb(var(--warning))' }}>
                            Sesión por expirar (~10 min)
                        </div>
                    )}
                    {remaining !== null && remaining === 0 && !hasReview && (
                        <div style={{ marginTop: '0.5rem' }}>
                            <Link href={`/call/feedback/${bookingId}`} style={{ width: '100%' }}>
                                <Button fullWidth variant="outline">Calificar</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {(!remaining || remaining > 0) && (
                <Button
                    variant="outline"
                    fullWidth
                    style={{ color: 'rgb(var(--error))', borderColor: 'rgb(var(--error))' }}
                    onClick={() => setCancelModalOpen(true)}
                    disabled={loading}
                >
                    <XCircle size={16} style={{ marginRight: '0.5rem' }} />
                    {loading ? 'Cancelando...' : 'Cancelar Reserva'}
                </Button>
            )}

            {/* Simple Modal Implementation */}
            {cancelModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
                }}>
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '2rem',
                        borderRadius: 'var(--radius-lg)',
                        maxWidth: '400px',
                        width: '100%',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Confirmar Cancelación</h3>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1rem' }}>
                            ¿Estás seguro de que deseas cancelar esta reserva? Esta acción no se puede deshacer.
                        </p>

                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                            Motivo de la cancelación
                        </label>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Ej: Surgió un imprevisto..."
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius)',
                                border: '1px solid rgb(var(--border))',
                                background: 'rgb(var(--background))',
                                minHeight: '100px',
                                marginBottom: '1.5rem',
                                resize: 'vertical'
                            }}
                        />

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={() => setCancelModalOpen(false)} disabled={loading}>
                                Volver
                            </Button>
                            <Button
                                style={{ background: 'rgb(var(--error))', color: 'white' }}
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notifications */}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxWidth: '400px'
                }}>
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            style={{
                                background: 'rgb(var(--surface))',
                                border: '1px solid rgb(var(--border))',
                                borderLeft: `4px solid ${
                                    toast.type === 'success' ? 'rgb(var(--success))' :
                                    toast.type === 'error' ? 'rgb(var(--error))' :
                                    toast.type === 'warning' ? 'rgb(var(--warning))' :
                                    'rgb(var(--primary))'
                                }`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                borderRadius: '8px',
                                padding: '0.875rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                animation: 'slideIn 0.3s ease-out'
                            }}
                        >
                            {toast.type === 'success' ? (
                                <CheckCircle size={20} style={{ color: 'rgb(var(--success))', flexShrink: 0 }} />
                            ) : toast.type === 'error' ? (
                                <XCircle size={20} style={{ color: 'rgb(var(--error))', flexShrink: 0 }} />
                            ) : (
                                <AlertCircle size={20} style={{ color: toast.type === 'warning' ? 'rgb(var(--warning))' : 'rgb(var(--primary))', flexShrink: 0 }} />
                            )}
                            <span style={{ flex: 1, fontSize: '0.9rem', color: 'rgb(var(--text-main))' }}>
                                {toast.message}
                            </span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    color: 'rgb(var(--text-secondary))',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
