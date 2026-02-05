import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Pagination from '@/components/ui/Pagination/Pagination';
import Alert from '@/components/ui/Alert/Alert';
import PaymentsDashboard from './PaymentsDashboard';
import SearchFilters from './SearchFilters';
import AdminPaymentsClient from '@/components/admin/AdminPaymentsClient';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        range?: string;
    }>;
}

const ITEMS_PER_PAGE = 20;

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
    const supabase = await createClient();

    // Authentication and authorization check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin/payments');
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

    // Get commission rate
    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('commission_percentage')
        .single();
    const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;

    // Build date filter
    let dateFilter: Date | null = null;
    if (dateRange && dateRange !== 'all') {
        const days = parseInt(dateRange);
        if (!isNaN(days)) {
            dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        }
    }

    // Fetch bookings WITHOUT joins to avoid RLS issues
    let bookingsQuery = supabase
        .from('bookings')
        .select('*')
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

    if (dateFilter) {
        bookingsQuery = bookingsQuery.gte('created_at', dateFilter.toISOString());
    }

    const { data: allBookings, error: bookingsError } = await bookingsQuery;

    if (bookingsError) {
        console.error("Error fetching payments:", bookingsError);
    }

    // Fetch disputes
    const { data: disputes } = await supabase
        .from('disputes')
        .select('booking_id, status, created_at')
        .in('status', ['open', 'under_review']);

    const disputedBookingIds = new Set(
        (disputes || []).map(d => d.booking_id).filter(Boolean)
    );

    // Fetch user profiles separately
    const userIds = [...new Set((allBookings || []).map(b => b.user_id).filter(Boolean))];
    let usersMap: Record<string, { full_name?: string | null }> = {};

    if (userIds.length > 0) {
        const { data: users } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

        if (users) {
            usersMap = users.reduce((acc: any, u: any) => {
                acc[u.id] = { full_name: u.full_name };
                return acc;
            }, {});
        }
    }

    // Fetch expert profiles separately
    const expertIds = [...new Set((allBookings || []).map(b => b.expert_id).filter(Boolean))];
    let expertsMap: Record<string, { full_name?: string | null }> = {};

    if (expertIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', expertIds);

        if (profiles) {
            expertsMap = profiles.reduce((acc: any, p: any) => {
                acc[p.id] = { full_name: p.full_name };
                return acc;
            }, {});
        }
    }

    // Format transactions with user/expert names
    let transactions = (allBookings || []).map(t => ({
        id: t.id,
        date: t.created_at || t.date || new Date().toISOString(),
        status: t.status,
        price: Number(t.price || 0),
        currency: t.currency || 'COP',
        userFullName: t.user_id ? usersMap[t.user_id]?.full_name : null,
        expertFullName: t.expert_id ? expertsMap[t.expert_id]?.full_name : null,
        inDispute: disputedBookingIds.has(t.id)
    }));

    // Apply search filter
    if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        transactions = transactions.filter(t => {
            const idMatch = t.id.toLowerCase().includes(lowerSearch);
            const userMatch = (t.userFullName || '').toLowerCase().includes(lowerSearch);
            const expertMatch = (t.expertFullName || '').toLowerCase().includes(lowerSearch);
            return idMatch || userMatch || expertMatch;
        });
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'disputed') {
            transactions = transactions.filter(t => t.inDispute);
        } else {
            transactions = transactions.filter(t => t.status === statusFilter);
        }
    }

    // Pagination
    const totalCount = transactions.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const paginatedTransactions = transactions.slice(offset, offset + ITEMS_PER_PAGE);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Pagos y Transacciones</h1>
            </div>

            {bookingsError && (
                <div style={{ marginBottom: '2rem' }}>
                    <Alert
                        type="error"
                        title="Error al cargar pagos"
                        message="No se pudieron cargar los pagos. Por favor, intenta recargar la página."
                    />
                </div>
            )}

            {/* Dashboard with KPIs */}
            <PaymentsDashboard />

            {/* Search and Filters */}
            <SearchFilters />

            {/* Transactions Table */}
            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden'
            }}>
                <AdminPaymentsClient
                    transactions={paginatedTransactions}
                    commissionRate={commissionRate}
                    disputedIds={Array.from(disputedBookingIds)}
                    disputes={(disputes || []) as { created_at: string; status: string }[]}
                />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath="/admin/payments"
                />
            )}

            <div style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginTop: '1rem' }}>
                Mostrando {paginatedTransactions.length > 0 ? offset + 1 : 0} - {offset + paginatedTransactions.length} de {totalCount} transacciones
            </div>
        </div>
    );
}
