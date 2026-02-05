'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Eye } from 'lucide-react';
import ToggleUserStatusButton from './ToggleUserStatusButton';
import DeleteUserButton from './DeleteUserButton';
import BulkActionsBar from './BulkActionsBar';

interface ProfileRow {
    id: string;
    full_name?: string | null;
    email?: string | null;
    role?: 'client' | 'expert' | 'admin' | null;
    status?: 'active' | 'suspended' | 'inactive' | 'deleted' | null;
}

interface UsersTableWithBulkProps {
    users: ProfileRow[];
}

export default function UsersTableWithBulk({ users }: UsersTableWithBulkProps) {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedUsers(users.map(u => u.id));
        } else {
            setSelectedUsers([]);
        }
    };

    const handleSelectUser = (userId: string, checked: boolean) => {
        if (checked) {
            setSelectedUsers(prev => [...prev, userId]);
        } else {
            setSelectedUsers(prev => prev.filter(id => id !== userId));
        }
    };

    const handleClearSelection = () => {
        setSelectedUsers([]);
    };

    const handleActionComplete = () => {
        setSelectedUsers([]);
    };

    const allSelected = users.length > 0 && selectedUsers.length === users.length;
    const someSelected = selectedUsers.length > 0 && selectedUsers.length < users.length;

    return (
        <>
            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))' }}>
                            <th style={{ padding: '1rem', width: '40px' }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) {
                                            input.indeterminate = someSelected;
                                        }
                                    }}
                                    onChange={(e) => handleSelectAll(e.target.checked)}
                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    title="Seleccionar todos"
                                />
                            </th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Nombre</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Email</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Rol</th>
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Estado</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user: ProfileRow) => (
                            <tr
                                key={user.id}
                                style={{
                                    borderBottom: '1px solid rgb(var(--border))',
                                    background: selectedUsers.includes(user.id) ? 'rgba(var(--primary), 0.05)' : 'transparent'
                                }}
                            >
                                <td style={{ padding: '1rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.includes(user.id)}
                                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                                        style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                    />
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontWeight: 500 }}>{user.full_name || 'Sin Nombre'}</div>
                                </td>
                                <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>{user.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        background: user.role === 'admin' ? 'rgba(var(--primary), 0.1)' : 'rgb(var(--surface-hover))',
                                        color: user.role === 'admin' ? 'rgb(var(--primary))' : 'rgb(var(--text-secondary))',
                                        textTransform: 'capitalize'
                                    }}>
                                        {user.role}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    {(() => {
                                        const status = user.status || 'active';
                                        const statusConfig = {
                                            active: { label: 'Activo', color: 'rgb(var(--success))' },
                                            suspended: { label: 'Suspendido', color: 'rgb(var(--warning))' },
                                            inactive: { label: 'Inactivo', color: 'rgb(var(--text-muted))' },
                                            deleted: { label: 'Eliminado', color: 'rgb(var(--danger))' }
                                        };
                                        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

                                        return (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                fontSize: '0.875rem',
                                                color: config.color
                                            }}>
                                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                                {config.label}
                                            </span>
                                        );
                                    })()}
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
                                        <ToggleUserStatusButton
                                            userId={user.id}
                                            currentStatus={(user.status || 'active') as 'active' | 'suspended'}
                                            userName={user.full_name || user.email || undefined}
                                        />
                                        <DeleteUserButton
                                            userId={user.id}
                                            userName={user.full_name || user.email || undefined}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                    No se encontraron usuarios registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <BulkActionsBar
                selectedUsers={selectedUsers}
                onClearSelection={handleClearSelection}
                onActionComplete={handleActionComplete}
            />
        </>
    );
}
