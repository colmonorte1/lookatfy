import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import EditUserForm from './EditUserForm';

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Authentication and authorization check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin/users/' + id + '/edit');
    }

    // Check if user is admin
    const { data: adminProfile, error: adminProfileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (adminProfileError || !adminProfile || adminProfile.role !== 'admin') {
        redirect('/');
    }

    // Fetch user to edit
    const { data: userToEdit, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (userError || !userToEdit) {
        notFound();
    }

    return (
        <div style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href={`/admin/users/${id}`} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem'
                }}>
                    <ArrowLeft size={16} />
                    Volver al perfil
                </Link>
                <h1 style={{ fontSize: '2rem' }}>Editar Usuario</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>
                    {userToEdit.full_name || userToEdit.email}
                </p>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))'
            }}>
                <EditUserForm user={userToEdit} />
            </div>
        </div>
    );
}
