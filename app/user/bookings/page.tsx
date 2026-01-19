import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Calendar, Video, Clock, MapPin, XCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { BookingActions } from '@/components/user/BookingActions';

const getStatusColor = (status: string) => {
    switch (status) {
        case 'confirmed': return { bg: 'rgba(var(--success), 0.1)', text: 'rgb(var(--success))', label: 'Confirmada', icon: CheckCircle };
        case 'pending': return { bg: 'rgba(var(--warning), 0.1)', text: 'rgb(var(--warning))', label: 'Pendiente', icon: Clock };
        case 'completed': return { bg: 'rgba(var(--primary), 0.1)', text: 'rgb(var(--primary))', label: 'Completada', icon: CheckCircle };
        case 'cancelled': return { bg: 'rgba(var(--error), 0.1)', text: 'rgb(var(--error))', label: 'Cancelada', icon: XCircle };
        default: return { bg: 'rgb(var(--surface-hover))', text: 'rgb(var(--text-secondary))', label: status, icon: Clock };
    }
};

export default async function UserBookingsPage() {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Fetch bookings with relations
    // Schema: bookings -> expert:experts -> profile:profiles
    // bookings -> service:services

    const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select(`
            *,
            service:services!service_id ( title, type ),
            expert:experts!expert_id (
                id,
                title,
                profile:profiles ( full_name, avatar_url )
            ),
            dispute:disputes(id, status)
        `)
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

    const bookings = bookingsData || [];

    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Mis Reservas</h1>
                <Button variant="outline" size="sm">Descargar Historial</Button>
            </div>

            {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1rem' }}>No tienes reservas activas.</p>
                    <Link href="/">
                        <Button>Explorar Servicios</Button>
                    </Link>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {bookings.map(booking => {
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
                            <div key={booking.id} className="card-hover" style={{
                                background: 'rgb(var(--surface))',
                                padding: '1.5rem',
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid rgb(var(--border))',
                                display: 'grid',
                                gridTemplateColumns: 'minmax(300px, 2fr) 1fr',
                                gap: '2rem',
                                transition: 'var(--transition-all)'
                            }}>
                                {/* Left: Info */}
                                <div style={{ display: 'flex', gap: '1.5rem' }}>
                                    <img
                                        src={expertAvatar}
                                        alt={expertName}
                                        style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgb(var(--surface-hover))' }}
                                    />
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
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

                                        <div style={{ display: 'flex', gap: '1.5rem', color: 'rgb(var(--text-secondary))', fontSize: '0.85rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Calendar size={14} /> {booking.date}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                <Clock size={14} /> {booking.time}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {serviceType === 'Virtual' ? <Video size={14} /> : <MapPin size={14} />}
                                                {serviceType}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem', borderLeft: '1px solid rgb(var(--border))', paddingLeft: '2rem' }}>
                                    <BookingActions
                                        bookingId={booking.id}
                                        status={booking.status}
                                        meetingUrl={booking.meeting_url}
                                        userName={user.email}
                                        date={booking.date}
                                        time={booking.time}
                                        dispute={dispute}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
