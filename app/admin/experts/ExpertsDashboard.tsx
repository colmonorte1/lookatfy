import { createClient } from '@/utils/supabase/server';
import StatsCard from '@/components/ui/StatsCard/StatsCard';
import BarChart, { BarChartData } from '@/components/ui/BarChart/BarChart';
import { Users, CheckCircle, XCircle, DollarSign, Star, TrendingUp } from 'lucide-react';

interface ExpertStats {
    totalExperts: number;
    verifiedExperts: number;
    pendingExperts: number;
    totalEarnings: number;
    averageRating: number;
    expertsWithServices: number;
    recentGrowth: number;
}

async function getExpertStats(): Promise<ExpertStats> {
    const supabase = await createClient();

    // Fetch all experts (excluding deleted) - handle case where deleted_at might not exist
    let experts: any[] = [];
    const { data: expertsWithDelete, error: deleteError } = await supabase
        .from('experts')
        .select('id, verified, created_at')
        .is('deleted_at', null);

    if (deleteError && deleteError.message?.includes('deleted_at')) {
        // Column doesn't exist, fetch without filter
        const { data } = await supabase
            .from('experts')
            .select('id, verified, created_at');
        experts = data || [];
    } else {
        experts = expertsWithDelete || [];
    }
    const totalExperts = experts.length;
    const verifiedExperts = experts.filter(e => e.verified).length;
    const pendingExperts = experts.filter(e => !e.verified).length;

    // Fetch bookings data for earnings calculation
    const { data: bookings } = await supabase
        .from('bookings')
        .select('price, currency, status, expert_id')
        .in('status', ['completed', 'confirmed']);

    const expertBookings = bookings || [];

    // Calculate total earnings (assuming primary currency is COP or USD)
    const totalEarnings = expertBookings.reduce((sum, booking) => {
        return sum + (Number(booking.price) || 0);
    }, 0);

    // Calculate average rating from services
    const { data: services } = await supabase
        .from('services')
        .select('expert_id, rating_avg, rating_count')
        .not('rating_avg', 'is', null);

    const servicesData = services || [];

    let totalRatings = 0;
    let totalRatingPoints = 0;
    servicesData.forEach(service => {
        const ratingAvg = Number(service.rating_avg) || 0;
        const ratingCount = Number(service.rating_count) || 0;
        totalRatings += ratingCount;
        totalRatingPoints += ratingAvg * ratingCount;
    });

    const averageRating = totalRatings > 0 ? totalRatingPoints / totalRatings : 0;

    // Count experts with at least one service - handle case where deleted_at might not exist
    let expertServicesData: any[] = [];
    const { data: servicesWithDelete, error: servicesDeleteError } = await supabase
        .from('services')
        .select('expert_id')
        .is('deleted_at', null);

    if (servicesDeleteError && servicesDeleteError.message?.includes('deleted_at')) {
        const { data } = await supabase
            .from('services')
            .select('expert_id');
        expertServicesData = data || [];
    } else {
        expertServicesData = servicesWithDelete || [];
    }

    const uniqueExpertsWithServices = new Set(expertServicesData.map(s => s.expert_id));
    const expertsWithServices = uniqueExpertsWithServices.size;

    // Calculate growth (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentExperts = experts.filter(e => {
        const createdAt = new Date(e.created_at);
        return createdAt >= thirtyDaysAgo;
    }).length;

    const previousExperts = experts.filter(e => {
        const createdAt = new Date(e.created_at);
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    const recentGrowth = previousExperts > 0
        ? ((recentExperts - previousExperts) / previousExperts) * 100
        : recentExperts > 0 ? 100 : 0;

    return {
        totalExperts,
        verifiedExperts,
        pendingExperts,
        totalEarnings,
        averageRating,
        expertsWithServices,
        recentGrowth
    };
}

export default async function ExpertsDashboard() {
    const stats = await getExpertStats();

    // Prepare chart data for verification status
    const verificationChartData: BarChartData[] = [
        {
            label: 'Verificados',
            value: stats.verifiedExperts,
            color: 'rgb(var(--success))'
        },
        {
            label: 'Pendientes',
            value: stats.pendingExperts,
            color: 'rgb(var(--warning))'
        }
    ];

    // Format earnings
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <StatsCard
                    title="Total Expertos"
                    value={stats.totalExperts}
                    icon={Users}
                    color="primary"
                    trend={{
                        value: Math.round(stats.recentGrowth),
                        isPositive: stats.recentGrowth >= 0
                    }}
                />
                <StatsCard
                    title="Expertos Verificados"
                    value={stats.verifiedExperts}
                    icon={CheckCircle}
                    color="success"
                    subtitle={`${stats.totalExperts > 0 ? ((stats.verifiedExperts / stats.totalExperts) * 100).toFixed(0) : 0}% del total`}
                />
                <StatsCard
                    title="Pendientes Verificación"
                    value={stats.pendingExperts}
                    icon={XCircle}
                    color="warning"
                    subtitle={stats.pendingExperts > 0 ? 'Requieren atención' : 'Ninguno pendiente'}
                />
                <StatsCard
                    title="Ingresos Generados"
                    value={formatMoney(stats.totalEarnings)}
                    icon={DollarSign}
                    color="success"
                    subtitle="Bookings completados"
                />
                <StatsCard
                    title="Calificación Promedio"
                    value={stats.averageRating.toFixed(1)}
                    icon={Star}
                    color="warning"
                    subtitle="De todos los servicios"
                />
                <StatsCard
                    title="Expertos con Servicios"
                    value={stats.expertsWithServices}
                    icon={TrendingUp}
                    color="info"
                    subtitle={`${stats.totalExperts > 0 ? ((stats.expertsWithServices / stats.totalExperts) * 100).toFixed(0) : 0}% activos`}
                />
            </div>

            {/* Charts Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                <BarChart
                    title="Distribución por Estado de Verificación"
                    data={verificationChartData}
                    height={200}
                />
            </div>
        </div>
    );
}
