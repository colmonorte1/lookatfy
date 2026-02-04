import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ExpertActions } from '@/components/admin/ExpertActions';
import Pagination from '@/components/ui/Pagination/Pagination';
import Alert from '@/components/ui/Alert/Alert';
import SearchFilters from './SearchFilters';
import ExpertsDashboard from './ExpertsDashboard';

interface ExpertRow {
    id: string;
    title?: string | null;
    verified: boolean;
    profiles?: { full_name?: string | null; email?: string | null } | null;
}

interface PageProps {
    searchParams: Promise<{ page?: string; search?: string; verified?: string }>;
}

const ITEMS_PER_PAGE = 20;

export default async function AdminExpertsPage({ searchParams }: PageProps) {
    const supabase = await createClient();

    // Authentication and authorization check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin/experts');
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

    // Get current page and filters from search params
    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1'));
    const searchQuery = params.search || '';
    const verifiedFilter = params.verified || '';
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    // Fetch experts - first try with deleted_at filter, fallback without it
    let allExperts: any[] | null = null;
    let allError: any = null;

    // Try fetching experts (handle case where deleted_at column might not exist)
    let expertsQuery = supabase
        .from('experts')
        .select('*');

    // Try to filter by deleted_at (column may not exist in older schemas)
    try {
        const { data: expertsWithDelete, error: deleteError } = await supabase
            .from('experts')
            .select('*')
            .is('deleted_at', null)
            .order('created_at', { ascending: false });

        if (deleteError && deleteError.message?.includes('deleted_at')) {
            // Column doesn't exist, fetch without filter
            const { data, error } = await supabase
                .from('experts')
                .select('*')
                .order('created_at', { ascending: false });
            allExperts = data;
            allError = error;
        } else {
            allExperts = expertsWithDelete;
            allError = deleteError;
        }
    } catch {
        // Fallback: fetch without deleted_at filter
        const { data, error } = await supabase
            .from('experts')
            .select('*')
            .order('created_at', { ascending: false });
        allExperts = data;
        allError = error;
    }

    // Fetch profiles separately to avoid RLS issues with joins
    const expertIds = (allExperts || []).map((e: any) => e.id);
    let profilesMap: Record<string, { full_name?: string | null; email?: string | null }> = {};

    if (expertIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', expertIds);

        if (profiles) {
            profilesMap = profiles.reduce((acc: any, p: any) => {
                acc[p.id] = { full_name: p.full_name, email: p.email };
                return acc;
            }, {});
        }
    }

    // Merge experts with profiles
    let expertsWithProfiles = (allExperts || []).map((expert: any) => ({
        ...expert,
        profiles: profilesMap[expert.id] || null
    }));

    if (allError) {
        console.error("Error fetching experts:", {
            message: allError.message,
            details: allError.details,
            hint: allError.hint,
            code: allError.code
        });
    }

    // Apply verified filter
    if (verifiedFilter && verifiedFilter !== 'all') {
        const isVerified = verifiedFilter === 'verified';
        expertsWithProfiles = expertsWithProfiles.filter((e: any) => e.verified === isVerified);
    }

    // Filter by search query (name, email, or title)
    let filteredExperts = expertsWithProfiles;
    if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        filteredExperts = expertsWithProfiles.filter((expert: any) => {
            const profile = expert.profiles || {};
            const fullName = (profile?.full_name || '').toLowerCase();
            const email = (profile?.email || '').toLowerCase();
            const title = (expert.title || '').toLowerCase();

            return fullName.includes(lowerSearch) ||
                   email.includes(lowerSearch) ||
                   title.includes(lowerSearch);
        });
    }

    // Apply pagination to filtered results
    const totalCount = filteredExperts.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const expertList = filteredExperts.slice(offset, offset + ITEMS_PER_PAGE);
    const error = allError;

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

            {error && (
                <div style={{ marginBottom: '2rem' }}>
                    <Alert
                        type="error"
                        title="Error al cargar expertos"
                        message="No se pudieron cargar los expertos. Por favor, intenta recargar la página."
                    />
                </div>
            )}

            <ExpertsDashboard />

            <SearchFilters />

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
                        {expertList.map((expert: ExpertRow) => {
                            const profile = expert.profiles || {};
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

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath="/admin/experts"
                />
            )}

            <div style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginTop: '1rem' }}>
                Mostrando {expertList.length > 0 ? offset + 1 : 0} - {offset + expertList.length} de {totalCount || 0} expertos
            </div>
        </div>
    );
}
