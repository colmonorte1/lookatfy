'use client';

import { useEffect, useMemo, useState } from 'react';
import { getDisputes, resolveDispute } from './actions';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button/Button';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
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
    const [loading, setLoading] = useState(false);
    const [resolving, setResolving] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [tab, setTab] = useState<'all' | Dispute['status']>('all');
    const [query, setQuery] = useState('');

    const lang: 'es' | 'en' = 'es';
    const dict = {
        es: {
            title: 'Disputas y Reclamos',
            loading: 'Cargando disputas...',
            error: 'Error al cargar disputas',
            retry: 'Reintentar',
            empty: 'No hay disputas pendientes.',
            search: 'Buscar...',
            tabs: { all: 'Todas', open: 'Abiertas', under_review: 'En revisión', resolved_refunded: 'Reembolsadas', resolved_dismissed: 'Desestimadas' },
            resolveTitle: 'Resolver Disputa',
            textareaPlaceholder: 'Notas de resolución (mensaje para el usuario)...',
            refund: 'Aprobar Reembolso (Cliente)',
            dismiss: 'Desestimar (Experto)',
            reportedBy: 'Reportado por',
            against: 'Contra',
            description: 'Descripción',
            resolvedLabel: 'Resuelto',
        },
        en: {
            title: 'Disputes',
            loading: 'Loading disputes...',
            error: 'Failed to load disputes',
            retry: 'Retry',
            empty: 'No disputes found.',
            search: 'Search...',
            tabs: { all: 'All', open: 'Open', under_review: 'Under Review', resolved_refunded: 'Refunded', resolved_dismissed: 'Dismissed' },
            resolveTitle: 'Resolve Dispute',
            textareaPlaceholder: 'Resolution notes (message for the user)...',
            refund: 'Approve Refund (Client)',
            dismiss: 'Dismiss (Expert)',
            reportedBy: 'Reported by',
            against: 'Against',
            description: 'Description',
            resolvedLabel: 'Resolved',
        }
    } as const;

    const filtered = useMemo(() => {
        const base = tab === 'all' ? disputes : disputes.filter(d => d.status === tab);
        if (!query.trim()) return base;
        const q = query.toLowerCase();
        return base.filter(d =>
            (d.reason || '').toLowerCase().includes(q) ||
            (d.description || '').toLowerCase().includes(q)
        );
    }, [disputes, tab, query]);

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
        } catch {}
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

    const loadDisputes = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const data = await getDisputes();
            setDisputes(data);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleResolve = async (disputeId: string, status: 'resolved_refunded' | 'resolved_dismissed') => {
        if (!confirm('¿Estás seguro de esta resolución?')) return;

        const res = await resolveDispute(disputeId, {
            status,
            resolution_notes: resolutionNotes,
            admin_notes: 'Resolved via Admin Panel'
        });

        if (res.success) {
            alert('Disputa actualizada correctamente.');
            loadDisputes();
            setResolving(null);
            setResolutionNotes('');
        } else {
            alert('Error: ' + res.error);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle /> {dict[lang].title}
            </h1>

            <div role="tablist" aria-label="Filtrar por estado" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {(['all','open','under_review','resolved_refunded','resolved_dismissed'] as ('all' | Dispute['status'])[]).map(k => (
                    <button
                        key={k}
                        role="tab"
                        aria-selected={tab === k}
                        onClick={() => setTab(k)}
                        style={{
                            padding: '0.4rem 0.7rem',
                            borderRadius: 8,
                            border: '1px solid #d0d7de',
                            background: tab === k ? '#eef2ff' : '#ffffff',
                            color: '#0b1020',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        {dict[lang].tabs[k as keyof typeof dict['es']['tabs']]}
                    </button>
                ))}
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <input
                    aria-label={dict[lang].search}
                    placeholder={dict[lang].search}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ width: '100%', maxWidth: 360, padding: '0.5rem 0.6rem', borderRadius: 8, border: '1px solid #d0d7de' }}
                />
            </div>

            {loading ? (
                <p>{dict[lang].loading}</p>
            ) : errorMsg ? (
                <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--error))', color: 'rgb(var(--error))', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <strong>{dict[lang].error}</strong>
                    <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{errorMsg}</div>
                    <Button variant="outline" onClick={() => loadDisputes()} style={{ marginTop: '0.75rem' }}>{dict[lang].retry}</Button>
                </div>
            ) : filtered.length === 0 ? (
                <p>{dict[lang].empty}</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filtered.map((dispute) => (
                        <div key={dispute.id} style={{
                            background: 'white', padding: '1.5rem', borderRadius: '8px',
                            border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                                            background: dispute.status === 'open' ? '#FFF6D6' : dispute.status === 'under_review' ? '#E6F4FF' : dispute.status.includes('refunded') ? '#EAF7E6' : '#FFE9E6',
                                            color: dispute.status === 'open' ? '#5A4600' : dispute.status === 'under_review' ? '#083862' : dispute.status.includes('refunded') ? '#0F3D16' : '#7A0611',
                                            border: '1px solid #d0d7de'
                                        }}>
                                            {dispute.status}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: '#666' }}>
                                            {new Date(dispute.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem' }}>{dispute.reason}</h3>
                                    <p style={{ margin: 0, color: '#666' }}>Booking ID: {dispute.booking?.id?.slice(0, 8)}...</p>
                                </div>
                                <div style={{ textAlign: 'right', fontSize: '0.9rem' }}>
                                    <div><strong>Reportado por:</strong> {dispute.reporter?.full_name} ({dispute.reporter?.role})</div>
                                    <div><strong>Contra:</strong> {dispute.reporter?.role === 'client' ? dispute.booking?.expert?.full_name : dispute.booking?.user?.full_name}</div>
                                </div>
                            </div>

                            <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                                <strong>Descripción:</strong>
                                <p style={{ margin: '0.5rem 0 0' }}>{dispute.description}</p>
                            </div>

                            {dispute.expert_response && (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                                    <strong>Respuesta del experto:</strong>
                                    <p style={{ margin: '0.5rem 0 0' }}>{dispute.expert_response}</p>
                                </div>
                            )}
                            {dispute.user_response && (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: '0.75rem', marginBottom: '1rem' }}>
                                    <strong>Respuesta del usuario:</strong>
                                    <p style={{ margin: '0.5rem 0 0' }}>{dispute.user_response}</p>
                                </div>
                            )}

                            {(dispute.user_attachments && dispute.user_attachments.length > 0) || (dispute.expert_attachments && dispute.expert_attachments.length > 0) ? (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Adjuntos</h4>
                                    {dispute.user_attachments && dispute.user_attachments.length > 0 && (
                                        <div style={{ marginBottom: '0.5rem' }}>
                                            <strong>Usuario:</strong>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {dispute.user_attachments!.map((p, idx) => (
                                                    isImagePath(p) && signedMap[p] ? (
                                                        <div key={p + idx} style={{ width: 96, height: 96, position: 'relative', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                                                            <Image src={signedMap[p]} alt="Evidencia" fill sizes="96px" style={{ objectFit: 'cover' }} onClick={() => window.open(signedMap[p], '_blank')} />
                                                        </div>
                                                    ) : (
                                                        <Button key={p + idx} size="sm" variant="outline" onClick={() => viewAttachment(p)}>Ver evidencia</Button>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {dispute.expert_attachments && dispute.expert_attachments.length > 0 && (
                                        <div>
                                            <strong>Experto:</strong>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                                {dispute.expert_attachments!.map((p, idx) => (
                                                    isImagePath(p) && signedMap[p] ? (
                                                        <div key={p + idx} style={{ width: 96, height: 96, position: 'relative', border: '1px solid #eee', borderRadius: 6, overflow: 'hidden' }}>
                                                            <Image src={signedMap[p]} alt="Evidencia" fill sizes="96px" style={{ objectFit: 'cover' }} onClick={() => window.open(signedMap[p], '_blank')} />
                                                        </div>
                                                    ) : (
                                                        <Button key={p + idx} size="sm" variant="outline" onClick={() => viewAttachment(p)}>Ver evidencia</Button>
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {dispute.status === 'open' && (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>{dict[lang].resolveTitle}</h4>

                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <textarea
                                            placeholder={dict[lang].textareaPlaceholder}
                                            value={resolving === dispute.id ? resolutionNotes : ''}
                                            onChange={(e) => {
                                                setResolving(dispute.id);
                                                setResolutionNotes(e.target.value);
                                            }}
                                            style={{ width: '100%', padding: '0.5rem', border: '1px solid #ddd', borderRadius: '4px' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <Button
                                            size="sm"
                                            style={{ background: '#198754', color: 'white' }}
                                            onClick={() => handleResolve(dispute.id, 'resolved_refunded')}
                                        >
                                            <CheckCircle size={16} /> {dict[lang].refund}
                                        </Button>
                                        <Button
                                            size="sm"
                                            style={{ background: '#dc3545', color: 'white' }}
                                            variant="outline"
                                            onClick={() => handleResolve(dispute.id, 'resolved_dismissed')}
                                        >
                                            <XCircle size={16} /> {dict[lang].dismiss}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {dispute.status !== 'open' && (
                                <div style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                                    {dict[lang].resolvedLabel}: {dispute.resolution_notes || 'Sin notas'}
                                    {dispute.resolved_at ? ` · ${new Date(dispute.resolved_at).toLocaleString()}` : ''}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
