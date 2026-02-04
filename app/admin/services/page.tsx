import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';
import Pagination from '@/components/ui/Pagination/Pagination';
import Alert from '@/components/ui/Alert/Alert';
import ServicesDashboard from './ServicesDashboard';
import SearchFilters from './SearchFilters';
import ServicesClient from './ServicesClient';
import AdminServicesClient from './AdminServicesClient';

interface PageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        status?: string;
        category?: string;
        type?: string;
        tab?: string;
    }>;
}

const ITEMS_PER_PAGE = 20;

export default async function AdminServicesPage({ searchParams }: PageProps) {
    const supabase = await createClient();

    // Authentication and authorization check
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        redirect('/login?redirect=/admin/services');
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
    const categoryFilter = params.category || '';
    const typeFilter = params.type || '';
    const currentTab = params.tab || 'expert';
    const offset = (currentPage - 1) * ITEMS_PER_PAGE;

    // Fetch services - avoid JOIN issues with RLS by doing separate queries
    let allServices: any[] | null = null;
    let allError: any = null;

    // First try with deleted_at filter
    const { data: servicesWithDelete, error: deleteError } = await supabase
        .from('services')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

    if (deleteError && deleteError.message?.includes('deleted_at')) {
        // Column doesn't exist, fetch without filter
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });
        allServices = data;
        allError = error;
    } else {
        allServices = servicesWithDelete;
        allError = deleteError;
    }

    if (allError) {
        console.error("Error fetching services:", allError);
    }

    // Fetch expert profiles separately to avoid RLS issues with joins
    const expertIds = [...new Set((allServices || []).map((s: any) => s.expert_id).filter(Boolean))];
    let expertsMap: Record<string, { full_name?: string | null }> = {};

    if (expertIds.length > 0) {
        // Get experts
        const { data: experts } = await supabase
            .from('experts')
            .select('id')
            .in('id', expertIds);

        if (experts && experts.length > 0) {
            // Get profiles for these experts
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
    }

    // Merge services with expert info
    const servicesWithExperts = (allServices || []).map((service: any) => ({
        ...service,
        experts: service.expert_id ? {
            profiles: expertsMap[service.expert_id] || null
        } : null
    }));

    // Get unique categories for filter dropdown
    const categories = [...new Set(
        (allServices || [])
            .map(s => s.category)
            .filter((c): c is string => !!c)
    )].sort();

    // Apply filters (use servicesWithExperts to have expert names available)
    let filteredServices = servicesWithExperts;

    // Search filter (title or expert name)
    if (searchQuery) {
        const lowerSearch = searchQuery.toLowerCase();
        filteredServices = filteredServices.filter((service: any) => {
            const title = (service.title || '').toLowerCase();
            const expertName = (service.experts?.profiles?.full_name || '').toLowerCase();
            return title.includes(lowerSearch) || expertName.includes(lowerSearch);
        });
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'draft') {
            filteredServices = filteredServices.filter((s: any) => !s.status || s.status === 'draft');
        } else {
            filteredServices = filteredServices.filter((s: any) => s.status === statusFilter);
        }
    }

    // Category filter
    if (categoryFilter && categoryFilter !== 'all') {
        filteredServices = filteredServices.filter((s: any) => s.category === categoryFilter);
    }

    // Type filter
    if (typeFilter && typeFilter !== 'all') {
        filteredServices = filteredServices.filter((s: any) => s.type === typeFilter);
    }

    // Pagination
    const totalCount = filteredServices.length;
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    const paginatedServices = filteredServices.slice(offset, offset + ITEMS_PER_PAGE);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Catálogo de Servicios</h1>
            </div>

            {allError && (
                <div style={{ marginBottom: '2rem' }}>
                    <Alert
                        type="error"
                        title="Error al cargar servicios"
                        message="No se pudieron cargar los servicios. Por favor, intenta recargar la página."
                    />
                </div>
            )}

            <Tabs defaultValue={currentTab}>
                <TabsList>
                    <TabsTrigger value="expert">Servicios de Expertos</TabsTrigger>
                    <TabsTrigger value="platform">Servicios de Plataforma</TabsTrigger>
                </TabsList>

                <TabsContent value="expert">
                    {/* Dashboard with KPIs */}
                    <ServicesDashboard />

                    {/* Search and Filters */}
                    <SearchFilters categories={categories} />

                    {/* Services Table */}
                    <ServicesClient services={paginatedServices} />

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            basePath="/admin/services"
                        />
                    )}

                    <div style={{ textAlign: 'center', color: 'rgb(var(--text-muted))', fontSize: '0.875rem', marginTop: '1rem' }}>
                        Mostrando {paginatedServices.length > 0 ? offset + 1 : 0} - {offset + paginatedServices.length} de {totalCount} servicios
                    </div>
                </TabsContent>

                <TabsContent value="platform">
                    <AdminServicesClient />
                </TabsContent>
            </Tabs>
        </div>
    );
}
