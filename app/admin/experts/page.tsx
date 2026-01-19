import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { ExpertActions } from '@/components/admin/ExpertActions';

export default async function AdminExpertsPage() {
    const supabase = await createClient();

    // Fetch experts with joined profile data
    const { data: experts, error } = await supabase
        .from('experts')
        .select(`
            *,
            profiles (
                full_name,
                email
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching experts:", error);
    }

    const expertList = experts || [];

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
                            <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.875rem' }}>Título</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expertList.map((expert: any) => {
                            // Type guard/check for joined data
                            const profile = expert.profiles as any;
                            const fullName = profile?.full_name || 'Sin Nombre';
                            const email = profile?.email || 'No email';

                            return (
                                <tr key={expert.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 600 }}>{fullName}</div>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))' }}>{email}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.25rem',
                                            fontSize: '0.75rem',
                                            fontWeight: 600,
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            background: expert.verified ? 'rgba(var(--success), 0.1)' : 'rgba(var(--warning), 0.1)',
                                            color: expert.verified ? 'rgb(var(--success))' : 'rgb(var(--warning))'
                                        }}>
                                            {expert.verified ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                            {expert.verified ? 'Verificado' : 'Pendiente'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.875rem' }}>
                                        {expert.title || 'N/A'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <ExpertActions expertId={expert.id} isVerified={expert.verified} />
                                    </td>
                                </tr>
                            );
                        })}
                        {expertList.length === 0 && (
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
