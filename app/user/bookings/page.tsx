import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/Button/Button';
import { Calendar, Video, MapPin, XCircle, CheckCircle, Clock } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { BookingActions } from '@/components/user/BookingActions';
import { LocalTime } from '@/components/user/LocalTime';

const getStatusColor = (status: string) => {
    switch (status) {
        case 'confirmed': return { bg: 'rgba(var(--success), 0.1)', text: 'rgb(var(--success))', label: 'Confirmada', icon: CheckCircle };
        case 'pending': return { bg: 'rgba(var(--warning), 0.1)', text: 'rgb(var(--warning))', label: 'Pendiente', icon: Clock };
        case 'completed': return { bg: 'rgba(var(--primary), 0.1)', text: 'rgb(var(--primary))', label: 'Completada', icon: CheckCircle };
        case 'cancelled': return { bg: 'rgba(var(--error), 0.1)', text: 'rgb(var(--error))', label: 'Cancelada', icon: XCircle };
        default: return { bg: 'rgb(var(--surface-hover))', text: 'rgb(var(--text-secondary))', label: status, icon: Clock };
    }
};

// Format date to readable format: "Lun 10 Feb 2026"
const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${dayNames[date.getDay()]} ${day} ${monthNames[month - 1]} ${year}`;
};

export default async function UserBookingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
    const { tab = 'scheduled' } = await searchParams;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // 1. Fetch bookings without JOINs (RLS compatible)
    const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching bookings:", error);
        return (
            <div style={{ padding: '2rem', color: 'rgb(var(--error))', background: 'rgba(var(--error), 0.1)', borderRadius: '8px' }}>
                Error cargando reservas: {error.message}
            </div>
        );
    }

    const bookingsList = bookingsData || [];

    // 2. Get unique service and expert IDs
    const serviceIds = [...new Set(bookingsList.map(b => b.service_id).filter(Boolean))];
    const expertIds = [...new Set(bookingsList.map(b => b.expert_id).filter(Boolean))];
    const bookingIds = bookingsList.map(b => b.id);

    // 3. Fetch related data separately
    let servicesMap: Record<string, { title?: string; type?: string; duration?: number }> = {};
    let expertsMap: Record<string, { title?: string; full_name?: string; avatar_url?: string; timezone?: string }> = {};
    let disputesMap: Record<string, { id: string; status: string }> = {};

    if (serviceIds.length > 0) {
        const { data: services } = await supabase
            .from('services')
            .select('id, title, type, duration')
            .in('id', serviceIds);
        (services || []).forEach((s: any) => {
            servicesMap[s.id] = { title: s.title, type: s.type, duration: s.duration };
        });
    }

    if (expertIds.length > 0) {
        // Fetch expert titles and timezone
        const { data: experts } = await supabase
            .from('experts')
            .select('id, title, timezone')
            .in('id', expertIds);
        (experts || []).forEach((e: any) => {
            expertsMap[e.id] = { title: e.title, timezone: e.timezone };
        });

        // Fetch profiles for full_name and avatar
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', expertIds);
        (profiles || []).forEach((p: any) => {
            if (expertsMap[p.id]) {
                expertsMap[p.id].full_name = p.full_name;
                expertsMap[p.id].avatar_url = p.avatar_url;
            } else {
                expertsMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
            }
        });
    }

    if (bookingIds.length > 0) {
        const { data: disputes } = await supabase
            .from('disputes')
            .select('id, status, booking_id')
            .in('booking_id', bookingIds);
        (disputes || []).forEach((d: any) => {
            disputesMap[d.booking_id] = { id: d.id, status: d.status };
        });
    }

    // 4. Enrich bookings with related data
    const bookings = bookingsList.map(b => ({
        ...b,
        service: servicesMap[b.service_id] || null,
        expert: expertsMap[b.expert_id] ? {
            id: b.expert_id,
            title: expertsMap[b.expert_id].title,
            timezone: expertsMap[b.expert_id].timezone,
            profile: {
                full_name: expertsMap[b.expert_id].full_name,
                avatar_url: expertsMap[b.expert_id].avatar_url
            }
        } : null,
        dispute: disputesMap[b.id] || null
    }));

    // 5. Filter by tab
    const scheduled = bookings.filter(b => (b.status === 'confirmed' || b.status === 'pending'));
    const finalized = bookings.filter(b => b.status === 'completed');
    const cancelled = bookings.filter(b => b.status === 'cancelled');

    // Get current tab's bookings
    const currentBookings = tab === 'finalized' ? finalized : tab === 'cancelled' ? cancelled : scheduled;

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Mis Reservas</h1>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link href={`?tab=scheduled`}>
                        <Button variant={tab === 'scheduled' ? 'primary' : 'outline'} size="sm">
                            Programadas {scheduled.length > 0 && `(${scheduled.length})`}
                        </Button>
                    </Link>
                    <Link href={`?tab=finalized`}>
                        <Button variant={tab === 'finalized' ? 'primary' : 'outline'} size="sm">
                            Finalizadas {finalized.length > 0 && `(${finalized.length})`}
                        </Button>
                    </Link>
                    <Link href={`?tab=cancelled`}>
                        <Button variant={tab === 'cancelled' ? 'primary' : 'outline'} size="sm">
                            Canceladas {cancelled.length > 0 && `(${cancelled.length})`}
                        </Button>
                    </Link>
                </div>
            </div>

            {currentBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1rem' }}>
                        {tab === 'finalized' ? 'No tienes reservas finalizadas.' :
                         tab === 'cancelled' ? 'No tienes reservas canceladas.' :
                         'No tienes reservas activas.'}
                    </p>
                    <Link href="/">
                        <Button>Explorar Servicios</Button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {currentBookings.map(booking => {
                        const statusInfo = getStatusColor(booking.status || 'pending');
                        const StatusIcon = statusInfo.icon;

                        // Safely access nested data
                        const serviceTitle = booking.service?.title || 'Servicio Desconocido';
                        const serviceType = booking.service?.type || 'Virtual';
                        const expertName = booking.expert?.profile?.full_name || 'Experto';
                        const expertRole = booking.expert?.profile?.title || booking.expert?.title || 'Consultor';
                        const expertAvatar = booking.expert?.profile?.avatar_url || 'https://i.pravatar.cc/150?u=expert';

                        const dispute = Array.isArray(booking.dispute) ? booking.dispute[0] : booking.dispute;

                        return (
                            <div key={booking.id} className="card-hover booking-card" style={{
                                background: 'rgb(var(--surface))',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgb(var(--border))',
                                transition: 'var(--transition-all)'
                            }}>
                                <div className="booking-card-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Top: Info */}
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <Image
                                            src={expertAvatar}
                                            alt={expertName}
                                            width={64}
                                            height={64}
                                            style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid rgb(var(--surface-hover))', flexShrink: 0 }}
                                        />
                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{serviceTitle}</h3>
                                                <span style={{
                                                    background: statusInfo.bg, color: statusInfo.text,
                                                    padding: '0.2rem 0.6rem', borderRadius: '1rem',
                                                    fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem'
                                                }}>
                                                    <StatusIcon size={12} /> {statusInfo.label}
                                                </span>
                                            </div>
                                            <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                                con <span style={{ color: 'rgb(var(--text-main))', fontWeight: 500 }}>{expertName}</span> ({expertRole})
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.85rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    <Calendar size={14} /> {formatDate(booking.date)}
                                                </span>
                                                <LocalTime
                                                    date={booking.date}
                                                    time={booking.time}
                                                    expertTimezone={booking.expert?.timezone}
                                                />
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                    {serviceType === 'Virtual' ? <Video size={14} /> : <MapPin size={14} />}
                                                    {serviceType}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom: Actions */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem',
                                        paddingTop: '1rem',
                                        borderTop: '1px solid rgb(var(--border))'
                                    }}>
                                        <BookingActions
                                            bookingId={booking.id}
                                            status={booking.status}
                                            meetingUrl={booking.meeting_url}
                                            userName={user.email}
                                            date={booking.date}
                                            time={booking.time}
                                            duration={booking.service?.duration}
                                            dispute={dispute}
                                            startAt={booking.start_at}
                                            expertTimezone={(booking as any).expert_timezone || null}
                                            userTimezone={(booking as any).user_timezone || null}
                                        />
                                        {booking.status !== 'cancelled' && (
                                            <div>
                                                <Link href={`/api/bookings/${booking.id}/ics`} target="_blank">
                                                    <Button variant="outline" size="sm" fullWidth>Descargar .ics</Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
