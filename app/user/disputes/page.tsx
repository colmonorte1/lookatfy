'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { AlertCircle, Loader2, FileText, CheckCircle, XCircle, Clock, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

type Dispute = {
    id: string;
    created_at: string;
    reason: string;
    description: string;
    status: 'open' | 'resolved_refunded' | 'resolved_dismissed' | string;
    booking_id: string;
    resolution_notes?: string | null;
    user_attachments?: string[] | null;
    expert_response?: string | null;
    user_response?: string | null;
};

type Booking = {
    id: string;
    date?: string;
    time?: string;
    expert_id?: string;
};

type Expert = {
    id: string;
    title?: string;
};

type Profile = {
    id: string;
    full_name?: string;
};

// Format date to readable format: "Lun 10 Feb 2026"
const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

// Get filename from path
const getFilename = (path: string) => {
    const parts = path.split('/');
    const filename = parts[parts.length - 1];
    // Remove timestamp prefix if present (format: timestamp_filename.ext)
    return filename.replace(/^\d+_/, '');
};

export default function UserDisputesPage() {
    const [disputes, setDisputes] = useState<Dispute[]>([]);
    const [bookingsMap, setBookingsMap] = useState<Record<string, Booking>>({});
    const [expertsMap, setExpertsMap] = useState<Record<string, Expert>>({});
    const [profilesMap, setProfilesMap] = useState<Record<string, Profile>>({});
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<string | null>(null);
    const [filesById, setFilesById] = useState<Record<string, File[]>>({});

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

    useEffect(() => {
        const fetchDisputes = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch disputes without JOINs (RLS compatible)
            const { data: disputesData, error } = await supabase
                .from('disputes')
                .select('*')
                .eq('created_by', user.id)
                .order('created_at', { ascending: false });

            if (error || !disputesData) {
                setLoading(false);
                return;
            }

            setDisputes(disputesData);

            // 2. Get unique booking IDs
            const bookingIds = [...new Set(disputesData.map(d => d.booking_id).filter(Boolean))];

            if (bookingIds.length > 0) {
                // 3. Fetch bookings separately
                const { data: bookings } = await supabase
                    .from('bookings')
                    .select('id, date, time, expert_id')
                    .in('id', bookingIds);

                if (bookings) {
                    const bookingsRecord: Record<string, Booking> = {};
                    bookings.forEach((b: any) => {
                        bookingsRecord[b.id] = b;
                    });
                    setBookingsMap(bookingsRecord);

                    // 4. Get unique expert IDs
                    const expertIds = [...new Set(bookings.map((b: any) => b.expert_id).filter(Boolean))];

                    if (expertIds.length > 0) {
                        // 5. Fetch experts separately
                        const { data: experts } = await supabase
                            .from('experts')
                            .select('id, title')
                            .in('id', expertIds);

                        if (experts) {
                            const expertsRecord: Record<string, Expert> = {};
                            experts.forEach((e: any) => {
                                expertsRecord[e.id] = e;
                            });
                            setExpertsMap(expertsRecord);
                        }

                        // 6. Fetch profiles separately
                        const { data: profiles } = await supabase
                            .from('profiles')
                            .select('id, full_name')
                            .in('id', expertIds);

                        if (profiles) {
                            const profilesRecord: Record<string, Profile> = {};
                            profiles.forEach((p: any) => {
                                profilesRecord[p.id] = p;
                            });
                            setProfilesMap(profilesRecord);
                        }
                    }
                }
            }

            setLoading(false);
        };

        fetchDisputes();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return (
                    <span style={{
                        background: 'rgba(var(--warning), 0.1)',
                        color: 'rgb(var(--warning))',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <Clock size={12} /> En Revisión
                    </span>
                );
            case 'resolved_refunded':
                return (
                    <span style={{
                        background: 'rgba(var(--success), 0.1)',
                        color: 'rgb(var(--success))',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <CheckCircle size={12} /> Reembolsado
                    </span>
                );
            case 'resolved_dismissed':
                return (
                    <span style={{
                        background: 'rgba(var(--error), 0.1)',
                        color: 'rgb(var(--error))',
                        padding: '0.25rem 0.6rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                    }}>
                        <XCircle size={12} /> Desestimado
                    </span>
                );
            default:
                return <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{status}</span>;
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
        if (files.length === 0) {
            showToast('Adjunta al menos un archivo.', 'warning');
            return;
        }
        setUploading(dispute.id);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setUploading(null);
                return;
            }
            const bucket = supabase.storage.from('disputes-evidence');
            const paths: string[] = [];
            for (const f of files) {
                const path = `${user.id}/${dispute.booking_id || 'unknown'}/${Date.now()}_${f.name}`;
                const { getDisputeEvidenceSignedUpload } = await import('@/app/admin/disputes/actions');
                const { token, error: signErr } = await getDisputeEvidenceSignedUpload(path);
                if (signErr || !token) {
                    showToast(signErr || 'No se pudo firmar la subida', 'error');
                    continue;
                }
                const { error: upErr } = await bucket.uploadToSignedUrl(path, token, f);
                if (!upErr) paths.push(path);
            }
            const { addUserEvidence } = await import('@/app/admin/disputes/actions');
            const res = await addUserEvidence(dispute.id, paths);
            if (res.success) {
                showToast('Evidencia enviada correctamente.', 'success');
                // Refresh local list
                setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, user_attachments: [ ...(d.user_attachments || []), ...paths ] } : d));
                setFilesById(prev => ({ ...prev, [dispute.id]: [] }));
            } else {
                showToast('Error: ' + res.error, 'error');
            }
        } finally {
            setUploading(null);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle /> Mis Disputas
            </h1>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <Loader2 size={48} style={{ color: 'rgb(var(--primary))', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '1rem', color: 'rgb(var(--text-secondary))' }}>Cargando disputas...</p>
                </div>
            ) : disputes.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '4rem 2rem',
                    background: 'rgb(var(--surface))',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'rgba(var(--primary), 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem'
                    }}>
                        <FileText size={32} style={{ color: 'rgb(var(--primary))' }} />
                    </div>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', fontSize: '1rem' }}>
                        No tienes disputas registradas.
                    </p>
                    <Link href="/user/bookings">
                        <Button>Volver a mis reservas</Button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {disputes.map(dispute => {
                        const booking = bookingsMap[dispute.booking_id];
                        const expert = booking?.expert_id ? expertsMap[booking.expert_id] : null;
                        const profile = booking?.expert_id ? profilesMap[booking.expert_id] : null;
                        const expertName = profile?.full_name || expert?.title || 'Experto';

                        return (
                            <div key={dispute.id} style={{
                                background: 'rgb(var(--surface))',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgb(var(--border))',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.25rem' }}>
                                            {formatDate(dispute.created_at)}
                                        </div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgb(var(--text-main))', marginBottom: '0.25rem' }}>
                                            {dispute.reason}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>
                                            Experto: <span style={{ fontWeight: 500, color: 'rgb(var(--text-main))' }}>{expertName}</span>
                                        </p>
                                    </div>
                                    <div>
                                        {getStatusBadge(dispute.status)}
                                    </div>
                                </div>

                                <div style={{
                                    background: 'rgb(var(--background))',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.95rem',
                                    color: 'rgb(var(--text-main))',
                                    borderLeft: '3px solid rgb(var(--primary))'
                                }}>
                                    &ldquo;{dispute.description}&rdquo;
                                </div>

                                {dispute.resolution_notes && (
                                    <div style={{
                                        marginTop: '1rem',
                                        borderTop: '1px solid rgb(var(--border))',
                                        paddingTop: '1rem'
                                    }}>
                                        <strong style={{
                                            fontSize: '0.9rem',
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: 'rgb(var(--text-main))'
                                        }}>
                                            Resolución:
                                        </strong>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.9rem',
                                            color: 'rgb(var(--success))',
                                            background: 'rgba(var(--success), 0.05)',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)'
                                        }}>
                                            {dispute.resolution_notes}
                                        </p>
                                    </div>
                                )}

                                {dispute.expert_response && (
                                    <div style={{
                                        marginTop: '0.75rem',
                                        borderTop: '1px solid rgb(var(--border))',
                                        paddingTop: '0.75rem'
                                    }}>
                                        <strong style={{
                                            fontSize: '0.9rem',
                                            display: 'block',
                                            marginBottom: '0.5rem',
                                            color: 'rgb(var(--text-main))'
                                        }}>
                                            Respuesta del experto:
                                        </strong>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '0.9rem',
                                            color: 'rgb(var(--text-secondary))',
                                            background: 'rgb(var(--background))',
                                            padding: '0.75rem',
                                            borderRadius: 'var(--radius-md)'
                                        }}>
                                            {dispute.expert_response}
                                        </p>
                                    </div>
                                )}

                                {/* Evidencia del usuario: disponible 24h */}
                                {within24h(dispute.created_at) && (
                                    <div style={{
                                        marginTop: '1rem',
                                        borderTop: '1px solid rgb(var(--border))',
                                        paddingTop: '1rem',
                                        background: 'rgba(var(--primary), 0.02)',
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        marginLeft: '-1.5rem',
                                        marginRight: '-1.5rem',
                                        marginBottom: '-1.5rem'
                                    }}>
                                        {!dispute.user_response ? (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <strong style={{
                                                    fontSize: '0.9rem',
                                                    display: 'block',
                                                    marginBottom: '0.5rem',
                                                    color: 'rgb(var(--text-main))'
                                                }}>
                                                    Tu respuesta (solo una vez)
                                                </strong>
                                                <p style={{
                                                    margin: '0 0 0.75rem',
                                                    fontSize: '0.8rem',
                                                    color: 'rgb(var(--text-secondary))'
                                                }}>
                                                    Por favor, sé lo más explicativo posible. Luego no podrás editar ni enviar otra.
                                                </p>
                                                <textarea
                                                    id={`resp-${dispute.id}`}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid rgb(var(--border))',
                                                        minHeight: '90px',
                                                        background: 'rgb(var(--surface))',
                                                        color: 'rgb(var(--text-main))',
                                                        fontSize: '0.95rem',
                                                        fontFamily: 'inherit',
                                                        resize: 'vertical'
                                                    }}
                                                    placeholder="Describe tu situación con el mayor detalle posible..."
                                                />
                                                <Button
                                                    size="sm"
                                                    style={{ marginTop: '0.75rem' }}
                                                    onClick={async () => {
                                                        const el = document.getElementById(`resp-${dispute.id}`) as HTMLTextAreaElement | null;
                                                        const text = (el?.value || '').trim();
                                                        if (text.length < 3) {
                                                            showToast('Escribe al menos 3 caracteres.', 'warning');
                                                            return;
                                                        }
                                                        const { addUserResponse } = await import('@/app/admin/disputes/actions');
                                                        const res = await addUserResponse(dispute.id, text);
                                                        if (res.success) {
                                                            showToast('Respuesta enviada.', 'success');
                                                            setDisputes(prev => prev.map(d => d.id === dispute.id ? { ...d, user_response: text } : d));
                                                        } else {
                                                            showToast('Error: ' + res.error, 'error');
                                                        }
                                                    }}
                                                >
                                                    Enviar respuesta
                                                </Button>
                                            </div>
                                        ) : (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <strong style={{
                                                    fontSize: '0.9rem',
                                                    color: 'rgb(var(--text-main))',
                                                    display: 'block',
                                                    marginBottom: '0.5rem'
                                                }}>
                                                    Tu respuesta:
                                                </strong>
                                                <p style={{
                                                    margin: 0,
                                                    color: 'rgb(var(--text-secondary))',
                                                    background: 'rgb(var(--surface))',
                                                    padding: '0.75rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '0.9rem'
                                                }}>
                                                    {dispute.user_response}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <strong style={{
                                                fontSize: '0.9rem',
                                                display: 'block',
                                                marginBottom: '0.5rem',
                                                color: 'rgb(var(--text-main))'
                                            }}>
                                                Agregar evidencia
                                            </strong>
                                            <div style={{
                                                marginBottom: '0.75rem',
                                                padding: '1rem',
                                                border: '2px dashed rgb(var(--border))',
                                                borderRadius: 'var(--radius-md)',
                                                background: 'rgb(var(--surface))',
                                                textAlign: 'center'
                                            }}>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*,.pdf"
                                                    onChange={(e) => setFilesById(prev => ({ ...prev, [dispute.id]: Array.from(e.target.files || []) }))}
                                                    style={{
                                                        width: '100%',
                                                        cursor: 'pointer',
                                                        fontSize: '0.9rem',
                                                        color: 'rgb(var(--text-secondary))'
                                                    }}
                                                />
                                                <p style={{
                                                    margin: '0.5rem 0 0',
                                                    fontSize: '0.75rem',
                                                    color: 'rgb(var(--text-muted))'
                                                }}>
                                                    Acepta imágenes y PDFs
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleEvidenceUpload(dispute)}
                                                disabled={uploading === dispute.id}
                                            >
                                                {uploading === dispute.id ? 'Subiendo...' : 'Adjuntar archivos'}
                                            </Button>
                                            {dispute.user_attachments && dispute.user_attachments.length > 0 && (
                                                <div style={{
                                                    marginTop: '1rem',
                                                    fontSize: '0.85rem',
                                                    background: 'rgb(var(--surface))',
                                                    padding: '0.75rem',
                                                    borderRadius: 'var(--radius-md)'
                                                }}>
                                                    <div style={{
                                                        fontWeight: 600,
                                                        marginBottom: '0.5rem',
                                                        color: 'rgb(var(--text-main))'
                                                    }}>
                                                        Adjuntos ({dispute.user_attachments.length}):
                                                    </div>
                                                    <ul style={{
                                                        margin: 0,
                                                        paddingLeft: '1.25rem',
                                                        color: 'rgb(var(--text-secondary))'
                                                    }}>
                                                        {dispute.user_attachments.map((p, idx) => (
                                                            <li key={p + idx} style={{ marginBottom: '0.25rem' }}>
                                                                {getFilename(p)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
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
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
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
