'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';

type Dispute = {
    id: string;
    created_at: string;
    reason: string;
    description: string;
    status: 'open' | 'resolved_refunded' | 'resolved_dismissed' | string;
    booking?: {
        id: string;
        date?: string;
        time?: string;
        expert?: { title?: string; profile?: { full_name?: string } };
    };
    resolution_notes?: string | null;
    user_attachments?: string[] | null;
    expert_response?: string | null;
    user_response?: string | null;
};

export default function UserDisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [filesById, setFilesById] = useState<Record<string, File[]>>({});

    useEffect(() => {
        const fetchDisputes = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('disputes')
                .select(`
                    *,
                    booking:bookings (
                        id, date, time,
                        expert:experts ( title, profile:profiles(full_name) )
                    )
                `)
                .eq('created_by', user.id) // Only my disputes
                .order('created_at', { ascending: false });

            if (!error && data) {
                setDisputes(data);
            }
            setLoading(false);
        };

        fetchDisputes();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open': return <span style={{ background: '#fff3cd', color: '#856404', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>En Revisión</span>;
            case 'resolved_refunded': return <span style={{ background: '#d1e7dd', color: '#0f5132', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>Reembolsado</span>;
            case 'resolved_dismissed': return <span style={{ background: '#f8d7da', color: '#721c24', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem' }}>Desestimado</span>;
            default: return <span>{status}</span>;
        }
    };

    const within24h = (createdAt: string) => {
        try {
            const ts = new Date(createdAt).getTime();
            return Date.now() - ts <= 24 * 60 * 60 * 1000;
        } catch { return false; }
    };

    const handleEvidenceUpload = async (dispute: Dispute) => {
        const files = filesById[dispute.id] || [];
        if (files.length === 0) return alert('Adjunta al menos un archivo.');
        setUploading(dispute.id);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setUploading(null); return; }
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
            const { addUserEvidence } = await import('@/app/admin/disputes/actions');
            const res = await addUserEvidence(dispute.id, paths);
            if (res.success) {
                alert('Evidencia enviada correctamente.');
                // Refresh local list
                setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, user_attachments: [ ...(d.user_attachments || []), ...paths ] } : d));
                setFilesById(prev => ({ ...prev, [dispute.id]: [] }));
            } else {
                alert('Error: ' + res.error);
            }
        } finally {
            setUploading(null);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle /> Mis Disputas
            </h1>

            {loading ? (
                <p>Cargando...</p>
            ) : disputes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', border: '1px dashed #ccc', borderRadius: '8px' }}>
                    <p style={{ color: '#666' }}>No tienes disputas registradas.</p>
                    <Link href="/user/bookings"><Button variant="outline" style={{ marginTop: '1rem' }}>Volver a mis reservas</Button></Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                        Experto: {dispute.booking?.expert?.profile?.full_name}
                                    </p>
                                </div>
                                <div>
                                    {getStatusBadge(dispute.status)}
                                </div>
                            </div>

                            <div style={{ background: '#f9f9f9', padding: '1rem', borderRadius: '4px', fontSize: '0.95rem', color: '#333' }}>
                                &ldquo;{dispute.description}&rdquo;
                            </div>

                            {dispute.resolution_notes && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.25rem' }}>Resolución:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#0f5132' }}>{dispute.resolution_notes}</p>
                                </div>
                            )}

                            {dispute.expert_response && (
                                <div style={{ marginTop: '0.75rem', borderTop: '1px solid #eee', paddingTop: '0.75rem' }}>
                                    <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.25rem' }}>Respuesta del experto:</strong>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>{dispute.expert_response}</p>
                                </div>
                            )}

                            {/* Evidencia del usuario: disponible 24h */}
                            {within24h(dispute.created_at) && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    {!dispute.user_response ? (
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.25rem' }}>Tu respuesta (solo una vez)</strong>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>Por favor, sé lo más explicativo posible. Luego no podrás editar ni enviar otra.</p>
                                            <textarea
                                                onChange={(e) => setFilesById(prev => ({ ...prev }))}
                                                id={`resp-${dispute.id}`}
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgb(var(--border))', minHeight: '90px', background: 'rgb(var(--background))', marginTop: '0.5rem' }}
                                            />
                                        <Button size="sm" style={{ marginTop: '0.5rem' }} onClick={async () => {
                                                const el = document.getElementById(`resp-${dispute.id}`) as HTMLTextAreaElement | null;
                                                const text = (el?.value || '').trim();
                                                if (text.length < 3) { alert('Escribe al menos 3 caracteres.'); return; }
                                                const { addUserResponse } = await import('@/app/admin/disputes/actions');
                                                const res = await addUserResponse(dispute.id, text);
                                                if (res.success) {
                                                    alert('Respuesta enviada.');
                                                    setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, user_response: text } : d));
                                                } else {
                                                    alert('Error: ' + res.error);
                                                }
                                            }}>Enviar respuesta</Button>
                                        </div>
                                    ) : (
                                        <div style={{ marginBottom: '0.75rem' }}>
                                            <strong style={{ fontSize: '0.9rem' }}>Tu respuesta:</strong>
                                            <p style={{ margin: '0.5rem 0 0', color: '#555' }}>{dispute.user_response}</p>
                                        </div>
                                    )}
                                    <strong style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.5rem' }}>Agregar evidencia</strong>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*,.pdf"
                                        onChange={(e) => setFilesById(prev => ({ ...prev, [dispute.id]: Array.from(e.target.files || []) }))}
                                        style={{ marginBottom: '0.75rem' }}
                                    />
                                    <Button size="sm" onClick={() => handleEvidenceUpload(dispute)} disabled={uploading === dispute.id}>
                                        {uploading === dispute.id ? 'Subiendo...' : 'Adjuntar'}
                                    </Button>
                                    {dispute.user_attachments && dispute.user_attachments.length > 0 && (
                                        <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#555' }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Adjuntos:</div>
                                            <ul style={{ margin: 0, paddingLeft: '1rem' }}>
                                                {dispute.user_attachments.map((p, idx) => (
                                                    <li key={p + idx}>{p}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
