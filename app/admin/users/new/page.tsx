import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import NewUserForm from './NewUserForm';

export default async function NewUserPage() {
    const supabase = await createClient();

    // Authentication and authorization check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin/users/new');
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile || profile.role !== 'admin') {
        redirect('/');
    }

    return (
        <div style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/users" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem'
                }}>
                    <ArrowLeft size={16} />
                    Volver al listado
                </Link>
                <h1 style={{ fontSize: '2rem' }}>Crear Nuevo Usuario</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>
                    Los nuevos usuarios recibirán un email de confirmación para establecer su contraseña.
                </p>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))'
            }}>
                <NewUserForm />
            </div>
        </div>
    );
}
