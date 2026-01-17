"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { USERS_MOCK } from '@/lib/data/users';
import { Plus, Edit2, Trash2, Eye, Ban } from 'lucide-react';

export default function UsersPage() {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Usuarios</h1>
                <Link href="/admin/users/new">
                    <Button style={{ gap: '0.5rem' }}>
                        <Plus size={18} />
                        Crear Usuario
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
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Nombre</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Email</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Rol</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Estado</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Fecha Registro</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {USERS_MOCK.filter(u => u.role !== 'expert').map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 500 }}>{user.name}</div>
                                </td>
                                <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: user.role === 'admin' ? 'rgba(var(--primary), 0.1)' : user.role === 'expert' ? 'rgba(var(--secondary), 0.1)' : 'rgb(var(--surface-hover))',
                                        color: user.role === 'admin' ? 'rgb(var(--primary))' : user.role === 'expert' ? 'rgb(var(--secondary))' : 'rgb(var(--text-secondary))',
                                        textTransform: 'capitalize'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.875rem',
                                        color: user.status === 'active' ? 'rgb(var(--success))' : 'rgb(var(--text-muted))'
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                        {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.875rem' }}>
                                    {user.joinedAt}
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Link href={`/admin/users/${user.id}`}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                title="Ver Detalle"
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
                    </tbody>
                </table>
            </div>
        </div>
    );
}
