import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Plus, Edit2, Trash2, Eye, Ban } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';

export default async function UsersPage() {
    const supabase = await createClient();

    // Fetch profiles
    const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
    // .order('created_at', { ascending: false }) // profiles table might not have created_at yet per my schema, using raw list

    if (error) {
        console.error("Error fetching users:", error);
    }

    // Filter out experts if we want strictly "users" mixed list or just roles that are NOT expert?
    // The previous mock filtered u.role !== 'expert'. Let's keep that logic if desired,
    // or arguably admin/users should show EVERYONE. 
    // Let's stick to the mock's logic: show all except experts (who have their own tab), 
    // OR show everyone since it's "Users".
    // The previous code had: USERS_MOCK.filter(u => u.role !== 'expert')
    // Let's replicate this behavior to keep the separate "Experts" View meaningful.
    const filteredUsers = (users || []).filter((u: any) => u.role !== 'expert');

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
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user: any) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
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
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        fontSize: '0.875rem',
                                        color: 'rgb(var(--success))' // Assuming active for simple profile existence
                                    }}>
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                                        Activo
                                    </span>
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
                                        <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--warning))' }} title="Suspender (Demo)">
                                            <Ban size={16} />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                                    No se encontraron usuarios registrados.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
