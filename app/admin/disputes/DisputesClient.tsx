'use client';

import { useEffect, useState } from 'react';
import { resolveDispute } from './actions';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button/Button';
import { CheckCircle, XCircle, Download } from 'lucide-react';
import Image from 'next/image';

type Person = { full_name?: string; email?: string };
type Booking = {
    id?: string;
    date?: string;
    time?: string;
    price?: number;
    currency?: string;
    service?: { title?: string };
    user?: Person;
    expert?: Person;
};
type Dispute = {
    id: string;
    created_at: string;
    reason: string;
    description: string;
    status: 'open' | 'under_review' | 'resolved_refunded' | 'resolved_dismissed';
    resolution_notes?: string | null;
    resolved_at?: string | null;
    booking?: Booking;
    reporter?: { full_name?: string; role?: 'client' | 'expert' | 'admin' };
    user_attachments?: string[] | null;
    expert_attachments?: string[] | null;
    expert_response?: string | null;
    user_response?: string | null;
};

export default function DisputesClient({ initialDisputes }: { initialDisputes: Dispute[] }) {
    const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes || []);
    const [resolving, setResolving] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');

    // Update disputes when initialDisputes changes (from server-side filtering)
    useEffect(() => {
        setDisputes(initialDisputes || []);
    }, [initialDisputes]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return { label: 'Abierta', bg: 'rgba(var(--warning), 0.1)', color: 'rgb(var(--warning))' };
            case 'under_review':
                return { label: 'En revisión', bg: 'rgba(var(--info), 0.1)', color: 'rgb(var(--info))' };
            case 'resolved_refunded':
                return { label: 'Reembolsada', bg: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))' };
            case 'resolved_dismissed':
                return { label: 'Desestimada', bg: 'rgba(var(--error), 0.1)', color: 'rgb(var(--error))' };
            default:
                return { label: status, bg: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-secondary))' };
        }
    };

    const getRoleBadge = (role?: string) => {
        switch (role) {
            case 'client':
                return { label: 'Cliente', bg: 'rgba(var(--primary), 0.1)', color: 'rgb(var(--primary))' };
            case 'expert':
                return { label: 'Experto', bg: 'rgba(var(--info), 0.1)', color: 'rgb(var(--info))' };
            default:
                return { label: role || 'N/A', bg: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-secondary))' };
        }
    };

    const exportCSV = () => {
        const headers = ['dispute_id', 'status', 'reason', 'description', 'reporter_name', 'reporter_role', 'user_name', 'expert_name', 'service', 'created_at', 'resolved_at', 'resolution_notes'];
        const rows = disputes.map(d => [
            d.id,
            d.status,
            d.reason || '',
            (d.description || '').replace(/[\n\r,]/g, ' '),
            d.reporter?.full_name || '',
            d.reporter?.role || '',
            d.booking?.user?.full_name || '',
            d.booking?.expert?.full_name || '',
            d.booking?.service?.title || '',
            d.created_at,
            d.resolved_at || '',
            (d.resolution_notes || '').replace(/[\n\r,]/g, ' ')
        ]);
        const csv = [headers.join(','), ...rows.map(r => r.map(val => typeof val === 'string' && (val.includes(',') || val.includes('"')) ? `"${val.replace(/"/g, '""')}"` : String(val)).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `disputes_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const viewAttachment = async (path: string) => {
        try {
            const supabase = createClient();
            const bucket = supabase.storage.from('disputes-evidence');
            const { data, error } = await bucket.createSignedUrl(path, 60);
            if (error || !data?.signedUrl) {
                alert('No se pudo generar el enlace de descarga');
                return;
            }
            window.open(data.signedUrl, '_blank');
        } catch { }
    };

    const [signedMap, setSignedMap] = useState<Record<string, string>>({});
    const isImagePath = (p: string) => {
        const low = p.toLowerCase();
        return low.endsWith('.png') || low.endsWith('.jpg') || low.endsWith('.jpeg') || low.endsWith('.gif') || low.endsWith('.webp');
    };

    useEffect(() => {
        const run = async () => {
            const supabase = createClient();
            const bucket = supabase.storage.from('disputes-evidence');
            const allPaths = new Set<string>();
            disputes.forEach(d => {
                (d.user_attachments || []).forEach(p => allPaths.add(p));
                (d.expert_attachments || []).forEach(p => allPaths.add(p));
            });
            const entries = await Promise.all(Array.from(allPaths).map(async (p) => {
                const { data } = await bucket.createSignedUrl(p, 300);
                return [p, data?.signedUrl || ''] as const;
            }));
            const map: Record<string, string> = {};
            entries.forEach(([p, url]) => { if (url) map[p] = url; });
            setSignedMap(map);
        };
        if (disputes.length) run();
    }, [disputes]);

    const handleResolve = async (disputeId: string, status: 'resolved_refunded' | 'resolved_dismissed') => {
        if (!confirm('¿Estás seguro de esta resolución?')) return;

        const res = await resolveDispute(disputeId, {
            status,
            resolution_notes: resolutionNotes,
            admin_notes: 'Resolved via Admin Panel'
        });

        if (res.success) {
            alert('Disputa actualizada correctamente.');
            // Update local state
            setDisputes(prev => prev.map(d =>
                d.id === disputeId
                    ? { ...d, status, resolution_notes: resolutionNotes, resolved_at: new Date().toISOString() }
                    : d
            ));
            setResolving(null);
            setResolutionNotes('');
        } else {
            alert('Error: ' + res.error);
        }
    };

    return (
        <>
            {/* Header with count and export */}
            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                padding: '1rem 1.5rem',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                    {disputes.length} disputa{disputes.length !== 1 ? 's' : ''}
                </span>
                <Button variant="outline" size="sm" style={{ gap: '0.5rem' }} onClick={exportCSV}>
                    <Download size={16} />
                    Exportar CSV
                </Button>
            </div>

            {disputes.length === 0 ? (
                <div style={{
                    background: 'rgb(var(--surface))',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    padding: '3rem',
                    textAlign: 'center',
                    color: 'rgb(var(--text-secondary))'
                }}>
                    No se encontraron disputas con los filtros actuales.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {disputes.map((dispute) => {
                        const statusBadge = getStatusBadge(dispute.status);
                        const roleBadge = getRoleBadge(dispute.reporter?.role);

                        return (
                            <div key={dispute.id} style={{
                                background: 'rgb(var(--surface))',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgb(var(--border))'
                            }}>
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.8rem',
                                                fontWeight: 600,
                                                background: statusBadge.bg,
                                                color: statusBadge.color
                                            }}>
                                                {statusBadge.label}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                                {new Date(dispute.created_at).toLocaleDateString('es-CO', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>{dispute.reason}</h3>
                                        <p style={{ margin: '0.25rem 0 0', color: 'rgb(var(--text-secondary))', fontSize: '0.875rem' }}>
                                            ID: {dispute.id.slice(0, 8)}... {dispute.booking?.service?.title && `• Servicio: ${dispute.booking.service.title}`}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right', fontSize: '0.875rem' }}>
                                        <div style={{ marginBottom: '0.25rem' }}>
                                            <strong>Reportado por:</strong> {dispute.reporter?.full_name || 'N/A'}
                                            <span style={{
                                                marginLeft: '0.5rem',
                                                padding: '0.15rem 0.5rem',
                                                borderRadius: '0.75rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: roleBadge.bg,
                                                color: roleBadge.color
                                            }}>
                                                {roleBadge.label}
                                            </span>
                                        </div>
                                        <div>
                                            <strong>Contra:</strong> {dispute.reporter?.role === 'client'
                                                ? dispute.booking?.expert?.full_name
                                                : dispute.booking?.user?.full_name} ({dispute.reporter?.role === 'client' ? 'Experto' : 'Cliente'})
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <div style={{
                                    background: 'rgb(var(--background))',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1rem'
                                }}>
                                    <strong style={{ fontSize: '0.875rem' }}>Descripción:</strong>
                                    <p style={{ margin: '0.5rem 0 0', color: 'rgb(var(--text-main))' }}>{dispute.description}</p>
                                </div>

                                {/* Responses */}
                                {dispute.expert_response && (
                                    <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.875rem', color: 'rgb(var(--info))' }}>Respuesta del experto:</strong>
                                        <p style={{ margin: '0.5rem 0 0' }}>{dispute.expert_response}</p>
                                    </div>
                                )}
                                {dispute.user_response && (
                                    <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                                        <strong style={{ fontSize: '0.875rem', color: 'rgb(var(--primary))' }}>Respuesta del usuario:</strong>
                                        <p style={{ margin: '0.5rem 0 0' }}>{dispute.user_response}</p>
                                    </div>
                                )}

                                {/* Attachments */}
                                {((dispute.user_attachments && dispute.user_attachments.length > 0) || (dispute.expert_attachments && dispute.expert_attachments.length > 0)) && (
                                    <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '1rem', marginBottom: '1rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Evidencias</h4>
                                        {dispute.user_attachments && dispute.user_attachments.length > 0 && (
                                            <div style={{ marginBottom: '0.75rem' }}>
                                                <strong style={{ fontSize: '0.85rem' }}>Del usuario:</strong>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    {dispute.user_attachments.map((p, idx) => (
                                                        isImagePath(p) && signedMap[p] ? (
                                                            <div key={p + idx} style={{ width: 80, height: 80, position: 'relative', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer' }}>
                                                                <Image src={signedMap[p]} alt="Evidencia" fill sizes="80px" style={{ objectFit: 'cover' }} onClick={() => window.open(signedMap[p], '_blank')} />
                                                            </div>
                                                        ) : (
                                                            <Button key={p + idx} size="sm" variant="outline" onClick={() => viewAttachment(p)}>Ver archivo</Button>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {dispute.expert_attachments && dispute.expert_attachments.length > 0 && (
                                            <div>
                                                <strong style={{ fontSize: '0.85rem' }}>Del experto:</strong>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                    {dispute.expert_attachments.map((p, idx) => (
                                                        isImagePath(p) && signedMap[p] ? (
                                                            <div key={p + idx} style={{ width: 80, height: 80, position: 'relative', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer' }}>
                                                                <Image src={signedMap[p]} alt="Evidencia" fill sizes="80px" style={{ objectFit: 'cover' }} onClick={() => window.open(signedMap[p], '_blank')} />
                                                            </div>
                                                        ) : (
                                                            <Button key={p + idx} size="sm" variant="outline" onClick={() => viewAttachment(p)}>Ver archivo</Button>
                                                        )
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Resolution Actions */}
                                {dispute.status === 'open' && (
                                    <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '1rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', fontWeight: 600 }}>Resolver Disputa</h4>
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <textarea
                                                placeholder="Notas de resolución (mensaje para las partes involucradas)..."
                                                value={resolving === dispute.id ? resolutionNotes : ''}
                                                onChange={(e) => {
                                                    setResolving(dispute.id);
                                                    setResolutionNotes(e.target.value);
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.75rem',
                                                    border: '1px solid rgb(var(--border))',
                                                    borderRadius: 'var(--radius-md)',
                                                    background: 'rgb(var(--background))',
                                                    color: 'rgb(var(--text-main))',
                                                    fontSize: '0.875rem',
                                                    minHeight: '80px',
                                                    resize: 'vertical'
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <Button
                                                size="sm"
                                                style={{ background: 'rgb(var(--success))', color: 'white', gap: '0.5rem' }}
                                                onClick={() => handleResolve(dispute.id, 'resolved_refunded')}
                                            >
                                                <CheckCircle size={16} /> Aprobar Reembolso (Cliente)
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                style={{ borderColor: 'rgb(var(--error))', color: 'rgb(var(--error))', gap: '0.5rem' }}
                                                onClick={() => handleResolve(dispute.id, 'resolved_dismissed')}
                                            >
                                                <XCircle size={16} /> Desestimar (Experto)
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Resolution Info */}
                                {dispute.status !== 'open' && (
                                    <div style={{
                                        borderTop: '1px solid rgb(var(--border))',
                                        paddingTop: '1rem',
                                        color: 'rgb(var(--text-secondary))',
                                        fontSize: '0.875rem'
                                    }}>
                                        <strong>Resolución:</strong> {dispute.resolution_notes || 'Sin notas'}
                                        {dispute.resolved_at && (
                                            <span style={{ marginLeft: '0.5rem' }}>
                                                • {new Date(dispute.resolved_at).toLocaleString('es-CO')}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
