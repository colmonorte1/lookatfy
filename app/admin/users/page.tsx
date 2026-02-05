import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Plus } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Pagination from '@/components/ui/Pagination/Pagination';
import Alert from '@/components/ui/Alert/Alert';
import SearchFilters from './SearchFilters';
import UsersDashboard from './UsersDashboard';
import ExportButton from './ExportButton';
import UsersTableWithBulk from './UsersTableWithBulk';

interface ProfileRow {
    id: string;
    full_name?: string | null;
    email?: string | null;
    role?: 'client' | 'expert' | 'admin' | null;
    status?: 'active' | 'suspended' | 'inactive' | 'deleted' | null;
}

interface PageProps {
    searchParams: Promise<{ page?: string; search?: string; role?: string }>;
}

const ITEMS_PER_PAGE = 20;

export default async function UsersPage({ searchParams }: PageProps) {
    const supabase = await createClient();

    // Authentication and authorization check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin/users');
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
    const roleFilter = params.role || '';
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    // Build count query
    let countQuery = supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'expert')
        .is('deleted_at', null);

    // Apply search filter to count
    if (searchQuery) {
        countQuery = countQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    // Apply role filter to count
    if (roleFilter && roleFilter !== 'all') {
        countQuery = countQuery.eq('role', roleFilter);
    }

    const { count: totalCount } = await countQuery;
    const totalPages = Math.ceil((totalCount || 0) / ITEMS_PER_PAGE);

    // Build main query
    let usersQuery = supabase
        .from('profiles')
        .select('*')
        .neq('role', 'expert')
        .is('deleted_at', null);

    // Apply search filter
    if (searchQuery) {
        usersQuery = usersQuery.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    // Apply role filter
    if (roleFilter && roleFilter !== 'all') {
        usersQuery = usersQuery.eq('role', roleFilter);
    }

    // Fetch paginated profiles
    const { data: users, error } = await usersQuery
        .order('email', { ascending: true })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

    if (error) {
        console.error("Error fetching users:", error);
    }

    const filteredUsers: ProfileRow[] = users || [];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Usuarios</h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <ExportButton />
                    <Link href="/admin/users/new">
                        <Button style={{ gap: '0.5rem' }}>
                            <Plus size={18} />
                            Crear Usuario
                        </Button>
                    </Link>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: '2rem' }}>
                    <Alert
                        type="error"
                        title="Error al cargar usuarios"
                        message="No se pudieron cargar los usuarios. Por favor, intenta recargar la página."
                    />
                </div>
            )}

            <UsersDashboard />

            <SearchFilters />

            <UsersTableWithBulk users={filteredUsers} />

            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath="/admin/users"
                />
            )}

            <div style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginTop: '1rem' }}>
                Mostrando {filteredUsers.length > 0 ? offset + 1 : 0} - {offset + filteredUsers.length} de {totalCount || 0} usuarios
            </div>
        </div>
    );
}
