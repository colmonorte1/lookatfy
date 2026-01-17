"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { ShieldAlert, CheckCircle, XCircle, MessageSquare, AlertTriangle, Eye, Gavel } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';

// Mock Data for Disputes
const DISPUTES_MOCK = [
    {
        id: 'DSP-001',
        date: '2024-01-18',
        claimant: 'Sofia Diaz (Usuario)',
        defendant: 'Maria Lopez (Experto)',
        service: 'Asesoría de Estilo Express',
        amount: 45,
        reason: 'El experto no se presentó a la sesión.',
        status: 'pending',
        evidence: 'Captura de pantalla de la sala de espera vacía.'
    },
    {
        id: 'DSP-002',
        date: '2024-01-15',
        claimant: 'Juan Ruiz (Usuario)',
        defendant: 'Pedro Gomez (Experto)',
        service: 'Revisión de Armario',
        amount: 120,
        reason: 'La calidad del servicio no fue la acordada.',
        status: 'resolved_refund',
        evidence: 'Fotos de recomendaciones genéricas.'
    },
    {
        id: 'DSP-003',
        date: '2024-01-10',
        claimant: 'Ana Vega (Experto)',
        defendant: 'Carlos User (Usuario)',
        service: 'Clase de Yoga',
        amount: 30,
        reason: 'Usuario solicitó reembolso injustificado tras completar la clase.',
        status: 'resolved_paid',
        evidence: 'Grabación de la sesión completa.'
    }
];

export default function DisputesPage() {
    const [disputes, setDisputes] = useState(DISPUTES_MOCK);
    const [selectedDispute, setSelectedDispute] = useState<typeof DISPUTES_MOCK[0] | null>(null);

    const handleResolve = (id: string, resolution: 'refund' | 'paid') => {
        setDisputes(prev => prev.map(d =>
            d.id === id ? { ...d, status: resolution === 'refund' ? 'resolved_refund' : 'resolved_paid' } : d
        ));
        setSelectedDispute(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldAlert size={32} color="rgb(var(--warning))" />
                    Buzón de Disputas
                </h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem 1rem', background: 'rgb(var(--surface))', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))' }}>
                        <span style={{ fontWeight: 700, color: 'rgb(var(--warning))' }}>{disputes.filter(d => d.status === 'pending').length}</span> Pendientes
                    </div>
                </div>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))' }}>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>ID / Fecha</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Partes Involucradas</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Motivo</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Monto</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Estado</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {disputes.map(dispute => (
                            <tr key={dispute.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{dispute.id}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{dispute.date}</div>
                                </td>
                                <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <span style={{ color: 'rgb(var(--error))' }}>Reclama: {dispute.claimant}</span>
                                        <span style={{ color: 'rgb(var(--text-secondary))' }}>Contra: {dispute.defendant}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem', maxWidth: '300px' }}>
                                    <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>{dispute.service}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', lineHeight: '1.4' }}>{dispute.reason}</div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>
                                    ${dispute.amount}
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        background: dispute.status === 'pending' ? 'rgba(var(--warning), 0.1)' : dispute.status === 'resolved_refund' ? 'rgba(var(--error), 0.1)' : 'rgba(var(--success), 0.1)',
                                        color: dispute.status === 'pending' ? 'rgb(var(--warning))' : dispute.status === 'resolved_refund' ? 'rgb(var(--error))' : 'rgb(var(--success))'
                                    }}>
                                        {dispute.status === 'pending' && <AlertTriangle size={14} />}
                                        {dispute.status === 'resolved_refund' && <XCircle size={14} />}
                                        {dispute.status === 'resolved_paid' && <CheckCircle size={14} />}
                                        {dispute.status === 'pending' ? 'Pendiente' : dispute.status === 'resolved_refund' ? 'Reembolsado' : 'Pagado'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedDispute(dispute)}
                                        style={{ color: dispute.status === 'pending' ? 'rgb(var(--primary))' : 'rgb(var(--text-secondary))' }}
                                    >
                                        {dispute.status === 'pending' ? <Gavel size={18} /> : <Eye size={18} />}
                                        <span style={{ marginLeft: '0.5rem' }}>{dispute.status === 'pending' ? 'Resolver' : 'Ver'}</span>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Resolution Modal */}
            <Modal
                isOpen={!!selectedDispute}
                onClose={() => setSelectedDispute(null)}
                title={`Resolución de Disputa ${selectedDispute?.id}`}
            >
                {selectedDispute && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ background: 'rgb(var(--surface-hover))', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                            <h4 style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>Pruebas Presentadas</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontStyle: 'italic' }}>
                                <MessageSquare size={16} /> "{selectedDispute.evidence}"
                            </div>
                        </div>

                        {selectedDispute.status === 'pending' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Determinar resultado:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <Button
                                        onClick={() => handleResolve(selectedDispute.id, 'refund')}
                                        style={{ background: 'rgb(var(--error))', color: 'white', justifyContent: 'center' }}
                                    >
                                        <XCircle size={18} style={{ marginRight: '0.5rem' }} />
                                        Reembolsar Cliente
                                    </Button>
                                    <Button
                                        onClick={() => handleResolve(selectedDispute.id, 'paid')}
                                        style={{ background: 'rgb(var(--success))', color: 'white', justifyContent: 'center' }}
                                    >
                                        <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                                        Liberar Pago Experto
                                    </Button>
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', textAlign: 'center', marginTop: '0.5rem' }}>
                                    Esta acción es irreversible y notificará a ambas partes.
                                </p>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                <p>Esta disputa ya fue cerrada con el resultado: <strong>
                                    {selectedDispute.status === 'resolved_refund' ? 'REEMBOLSO AL CLIENTE' : 'PAGO LIBERADO AL EXPERTO'}
                                </strong></p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
