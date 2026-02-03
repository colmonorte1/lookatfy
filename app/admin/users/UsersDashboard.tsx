import { createClient } from '@/utils/supabase/server';
import StatsCard from '@/components/ui/StatsCard/StatsCard';
import BarChart, { BarChartData } from '@/components/ui/BarChart/BarChart';
import { Users, UserCheck, Ban, UserX, TrendingUp } from 'lucide-react';

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    deletedUsers: number;
    usersByRole: { role: string; count: number }[];
    usersByStatus: { status: string; count: number }[];
    recentGrowth: number;
}

async function getUserStats(): Promise<UserStats> {
    const supabase = await createClient();

    // Fetch all users (including deleted for admin dashboard)
    const { data: allUsers } = await supabase
        .from('profiles')
        .select('role, status, created_at, deleted_at')
        .neq('role', 'expert');

    const users = allUsers || [];

    // Calculate total users (excluding deleted)
    const activeProfiles = users.filter(u => !u.deleted_at);
    const totalUsers = activeProfiles.length;

    // Count by status
    const activeUsers = users.filter(u => u.status === 'active' && !u.deleted_at).length;
    const suspendedUsers = users.filter(u => u.status === 'suspended' && !u.deleted_at).length;
    const deletedUsers = users.filter(u => u.deleted_at).length;

    // Group by role
    const roleGroups = activeProfiles.reduce((acc, user) => {
        const role = user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const usersByRole = Object.entries(roleGroups).map(([role, count]) => ({
        role,
        count
    }));

    // Group by status
    const statusGroups = activeProfiles.reduce((acc, user) => {
        const status = user.status || 'active';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const usersByStatus = Object.entries(statusGroups).map(([status, count]) => ({
        status,
        count
    }));

    // Calculate growth (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentUsers = users.filter(u => {
        const createdAt = new Date(u.created_at);
        return createdAt >= thirtyDaysAgo;
    }).length;

    const previousUsers = users.filter(u => {
        const createdAt = new Date(u.created_at);
        return createdAt >= sixtyDaysAgo && createdAt < thirtyDaysAgo;
    }).length;

    const recentGrowth = previousUsers > 0
        ? ((recentUsers - previousUsers) / previousUsers) * 100
        : recentUsers > 0 ? 100 : 0;

    return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        deletedUsers,
        usersByRole,
        usersByStatus,
        recentGrowth
    };
}

export default async function UsersDashboard() {
    const stats = await getUserStats();

    // Prepare chart data
    const roleChartData: BarChartData[] = stats.usersByRole.map(item => ({
        label: item.role === 'client' ? 'Clientes' : item.role === 'admin' ? 'Administradores' : item.role,
        value: item.count,
        color: item.role === 'admin' ? 'rgb(var(--primary))' : 'rgb(var(--info))'
    }));

    const statusChartData: BarChartData[] = stats.usersByStatus.map(item => {
        const colorMap: Record<string, string> = {
            active: 'rgb(var(--success))',
            suspended: 'rgb(var(--warning))',
            inactive: 'rgb(var(--text-muted))',
            deleted: 'rgb(var(--danger))'
        };

        const labelMap: Record<string, string> = {
            active: 'Activos',
            suspended: 'Suspendidos',
            inactive: 'Inactivos',
            deleted: 'Eliminados'
        };

        return {
            label: labelMap[item.status] || item.status,
            value: item.count,
            color: colorMap[item.status] || 'rgb(var(--text-muted))'
        };
    });

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
                    title="Total Usuarios"
                    value={stats.totalUsers}
                    icon={Users}
                    color="primary"
                    trend={{
                        value: Math.round(stats.recentGrowth),
                        isPositive: stats.recentGrowth >= 0
                    }}
                />
                <StatsCard
                    title="Usuarios Activos"
                    value={stats.activeUsers}
                    icon={UserCheck}
                    color="success"
                    subtitle={`${stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(0) : 0}% del total`}
                />
                <StatsCard
                    title="Suspendidos"
                    value={stats.suspendedUsers}
                    icon={Ban}
                    color="warning"
                    subtitle={stats.suspendedUsers > 0 ? 'Requieren atención' : 'Ninguno'}
                />
                <StatsCard
                    title="Eliminados"
                    value={stats.deletedUsers}
                    icon={UserX}
                    color="danger"
                    subtitle="Soft delete"
                />
            </div>

            {/* Charts Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                <BarChart
                    title="Distribución por Rol"
                    data={roleChartData}
                    height={200}
                />
                <BarChart
                    title="Distribución por Estado"
                    data={statusChartData}
                    height={200}
                />
            </div>
        </div>
    );
}
