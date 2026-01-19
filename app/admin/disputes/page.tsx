'use client';

import { useEffect, useState } from 'react';
import { getDisputes, resolveDispute } from './actions';
import { Button } from '@/components/ui/Button/Button';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import styles from '@/components/layout/DashboardLayout.module.css'; // Reusing layout styles if possible or generic

export default function DisputesPage() {
    const [disputes, setDisputes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState('');

    useEffect(() => {
        loadDisputes();
    }, []);

    const loadDisputes = async () => {
        setLoading(true);
        const data = await getDisputes();
        setDisputes(data);
        setLoading(false);
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
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle /> Disputas y Reclamos
            </h1>

            {loading ? (
                <p>Cargando disputas...</p>
            ) : disputes.length === 0 ? (
                <p>No hay disputas pendientes.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {disputes.map((dispute) => (
                        <div key={dispute.id} style={{
                            background: 'white', padding: '1.5rem', borderRadius: '8px',
                            border: '1px solid #eee', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                            background: dispute.status === 'open' ? '#fff3cd' : dispute.status.includes('refunded') ? '#d1e7dd' : '#f8d7da',
                                            color: dispute.status === 'open' ? '#856404' : dispute.status.includes('refunded') ? '#0f5132' : '#721c24'
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

                            {dispute.status === 'open' && (
                                <div style={{ borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Resolver Disputa</h4>

                                    <div style={{ marginBottom: '0.5rem' }}>
                                        <textarea
                                            placeholder="Notas de resolución (mensaje para el usuario)..."
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
                                            <CheckCircle size={16} /> Aprobar Reembolso (Cliente)
                                        </Button>
                                        <Button
                                            size="sm"
                                            style={{ background: '#dc3545', color: 'white' }}
                                            variant="outline"
                                            onClick={() => handleResolve(dispute.id, 'resolved_dismissed')}
                                        >
                                            <XCircle size={16} /> Desestimar (Experto)
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {dispute.status !== 'open' && (
                                <div style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic' }}>
                                    Resuelto: {dispute.resolution_notes || 'Sin notas'}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
