import { createClient } from '@/utils/supabase/server';
import { SessionsClient } from './SessionsClient';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { SearchFilters } from './SearchFilters';

export default async function AdminSessionsPage({
    searchParams,
}: {
    searchParams: Promise<{ status?: string; search?: string; dateFrom?: string; dateTo?: string }>;
}) {
    const supabase = await createClient();

    // Verify Admin Access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('/login');

    // Verify admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        return redirect('/');
    }

    // Get filter parameters
    const params = await searchParams;
    const statusFilter = params.status;
    const searchQuery = params.search?.toLowerCase();
    const dateFrom = params.dateFrom;
    const dateTo = params.dateTo;

    // Fetch all bookings (avoid JOINs due to RLS)
    let bookingsQuery = supabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(100);

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
        bookingsQuery = bookingsQuery.eq('status', statusFilter);
    }
    if (dateFrom) {
        bookingsQuery = bookingsQuery.gte('date', dateFrom);
    }
    if (dateTo) {
        bookingsQuery = bookingsQuery.lte('date', dateTo);
    }

    const { data: bookings, error } = await bookingsQuery;

    if (error) {
        return <div>Error loading sessions: {error.message}</div>;
    }

    // Fetch related data separately to avoid RLS issues
    const expertIds = [...new Set(bookings?.map(b => b.expert_id).filter(Boolean) || [])];
    const userIds = [...new Set(bookings?.map(b => b.user_id).filter(Boolean) || [])];
    const serviceIds = [...new Set(bookings?.map(b => b.service_id).filter(Boolean) || [])];

    const [expertsData, profilesData, servicesData] = await Promise.all([
        expertIds.length > 0
            ? supabase.from('experts').select('id, user_id').in('id', expertIds)
            : Promise.resolve({ data: [] }),
        userIds.length > 0
            ? supabase.from('profiles').select('id, full_name').in('id', [...userIds, ...expertIds])
            : Promise.resolve({ data: [] }),
        serviceIds.length > 0
            ? supabase.from('services').select('id, title, duration, price, currency').in('id', serviceIds)
            : Promise.resolve({ data: [] })
    ]);

    // Map data for easy lookup
    const expertsMap = new Map(expertsData.data?.map(e => [e.id, e]) || []);
    const profilesMap = new Map(profilesData.data?.map(p => [p.id, p]) || []);
    const servicesMap = new Map(servicesData.data?.map(s => [s.id, s]) || []);

    // Combine data
    const sessions = bookings?.map(booking => {
        const expert = booking.expert_id ? expertsMap.get(booking.expert_id) : null;
        const expertProfile = expert?.user_id ? profilesMap.get(expert.user_id) : null;
        const userProfile = booking.user_id ? profilesMap.get(booking.user_id) : null;
        const service = booking.service_id ? servicesMap.get(booking.service_id) : null;

        return {
            ...booking,
            expert: expert ? { profile: expertProfile } : null,
            user_profile: userProfile,
            service: service
        };
    }) || [];

    // Apply search filter (client-side for now since it searches across multiple fields)
    const filteredSessions = searchQuery
        ? sessions.filter(s =>
            s.user_profile?.full_name?.toLowerCase().includes(searchQuery) ||
            s.expert?.profile?.full_name?.toLowerCase().includes(searchQuery) ||
            s.service?.title?.toLowerCase().includes(searchQuery) ||
            s.id.toLowerCase().includes(searchQuery)
        )
        : sessions;

    // Calculate statistics
    const stats = {
        total: filteredSessions.length,
        pending: filteredSessions.filter(s => s.status === 'pending').length,
        confirmed: filteredSessions.filter(s => s.status === 'confirmed').length,
        completed: filteredSessions.filter(s => s.status === 'completed').length,
        cancelled: filteredSessions.filter(s => s.status === 'cancelled').length,
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Gestión de Sesiones</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link href="/admin">
                        <Button variant="outline">Volver</Button>
                    </Link>
                </div>
            </div>

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: 'rgb(var(--surface))',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))'
                }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>
                        Total
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stats.total}</div>
                </div>

                <div style={{
                    background: 'rgba(var(--warning), 0.1)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(var(--warning), 0.3)'
                }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--warning))', marginBottom: '0.5rem' }}>
                        Pendientes
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(var(--warning))' }}>{stats.pending}</div>
                </div>

                <div style={{
                    background: 'rgba(var(--success), 0.1)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(var(--success), 0.3)'
                }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--success))', marginBottom: '0.5rem' }}>
                        Confirmadas
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(var(--success))' }}>{stats.confirmed}</div>
                </div>

                <div style={{
                    background: 'rgba(var(--primary), 0.1)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(var(--primary), 0.3)'
                }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--primary))', marginBottom: '0.5rem' }}>
                        Completadas
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(var(--primary))' }}>{stats.completed}</div>
                </div>

                <div style={{
                    background: 'rgba(var(--error), 0.1)',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(var(--error), 0.3)'
                }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--error))', marginBottom: '0.5rem' }}>
                        Canceladas
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(var(--error))' }}>{stats.cancelled}</div>
                </div>
            </div>

            {/* Search and Filters */}
            <SearchFilters />

            {/* Sessions List */}
            <SessionsClient sessions={filteredSessions} />
        </div>
    );
}
