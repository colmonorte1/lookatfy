import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getAdminWithdrawals } from './actions';
import AdminWithdrawalsList from '@/components/admin/AdminWithdrawalsList';
import WithdrawalsDashboard from './WithdrawalsDashboard';
import SearchFilters from './SearchFilters';
import Pagination from '@/components/ui/Pagination/Pagination';
import Alert from '@/components/ui/Alert/Alert';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        range?: string;
    }>;
}

const ITEMS_PER_PAGE = 15;

export default async function AdminWithdrawalsPage({ searchParams }: PageProps) {
    const supabase = await createClient();

    // Authentication and authorization check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin/withdrawals');
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

    // Get filters from search params
    const params = await searchParams;
    const currentPage = Math.max(1, parseInt(params.page || '1'));
    const searchQuery = params.search || '';
    const statusFilter = params.status || '';
    const dateRange = params.range || '';
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    // Get all withdrawal details from actions
    let details = await getAdminWithdrawals();
    let fetchError = details.length === 0 ? null : null;

    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
        const days = parseInt(dateRange);
        if (!isNaN(days)) {
            const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            details = details.filter(d => {
                const requestedAt = new Date(d.withdrawal.requested_at);
                return requestedAt >= dateFilter;
            });
        }
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
        details = details.filter(d => d.withdrawal.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        details = details.filter(d => {
            const idMatch = d.withdrawal.id.toLowerCase().includes(lowerSearch);
            const expertNameMatch = (d.expert.full_name || '').toLowerCase().includes(lowerSearch);
            const expertEmailMatch = (d.expert.email || '').toLowerCase().includes(lowerSearch);
            const expertIdMatch = d.expert.id.toLowerCase().includes(lowerSearch);
            return idMatch || expertNameMatch || expertEmailMatch || expertIdMatch;
        });
    }

    // Pagination
    const totalCount = details.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const paginatedDetails = details.slice(offset, offset + ITEMS_PER_PAGE);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Solicitudes de Retiro</h1>
            </div>

            {fetchError && (
                <div style={{ marginBottom: '2rem' }}>
                    <Alert
                        type="error"
                        title="Error al cargar retiros"
                        message="No se pudieron cargar las solicitudes de retiro. Por favor, intenta recargar la página."
                    />
                </div>
            )}

            {/* Dashboard with KPIs */}
            <WithdrawalsDashboard />

            {/* Search and Filters */}
            <SearchFilters />

            {/* Withdrawals List */}
            <AdminWithdrawalsList items={paginatedDetails} />

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath="/admin/withdrawals"
                />
            )}

            <div style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginTop: '1rem' }}>
                Mostrando {paginatedDetails.length > 0 ? offset + 1 : 0} - {offset + paginatedDetails.length} de {totalCount} solicitudes
            </div>
        </div>
    );
}
