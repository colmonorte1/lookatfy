"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { USERS_MOCK } from '@/lib/data/users';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Eye, Ban } from 'lucide-react';

export default function AdminExpertsPage() {
    const experts = USERS_MOCK.filter(u => u.role === 'expert');

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Gestión de Expertos</h1>
                <Link href="/admin/users/new?role=expert">
                    <Button style={{ gap: '0.5rem' }}>
                        <Plus size={18} />
                        Añadir Experto
                    </Button>
                </Link>
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
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Experto</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Email</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Estado</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Fecha Registro</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {experts.map(expert => (
                            <tr key={expert.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 600 }}>{expert.name}</div>
                                </td>
                                <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>{expert.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '1rem',
                                        background: expert.status === 'active' ? 'rgba(var(--success), 0.1)' : 'rgba(var(--warning), 0.1)',
                                        color: expert.status === 'active' ? 'rgb(var(--success))' : 'rgb(var(--warning))'
                                    }}>
                                        {expert.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                        {expert.status === 'active' ? 'Verificado' : 'Pendiente'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.875rem' }}>
                                    {expert.joinedAt}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Link href={`/admin/experts/${expert.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Ver Dashboard"
                                            >
                                                <Eye size={16} />
                                            </Button>
                                        </Link>
                                        <Button variant="ghost" size="sm" title="Editar">
                                            <Edit2 size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--warning))' }} title="Suspender">
                                            <Ban size={16} />
                                        </Button>
                                        <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--error))' }} title="Eliminar">
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {experts.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                    No se encontraron expertos registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
