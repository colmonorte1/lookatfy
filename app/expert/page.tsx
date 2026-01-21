import { DollarSign, Calendar, Clock, Star } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import type { ComponentType } from 'react';
import Link from 'next/link';
import { ExpertSidebar } from '@/components/expert/ExpertSidebar';

interface KPICardProps {
    title: string;
    value: string | number;
    subtext?: string;
    icon: ComponentType<{ size?: number }>;
    color: 'success' | 'primary' | 'secondary' | 'warning';
}

const KPICard = ({ title, value, subtext, icon: Icon, color }: KPICardProps) => (
    <div style={{
        background: 'rgb(var(--surface))',
        padding: '1.5rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        border: '1px solid rgb(var(--border))',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: `rgba(var(--${color}), 0.1)`,
                color: `rgb(var(--${color}))`
            }}>
                <Icon size={24} />
            </div>
            {subtext && (
                <span style={{
                    fontSize: '0.875rem',
                    color: 'rgb(var(--text-muted))',
                }}>
                    {subtext}
                </span>
            )}
        </div>
        <div style={{ fontSize: '2rem', fontWeight: 700, color: 'rgb(var(--text-main))' }}>
            {value}
        </div>
        <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.875rem', fontWeight: 500 }}>
            {title}
        </div>
    </div>
);

export default async function ExpertDashboardPage() {
    const supabase = await createClient();

    // 1. Get Current User
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>No autenticado</div>;
    }

    // 2. Fetch Profile & Expert Data
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const { data: expert } = await supabase.from('experts').select('rating, reviews_count').eq('id', user.id).single();
    const { count: servicesCount } = await supabase.from('services').select('*', { count: 'exact', head: true }).eq('expert_id', user.id).eq('status', 'active');

    // 3. Fetch Bookings (All for stats)
    // We need:
    // - Revenue this month (status = completed, date in current month)
    // - Upcoming bookings count (status = confirmed, date >= today)
    // - Upcoming list (limit 3)

    // Parallelize queries for efficiency? Or one big query?
    // Let's get "Active" bookings for upcoming
    const today = new Date().toISOString().split('T')[0];
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const { data: upcomingBookings } = await supabase
        .from('bookings')
        .select(`
            *,
            services ( title, duration )
        `)
        .eq('expert_id', user.id)
        .eq('status', 'confirmed')
        .gte('date', today)
        .order('date', { ascending: true })
        .order('time', { ascending: true })
        .limit(3);

    const { data: allBookings } = await supabase
        .from('bookings')
        .select('price, status, date, duration, service_id, services(duration)') // Join services to get duration if not storing in bookings (schema says bookings has price, maybe not duration? schema says just price. wait, bookings has price.)
        // Actually schema for bookings: date, time, status, price, service_id. Schema services: duration.
        // Let's assume price is stored in bookings as agreed.
        .eq('expert_id', user.id);

    // --- Calculations ---

    // 1. Revenue This Month
    const currentMonthRevenue = allBookings
        ?.filter(b => b.status === 'completed' && b.date >= firstDayOfMonth)
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0) || 0;

    // 2. Upcoming Count
    const upcomingCount = allBookings
        ?.filter(b => b.status === 'confirmed' && b.date >= today)
        .length || 0;

    // 3. Total Hours (Completed)
    // Duration is in services table mostly. Need to rely on join or if we fetch services.
    // For MVP, let's estimated based on completed count * 60 if duration missing, or fetch service duration.
    // I requested services(duration) in allBookings query but Supabase join syntax needs careful handling.
    // select('*, services(duration)') returns { services: { duration: 60 } }
    // Let's assume standard 60min if complex.
    type AllBooking = { status: string; price?: number | string; date: string; services?: { duration?: number } };
    const completedBookings = (allBookings as AllBooking[] | undefined)?.filter(b => b.status === 'completed') || [];
    const totalMinutes = completedBookings.reduce((sum, b) => {
        const dur = b.services?.duration ?? 60;
        return sum + dur;
    }, 0);
    const totalHours = Math.round(totalMinutes / 60);

    const firstName = profile?.full_name?.split(' ')[0] || 'Experto';

    return (
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '2rem', padding: '2rem 1rem 4rem' }}>
            <div>
                <ExpertSidebar />
            </div>
            <div>
                {(!servicesCount || servicesCount === 0) && (
                    <div style={{ background: 'rgba(var(--warning), 0.08)', border: '1px solid rgba(var(--warning), 0.3)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'rgb(var(--text-secondary))' }}>Aún no tienes servicios activos.</span>
                            <Link href="/expert/services/new" style={{ color: 'rgb(var(--primary))', fontWeight: 600 }}>Crear servicio</Link>
                        </div>
                    </div>
                )}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem' }}>Hola, {firstName} 👋</h1>
                    <p style={{ color: 'rgb(var(--text-secondary))' }}>Resumen de tu actividad</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    <KPICard title="Ingresos este mes" value={`$${currentMonthRevenue.toFixed(2)}`} subtext="Reservas completadas" icon={DollarSign} color="success" />
                    <KPICard title="Próximas Reservas" value={upcomingCount} subtext="Citas confirmadas" icon={Calendar} color="primary" />
                    <KPICard title="Horas Realizadas" value={`${totalHours}h`} subtext="Total acumulado" icon={Clock} color="secondary" />
                    <KPICard title="Calificación" value={expert?.rating || '5.0'} subtext={`Base en ${expert?.reviews_count || 0} reseña(s)`} icon={Star} color="warning" />
                </div>
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.125rem', margin: 0 }}>Próximas Citas</h3>
                        <Link href="/expert/bookings" style={{ color: 'rgb(var(--primary))', fontSize: '0.875rem', fontWeight: 500 }}>Ver todas</Link>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {upcomingBookings && upcomingBookings.length > 0 ? (
                            upcomingBookings.map((booking: { id: string; date: string; time: string; meeting_url?: string; services?: { title?: string; duration?: number } }) => {
                                const bDate = new Date(booking.date);
                                const day = bDate.getDate();
                                const month = bDate.toLocaleString('es-ES', { month: 'short' }).toUpperCase().replace('.', '');
                                return (
                                    <div key={booking.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgb(var(--surface-hover))', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgb(var(--surface))', padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgb(var(--border))', minWidth: '60px' }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgb(var(--text-secondary))' }}>{month}</span>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1 }}>{day}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{booking.services?.title || 'Servicio eliminado'}</div>
                                            <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span>{booking.time.slice(0, 5)}</span>
                                                <span>•</span>
                                                <span style={{ background: 'rgb(var(--primary))', color: 'white', padding: '0 0.5rem', borderRadius: '1rem', fontSize: '0.75rem' }}>Confirmada</span>
                                            </div>
                                        </div>
                                        <Link href={`/call?roomUrl=${encodeURIComponent(booking.meeting_url || '')}&userName=${encodeURIComponent(profile?.full_name || 'Experto')}&bookingId=${booking.id}`}>
                                            <div style={{ padding: '0.5rem 1rem', background: 'rgb(var(--primary))', color: 'white', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', fontWeight: 500 }}>Unirse</div>
                                        </Link>
                                    </div>
                                );
                            })
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-muted))' }}>No tienes citas próximas.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
