'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';

interface Dispute {
    id: string;
    created_at: string;
    reason: string;
    description: string;
    status: 'open' | 'under_review' | 'resolved_refunded' | 'resolved_dismissed';
    resolution_notes?: string;
    booking?: { id?: string; user?: { full_name?: string } };
    user_attachments?: string[] | null;
    expert_attachments?: string[] | null;
    user_response?: string | null;
    expert_response?: string | null;
}

type TabKey = 'all' | 'open' | 'under_review' | 'resolved_refunded' | 'resolved_dismissed';

export default function ExpertDisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [tab, setTab] = useState<TabKey>('all');
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const keys: TabKey[] = ['all','open','under_review','resolved_refunded','resolved_dismissed'];

    const lang = 'es';
    const dict = {
        es: {
            title: 'Disputas Recibidas',
            loading: 'Cargando...',
            error: 'Ocurrió un error',
            retry: 'Reintentar',
            empty: 'No tienes disputas en tu contra.',
            backToBookings: 'Volver a mis reservas',
            client: 'Cliente',
            tabs: { all: 'Todos', open: 'En Revisión', under_review: 'Analizando', resolved_refunded: 'Reembolsado', resolved_dismissed: 'Desestimado' },
            badges: { open: 'En Revisión', under_review: 'Analizando Soporte', resolved_refunded: 'Reembolsado (Contra Ti)', resolved_dismissed: 'Desestimado (A Favor)' },
            respondTitle: 'Tu respuesta',
            respondPlaceholder: 'Escribe una explicación breve y clara (mínimo 3 caracteres)',
            attachmentUrl: 'URL de evidencia (https://)',
            addAttachment: 'Agregar evidencia',
            sendResponse: 'Enviar respuesta',
            notReady: 'Función pendiente de activación del backend',
            remove: 'Quitar'
        },
        en: {
            title: 'Received Disputes',
            loading: 'Loading...',
            error: 'An error occurred',
            retry: 'Retry',
            empty: 'You have no disputes.',
            backToBookings: 'Back to my bookings',
            client: 'Client',
            tabs: { all: 'All', open: 'Under Review', under_review: 'Analyzing', resolved_refunded: 'Refunded', resolved_dismissed: 'Dismissed' },
            badges: { open: 'Under Review', under_review: 'Support Analyzing', resolved_refunded: 'Refunded (Against You)', resolved_dismissed: 'Dismissed (In Your Favor)' },
            respondTitle: 'Your response',
            respondPlaceholder: 'Write a brief and clear explanation (min 3 chars)',
            attachmentUrl: 'Evidence URL (https://)',
            addAttachment: 'Add evidence',
            sendResponse: 'Send response',
            notReady: 'Feature pending backend activation',
            remove: 'Remove'
        }
    } as const;

    const [filesById, setFilesById] = useState<Record<string, File[]>>({});
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const [responseById, setResponseById] = useState<Record<string, string>>({});
    const [sendingResponse, setSendingResponse] = useState<Record<string, boolean>>({});

    const within24h = (createdAt: string) => {
        try {
            const ts = new Date(createdAt).getTime();
            return Date.now() - ts <= 24 * 60 * 60 * 1000;
        } catch { return false; }
    };

    const handleEvidenceUpload = async (dispute: Dispute) => {
        const files = filesById[dispute.id] || [];
        if (files.length === 0) return alert('Adjunta al menos un archivo.');
        setUploading(prev => ({ ...prev, [dispute.id]: true }));
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setUploading(prev => ({ ...prev, [dispute.id]: false })); return; }
            const bucket = supabase.storage.from('disputes-evidence');
            const paths: string[] = [];
            for (const f of files) {
                const path = `${user.id}/${dispute.booking?.id || 'unknown'}/${Date.now()}_${f.name}`;
                const { getDisputeEvidenceSignedUpload } = await import('@/app/admin/disputes/actions');
                const { token, error: signErr } = await getDisputeEvidenceSignedUpload(path);
                if (signErr || !token) { alert(signErr || 'No se pudo firmar la subida'); continue; }
                const { error: upErr } = await bucket.uploadToSignedUrl(path, token, f);
                if (!upErr) paths.push(path);
            }
            const { addExpertEvidence } = await import('@/app/admin/disputes/actions');
            const res = await addExpertEvidence(dispute.id, paths);
            if (res.success) {
                alert('Evidencia enviada correctamente.');
                setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, expert_attachments: [ ...(d.expert_attachments || []), ...paths ] } : d));
                setFilesById(prev => ({ ...prev, [dispute.id]: [] }));
            } else {
                alert('Error: ' + res.error);
            }
        } finally {
            setUploading(prev => ({ ...prev, [dispute.id]: false }));
        }
    };

    const handleSendResponse = async (dispute: Dispute) => {
        const text = (responseById[dispute.id] || '').trim();
        if (text.length < 3) return alert('Escribe al menos 3 caracteres.');
        setSendingResponse(prev => ({ ...prev, [dispute.id]: true }));
        try {
            const { addExpertResponse } = await import('@/app/admin/disputes/actions');
            const res = await addExpertResponse(dispute.id, text);
            if (res.success) {
                alert('Respuesta enviada.');
                setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, expert_response: text } : d));
                setResponseById(prev => ({ ...prev, [dispute.id]: '' }));
            } else {
                alert('Error: ' + res.error);
            }
        } finally {
            setSendingResponse(prev => ({ ...prev, [dispute.id]: false }));
        }
    };

    useEffect(() => {
        const fetchDisputes = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // We need to find disputes linked to bookings where I am the expert.
            // But 'disputes' only has created_by. We need to join with bookings.
            // AND the booking must have expert_id = my_id.

            // Supabase filter on foreign table relationship:
            // .eq('booking.expert_id', user.id) -> this syntax depends on postgrest version.
            // Typical way: 
            // .select('*, booking!inner(expert_id)') .eq('booking.expert_id', user.id)

            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    booking:bookings!inner (
                        id, date, time, expert_id,
                        user:profiles!user_id(full_name)
                    )
                `)
                .eq('booking.expert_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                setErrorMsg(error.message || 'Error cargando disputas');
            } else if (data) {
                setDisputes(data);
            }
            setLoading(false);
        };

        fetchDisputes();
    }, []);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setErrorMsg(null);
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }
            const start = (page - 1) * pageSize;
            const end = start + pageSize - 1;
            let query = supabase
                .from('disputes')
                .select(`
                    *,
                    booking:bookings!inner (
                        id, date, time, expert_id,
                        user:profiles!user_id(full_name)
                    )
                `)
                .eq('booking.expert_id', user.id)
                .order('created_at', { ascending: false })
                .range(start, end);
            if (tab !== 'all') query = query.eq('status', tab);
            const { data, error } = await query;
            if (error) {
                setErrorMsg(error.message || 'Error cargando disputas');
            } else if (data) {
                setDisputes(prev => page === 1 ? (data as Dispute[]) : [...prev, ...(data as Dispute[])]);
            }
            setLoading(false);
        };
        run();
    }, [tab, page]);

    const getStatusBadge = (status: Dispute['status']) => {
        const label = dict[lang].badges[status];
        switch (status) {
            case 'open': return <span style={{ background: 'rgba(255, 193, 7, 0.12)', color: '#2b2b2b', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(255, 193, 7, 0.5)' }}>{label}</span>;
            case 'under_review': return <span style={{ background: 'rgba(13, 110, 253, 0.12)', color: '#1f1f1f', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(13, 110, 253, 0.5)' }}>{label}</span>;
            case 'resolved_refunded': return <span style={{ background: 'rgba(220, 53, 69, 0.12)', color: '#1f1f1f', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(220, 53, 69, 0.5)' }}>{label}</span>;
            case 'resolved_dismissed': return <span style={{ background: 'rgba(25, 135, 84, 0.12)', color: '#1f1f1f', padding: '0.25rem 0.5rem', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(25, 135, 84, 0.5)' }}>{label}</span>;
            default: return <span>{status}</span>;
        }
    };

    return (
        <div style={{ maxWidth: '100%', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle /> {dict[lang].title}
            </h1>

            <div role="tablist" aria-label="Filtrar por estado" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                {keys.map(k => (
                    <button
                        key={k}
                        role="tab"
                        aria-selected={tab === k}
                        onClick={() => { setTab(k); setPage(1); setDisputes([]); }}
                        style={{
                            padding: '0.5rem 0.75rem',
                            borderRadius: '8px',
                            border: '1px solid rgb(var(--border))',
                            background: tab === k ? 'rgba(var(--primary),0.08)' : 'rgb(var(--surface))',
                            cursor: 'pointer'
                        }}
                    >
                        {dict[lang].tabs[k]}
                    </button>
                ))}
            </div>

            {loading ? (
                <p>{dict[lang].loading}</p>
            ) : errorMsg ? (
                <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--error))', color: 'rgb(var(--error))', padding: '1rem', borderRadius: '8px' }}>
                    <strong>{dict[lang].error}</strong>
                    <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{errorMsg}</div>
                    <Button variant="outline" onClick={() => window.location.reload()} style={{ marginTop: '0.75rem' }}>{dict[lang].retry}</Button>
                </div>
            ) : disputes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #ccc', borderRadius: '8px' }}>
                    <p style={{ color: '#666' }}>{dict[lang].empty}</p>
                    <Link href="/expert/bookings"><Button variant="outline" style={{ marginTop: '1rem' }}>{dict[lang].backToBookings}</Button></Link>
                </div>
            ) : (
                <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {disputes.map(dispute => (
                        <div key={dispute.id} style={{
                            background: 'white', padding: '1.5rem', borderRadius: '8px',
                            border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>
                                        {new Date(dispute.created_at).toLocaleDateString()}
                                    </div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{dispute.reason}</h3>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>
                                        {dict[lang].client}: {dispute.booking?.user?.full_name}
                                    </p>
                                </div>
                                <div>
                                    {getStatusBadge(dispute.status)}
                                </div>
                            </div>

                            <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '4px', fontSize: '0.95rem', color: '#333' }}>
                                {`"${dispute.description}"`}
                            </div>

                            {dispute.resolution_notes && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.25rem' }}>Soporte:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{dispute.resolution_notes}</p>
                                </div>
                            )}
                            {dispute.user_response && (
                                <div style={{ marginTop: '0.75rem', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                                    <strong style={{ fontSize: '0.9rem' }}>Respuesta del usuario:</strong>
                                    <p style={{ margin: '0.5rem 0 0', color: '#555' }}>{dispute.user_response}</p>
                                </div>
                            )}
                            {dispute.expert_response && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <strong style={{ fontSize: '0.9rem' }}>Tu respuesta:</strong>
                                    <p style={{ margin: '0.5rem 0 0', color: '#555' }}>{dispute.expert_response}</p>
                                </div>
                            )}
                            {(dispute.status === 'open' || dispute.status === 'under_review') && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tu respuesta (visible para admin y usuario)</label>
                                    <textarea
                                        value={responseById[dispute.id] || ''}
                                        onChange={(e) => setResponseById(prev => ({ ...prev, [dispute.id]: e.target.value }))}
                                        placeholder={dict[lang].respondPlaceholder}
                                        style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid rgb(var(--border))', minHeight: '90px', background: 'rgb(var(--background))' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button onClick={() => handleSendResponse(dispute)} disabled={sendingResponse[dispute.id] || !within24h(dispute.created_at)}>
                                            {sendingResponse[dispute.id] ? dict[lang].loading : dict[lang].sendResponse}
                                        </Button>
                                    </div>
                                    <label style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '0.75rem' }}>Evidencia (imágenes/pdf)</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf"
                                        onChange={(e) => setFilesById(prev => ({ ...prev, [dispute.id]: Array.from(e.target.files || []) }))}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button
                                            onClick={() => handleEvidenceUpload(dispute)}
                                            disabled={uploading[dispute.id] || !within24h(dispute.created_at)}
                                            style={{ minWidth: '160px' }}
                                        >
                                            {uploading[dispute.id] ? dict[lang].loading : 'Subir evidencia'}
                                        </Button>
                                    </div>
                                    {!within24h(dispute.created_at) && (
                                        <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>Ventana de 24h expirada para responder o adjuntar evidencia.</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
                        <Button variant="secondary" onClick={() => setPage(p => p + 1)} disabled={loading}>
                            {loading ? dict[lang].loading : 'Cargar más'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
