'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { XCircle, Video as VideoIcon } from 'lucide-react';
import { cancelBooking } from '@/app/user/actions';
import Link from 'next/link';

interface BookingActionsProps {
    bookingId: string;
    status: string;
    meetingUrl?: string; // Optional
    userName?: string;
    date: string;
    time: string;
    dispute?: { id: string; status: string } | null;
}

export function BookingActions({ bookingId, status, meetingUrl, userName, date, time, dispute }: BookingActionsProps) {
    const [loading, setLoading] = useState(false);
    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [disputeModalOpen, setDisputeModalOpen] = useState(false);
    const [disputeReason, setDisputeReason] = useState('no_show');
    const [disputeDescription, setDisputeDescription] = useState('');

    // DateTime Parsing Logic
    const getMeetingDateTime = () => {
        try {
            const dateTimeStr = `${date} ${time}`;
            return new Date(dateTimeStr);
        } catch (e) {
            return null;
        }
    };

    const meetingDate = getMeetingDateTime();
    const now = new Date();
    // Enable 1 hour before
    const isJoinable = meetingDate ? (now.getTime() >= meetingDate.getTime() - 60 * 60 * 1000) : false;

    const handleCancel = async () => {
        if (!cancelReason.trim()) {
            alert('Por favor indica el motivo de la cancelación.');
            return;
        }

        setLoading(true);
        const res = await cancelBooking(bookingId, cancelReason);
        setLoading(false);
        setCancelModalOpen(false);

        if (!res.success) {
            alert('Error al cancelar: ' + res.error);
        }
    };

    const handleDispute = async () => {
        if (!disputeDescription.trim()) return alert('Por favor describe el problema.');

        setLoading(true);
        const { createDispute } = await import('@/app/admin/disputes/actions');
        const res = await createDispute({
            booking_id: bookingId,
            reason: disputeReason,
            description: disputeDescription
        });
        setLoading(false);
        setDisputeModalOpen(false);

        if (res.error) alert(res.error);
        else alert('Disputa enviada. Un administrador revisará tu caso.');
    };

    if (status === 'completed' || status === 'cancelled') {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <Button variant="outline" fullWidth disabled>
                    {status === 'completed' ? 'Completada' : 'Cancelada'}
                </Button>

                <Button
                    variant="ghost"
                    fullWidth
                    size="sm"
                    style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', textDecoration: 'underline' }}
                    onClick={() => setDisputeModalOpen(true)}
                >
                    Reportar un problema
                </Button>

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

                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <Button variant="outline" onClick={() => setDisputeModalOpen(false)} disabled={loading}>Cancelar</Button>
                                <Button onClick={handleDispute} disabled={loading}>{loading ? 'Enviando...' : 'Enviar Reporte'}</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
            {status === 'confirmed' && meetingUrl && (
                <div style={{ width: '100%' }}>
                    {isJoinable ? (
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
                                Habilitado 1h antes ({date} {time})
                            </span>
                        </div>
                    )}
                </div>
            )}

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
        </div>
    );
}
