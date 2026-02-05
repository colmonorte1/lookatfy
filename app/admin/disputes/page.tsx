import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import DisputesClient from './DisputesClient';
import DisputesDashboard, { type DisputeStats } from './DisputesDashboard';
import SearchFilters from './SearchFilters';
import Pagination from '@/components/ui/Pagination/Pagination';
import Alert from '@/components/ui/Alert/Alert';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        range?: string;
        reporter?: string;
    }>;
}

const ITEMS_PER_PAGE = 10;

type Reporter = { full_name?: string; role?: 'client' | 'expert' | 'admin' };
type BookingView = {
    id: string;
    service?: { title?: string };
    user?: { full_name?: string; email?: string };
    expert?: { full_name?: string; email?: string };
};
type AdminDispute = {
    id: string;
    created_at: string;
    reason: string;
    description: string;
    status: 'open' | 'under_review' | 'resolved_refunded' | 'resolved_dismissed';
    resolution_notes?: string | null;
    resolved_at?: string | null;
    user_attachments?: string[] | null;
    expert_attachments?: string[] | null;
    expert_response?: string | null;
    user_response?: string | null;
    booking_id?: string | null;
    created_by?: string | null;
    reporter?: Reporter;
    booking?: BookingView;
};

export default async function DisputesPage({ searchParams }: PageProps) {
    const supabase = await createClient();

    // Authentication check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin/disputes');
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
    const reporterFilter = params.reporter || '';
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    // Use Service Role if available to bypass RLS
    let client = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        client = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { cookies: { getAll: () => [], setAll: () => {} } }
        );
    }

    // Fetch disputes WITHOUT complex joins to avoid RLS issues
    const { data: allDisputes, error: disputesError } = await client
        .from('disputes')
        .select('*')
        .order('created_at', { ascending: false });

    if (disputesError) {
        console.error('Error fetching disputes:', disputesError);
    }

    const disputes = allDisputes || [];

    // Fetch reporters (profiles) separately
    const reporterIds = [...new Set(disputes.map(d => d.created_by).filter(Boolean))];
    let reportersMap: Record<string, { full_name?: string; role?: string }> = {};

    if (reporterIds.length > 0) {
        const { data: reporters } = await client
            .from('profiles')
            .select('id, full_name, role')
            .in('id', reporterIds);

        (reporters || []).forEach((r: { id: string; full_name?: string; role?: string }) => {
            reportersMap[r.id] = { full_name: r.full_name, role: r.role };
        });
    }

    // Fetch bookings separately
    const bookingIds = [...new Set(disputes.map(d => d.booking_id).filter(Boolean))];
    let bookingsMap: Record<string, { id: string; user_id?: string; expert_id?: string; service_id?: string }> = {};

    if (bookingIds.length > 0) {
        const { data: bookings } = await client
            .from('bookings')
            .select('id, user_id, expert_id, service_id')
            .in('id', bookingIds);

        (bookings || []).forEach((b: any) => {
            bookingsMap[b.id] = b;
        });
    }

    // Fetch services separately
    const serviceIds = [...new Set(Object.values(bookingsMap).map(b => b.service_id).filter(Boolean))];
    let servicesMap: Record<string, { title?: string }> = {};

    if (serviceIds.length > 0) {
        const { data: services } = await client
            .from('services')
            .select('id, title')
            .in('id', serviceIds);

        (services || []).forEach((s: any) => {
            servicesMap[s.id] = { title: s.title };
        });
    }

    // Fetch user/expert profiles separately
    const allUserIds = [...new Set([
        ...Object.values(bookingsMap).map(b => b.user_id),
        ...Object.values(bookingsMap).map(b => b.expert_id)
    ].filter(Boolean))];

    let profilesMap: Record<string, { full_name?: string; email?: string }> = {};

    if (allUserIds.length > 0) {
        const { data: profiles } = await client
            .from('profiles')
            .select('id, full_name, email')
            .in('id', allUserIds);

        (profiles || []).forEach((p: any) => {
            profilesMap[p.id] = { full_name: p.full_name, email: p.email };
        });
    }

    // Enrich disputes with booking and reporter info
    let enrichedDisputes: AdminDispute[] = disputes.map((d: any) => {
        const booking = d.booking_id ? bookingsMap[d.booking_id] : null;
        const reporter = d.created_by ? reportersMap[d.created_by] : null;

        return {
            ...d,
            reporter: reporter ? {
                full_name: reporter.full_name || '',
                role: reporter.role as 'client' | 'expert' | 'admin' | undefined
            } : undefined,
            booking: booking ? {
                id: booking.id,
                service: booking.service_id ? servicesMap[booking.service_id] : undefined,
                user: booking.user_id ? profilesMap[booking.user_id] : undefined,
                expert: booking.expert_id ? profilesMap[booking.expert_id] : undefined
            } : undefined
        };
    });

    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
        const days = parseInt(dateRange);
        if (!isNaN(days)) {
            const dateFilter = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            enrichedDisputes = enrichedDisputes.filter(d => {
                const createdAt = new Date(d.created_at);
                return createdAt >= dateFilter;
            });
        }
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
        enrichedDisputes = enrichedDisputes.filter(d => d.status === statusFilter);
    }

    // Apply reporter filter
    if (reporterFilter && reporterFilter !== 'all') {
        enrichedDisputes = enrichedDisputes.filter(d => d.reporter?.role === reporterFilter);
    }

    // Apply search filter
    if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        enrichedDisputes = enrichedDisputes.filter(d => {
            const reasonMatch = (d.reason || '').toLowerCase().includes(lowerSearch);
            const descMatch = (d.description || '').toLowerCase().includes(lowerSearch);
            const idMatch = d.id.toLowerCase().includes(lowerSearch);
            const userMatch = (d.booking?.user?.full_name || '').toLowerCase().includes(lowerSearch);
            const expertMatch = (d.booking?.expert?.full_name || '').toLowerCase().includes(lowerSearch);
            return reasonMatch || descMatch || idMatch || userMatch || expertMatch;
        });
    }

    // Pagination
    const totalCount = enrichedDisputes.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const paginatedDisputes = enrichedDisputes.slice(offset, offset + ITEMS_PER_PAGE);

    // Calculate stats for dashboard (using ALL disputes, not filtered)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // All disputes stats
    const openCount = disputes.filter(d => d.status === 'open').length;
    const underReviewCount = disputes.filter(d => d.status === 'under_review').length;

    const resolvedThisMonth = disputes.filter(d => {
        if (!['resolved_refunded', 'resolved_dismissed'].includes(d.status)) return false;
        const resolvedAt = d.resolved_at ? new Date(d.resolved_at) : null;
        return resolvedAt && resolvedAt >= startOfMonth;
    });
    const resolvedThisMonthCount = resolvedThisMonth.length;
    const refundedThisMonthCount = resolvedThisMonth.filter(d => d.status === 'resolved_refunded').length;
    const dismissedThisMonthCount = resolvedThisMonth.filter(d => d.status === 'resolved_dismissed').length;

    const resolvedLastMonth = disputes.filter(d => {
        if (!['resolved_refunded', 'resolved_dismissed'].includes(d.status)) return false;
        const resolvedAt = d.resolved_at ? new Date(d.resolved_at) : null;
        return resolvedAt && resolvedAt >= startOfLastMonth && resolvedAt <= endOfLastMonth;
    });

    // Historical totals
    const allResolved = disputes.filter(d => ['resolved_refunded', 'resolved_dismissed'].includes(d.status));
    const totalResolved = allResolved.length;
    const totalRefunded = disputes.filter(d => d.status === 'resolved_refunded').length;
    const totalDismissed = disputes.filter(d => d.status === 'resolved_dismissed').length;

    const refundRate = totalResolved > 0 ? (totalRefunded / totalResolved) * 100 : 0;

    // Average resolution time
    const resolutionTimes = allResolved
        .filter(d => d.resolved_at && d.created_at)
        .map(d => {
            const created = new Date(d.created_at).getTime();
            const resolved = new Date(d.resolved_at!).getTime();
            return (resolved - created) / (1000 * 60 * 60);
        });
    const avgResolutionHours = resolutionTimes.length > 0
        ? resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
        : 0;

    // Unique users and experts
    const userIds = new Set<string>();
    const expertIds = new Set<string>();
    disputes.forEach(d => {
        const booking = d.booking_id ? bookingsMap[d.booking_id] : null;
        if (booking?.user_id) userIds.add(booking.user_id);
        if (booking?.expert_id) expertIds.add(booking.expert_id);
    });

    // Status distribution
    const statusCount: Record<string, number> = {};
    disputes.forEach(d => {
        statusCount[d.status] = (statusCount[d.status] || 0) + 1;
    });
    const statusDistribution = Object.entries(statusCount).map(([status, count]) => ({ status, count }));

    // Reason distribution
    const reasonCount: Record<string, number> = {};
    disputes.forEach(d => {
        const reason = d.reason || 'Sin especificar';
        reasonCount[reason] = (reasonCount[reason] || 0) + 1;
    });
    const reasonDistribution = Object.entries(reasonCount)
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Changes calculation
    const openLastMonth = disputes.filter(d => {
        const createdAt = new Date(d.created_at);
        return d.status === 'open' && createdAt >= startOfLastMonth && createdAt <= endOfLastMonth;
    }).length;

    const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const stats: DisputeStats = {
        openCount,
        underReviewCount,
        resolvedThisMonthCount,
        refundedThisMonthCount,
        dismissedThisMonthCount,
        totalResolved,
        totalRefunded,
        totalDismissed,
        avgResolutionHours,
        refundRate,
        uniqueUsers: userIds.size,
        uniqueExperts: expertIds.size,
        statusDistribution,
        reasonDistribution,
        openChange: calcChange(openCount, openLastMonth),
        resolvedChange: calcChange(resolvedThisMonthCount, resolvedLastMonth.length)
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Disputas y Reclamos</h1>
            </div>

            {disputesError && (
                <div style={{ marginBottom: '2rem' }}>
                    <Alert
                        type="error"
                        title="Error al cargar disputas"
                        message="No se pudieron cargar las disputas. Por favor, intenta recargar la página."
                    />
                </div>
            )}

            {/* Dashboard with KPIs */}
            <DisputesDashboard stats={stats} />

            {/* Search and Filters */}
            <SearchFilters />

            {/* Disputes List */}
            <DisputesClient initialDisputes={paginatedDisputes} />

            {/* Pagination */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    basePath="/admin/disputes"
                />
            )}

            <div style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginTop: '1rem' }}>
                Mostrando {paginatedDisputes.length > 0 ? offset + 1 : 0} - {offset + paginatedDisputes.length} de {totalCount} disputas
            </div>
        </div>
    );
}
