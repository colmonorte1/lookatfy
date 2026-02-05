import { createClient } from '@/utils/supabase/server';
import StatsCard from '@/components/ui/StatsCard/StatsCard';
import BarChart, { BarChartData } from '@/components/ui/BarChart/BarChart';
import { Package, CheckCircle, Clock, DollarSign, Star, Monitor, MapPin } from 'lucide-react';

interface ServiceStats {
    totalServices: number;
    activeServices: number;
    pendingServices: number;
    draftServices: number;
    averagePrice: number;
    virtualServices: number;
    presentialServices: number;
    averageRating: number;
    topCategories: { category: string; count: number }[];
    recentGrowth: number;
}

async function getServiceStats(): Promise<ServiceStats> {
    const supabase = await createClient();

    // Fetch all services - handle case where deleted_at might not exist
    let services: any[] = [];
    const { data: servicesWithDelete, error: deleteError } = await supabase
        .from('services')
        .select('id, status, price, type, category, rating_avg, created_at')
        .is('deleted_at', null);

    if (deleteError && deleteError.message?.includes('deleted_at')) {
        // Column doesn't exist, fetch without filter
        const { data } = await supabase
            .from('services')
            .select('id, status, price, type, category, rating_avg, created_at');
        services = data || [];
    } else {
        services = servicesWithDelete || [];
    }
    const totalServices = services.length;

    // Count by status
    const activeServices = services.filter(s => s.status === 'active').length;
    const pendingServices = services.filter(s => s.status === 'review').length;
    const draftServices = services.filter(s => !s.status || s.status === 'draft').length;

    // Count by type
    const virtualServices = services.filter(s => s.type === 'Virtual').length;
    const presentialServices = services.filter(s => s.type === 'Presencial').length;

    // Calculate average price
    const totalPrice = services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
    const averagePrice = totalServices > 0 ? totalPrice / totalServices : 0;

    // Calculate average rating
    const servicesWithRating = services.filter(s => s.rating_avg != null);
    const totalRating = servicesWithRating.reduce((sum, s) => sum + (Number(s.rating_avg) || 0), 0);
    const averageRating = servicesWithRating.length > 0 ? totalRating / servicesWithRating.length : 0;

    // Top categories
    const categoryCount: Record<string, number> = {};
    services.forEach(s => {
        const cat = s.category || 'Sin categoría';
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });
    const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Calculate growth (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentServices = services.filter(s => {
        const createdAt = new Date(s.created_at);
        return createdAt >= thirtyDaysAgo;
    }).length;

    const previousServices = services.filter(s => {
        const createdAt = new Date(s.created_at);
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    const recentGrowth = previousServices > 0
        ? ((recentServices - previousServices) / previousServices) * 100
        : recentServices > 0 ? 100 : 0;

    return {
        totalServices,
        activeServices,
        pendingServices,
        draftServices,
        averagePrice,
        virtualServices,
        presentialServices,
        averageRating,
        topCategories,
        recentGrowth
    };
}

export default async function ServicesDashboard() {
    const stats = await getServiceStats();

    // Prepare chart data for status distribution
    const statusChartData: BarChartData[] = [
        {
            label: 'Activos',
            value: stats.activeServices,
            color: 'rgb(var(--success))'
        },
        {
            label: 'En Revisión',
            value: stats.pendingServices,
            color: 'rgb(var(--warning))'
        },
        {
            label: 'Borrador',
            value: stats.draftServices,
            color: 'rgb(var(--text-muted))'
        }
    ];

    // Prepare chart data for type distribution
    const typeChartData: BarChartData[] = [
        {
            label: 'Virtual',
            value: stats.virtualServices,
            color: 'rgb(var(--primary))'
        },
        {
            label: 'Presencial',
            value: stats.presentialServices,
            color: 'rgb(var(--secondary))'
        }
    ];

    // Prepare chart data for categories
    const categoryChartData: BarChartData[] = stats.topCategories.map((cat, index) => ({
        label: cat.category.length > 12 ? cat.category.substring(0, 12) + '...' : cat.category,
        value: cat.count,
        color: index === 0 ? 'rgb(var(--primary))' :
               index === 1 ? 'rgb(var(--secondary))' :
               index === 2 ? 'rgb(var(--success))' :
               index === 3 ? 'rgb(var(--warning))' : 'rgb(var(--text-muted))'
    }));

    // Format money
    const formatMoney = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div style={{ marginBottom: '2rem' }}>
            {/* Stats Cards Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <StatsCard
                    title="Total Servicios"
                    value={stats.totalServices}
                    icon={Package}
                    color="primary"
                    trend={{
                        value: Math.round(stats.recentGrowth),
                        isPositive: stats.recentGrowth >= 0
                    }}
                />
                <StatsCard
                    title="Servicios Activos"
                    value={stats.activeServices}
                    icon={CheckCircle}
                    color="success"
                    subtitle={`${stats.totalServices > 0 ? ((stats.activeServices / stats.totalServices) * 100).toFixed(0) : 0}% del total`}
                />
                <StatsCard
                    title="En Revisión"
                    value={stats.pendingServices}
                    icon={Clock}
                    color="warning"
                    subtitle={stats.pendingServices > 0 ? 'Requieren aprobación' : 'Ninguno pendiente'}
                />
                <StatsCard
                    title="Precio Promedio"
                    value={formatMoney(stats.averagePrice)}
                    icon={DollarSign}
                    color="success"
                    subtitle="Por servicio"
                />
                <StatsCard
                    title="Rating Promedio"
                    value={stats.averageRating.toFixed(1)}
                    icon={Star}
                    color="warning"
                    subtitle="De servicios calificados"
                />
                <StatsCard
                    title="Virtuales"
                    value={stats.virtualServices}
                    icon={Monitor}
                    color="primary"
                    subtitle={`${stats.totalServices > 0 ? ((stats.virtualServices / stats.totalServices) * 100).toFixed(0) : 0}% del total`}
                />
            </div>

            {/* Charts Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
            }}>
                <BarChart
                    title="Por Estado"
                    data={statusChartData}
                    height={180}
                />
                <BarChart
                    title="Por Modalidad"
                    data={typeChartData}
                    height={180}
                />
                {categoryChartData.length > 0 && (
                    <BarChart
                        title="Top Categorías"
                        data={categoryChartData}
                        height={180}
                    />
                )}
            </div>
        </div>
    );
}
