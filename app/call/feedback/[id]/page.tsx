
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { FeedbackForm } from './FeedbackForm';

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params; // bookingId
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    // Fetch booking
    const { data: booking, error } = await supabase
        .from('bookings')
        .select('id, user_id, expert_id, status, date, time')
        .eq('id', id)
        .single();

    if (error || !booking) {
        console.error('[FeedbackPage] booking query error:', error);
        return <div>Reserva no encontrada</div>;
    }

    // Determine roles
    const isExpert = user.id === booking.expert_id;
    const isUser = user.id === booking.user_id;

    if (!isExpert && !isUser) {
        return <div>No tienes permiso para calificar esta sesión.</div>;
    }

    // Fetch profiles separately to avoid complex nested join issues
    const subjectId = isExpert ? booking.user_id : booking.expert_id;
    const { data: subjectProfile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', subjectId)
        .single();

    const subjectName = subjectProfile?.full_name;
    const subjectAvatar = subjectProfile?.avatar_url;
    const roleLabel = isExpert ? 'al Usuario' : 'al Experto';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgb(var(--background))',
            padding: '1rem'
        }}>
            <div style={{
                maxWidth: '500px',
                width: '100%',
                background: 'rgb(var(--surface))',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid rgb(var(--border))',
                textAlign: 'center'
            }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem' }}>Calificar Sesión</h1>

                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', margin: '0 auto 1rem auto',
                        borderRadius: '50%', overflow: 'hidden', background: 'rgb(var(--surface-hover))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 700
                    }}>
                        {subjectAvatar ? (
                            <img src={subjectAvatar} alt={subjectName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            (subjectName || '?').charAt(0).toUpperCase()
                        )}
                    </div>
                    <h2 style={{ fontSize: '1.25rem' }}>{subjectName}</h2>
                    <p style={{ color: 'rgb(var(--text-secondary))' }}>Califica tu experiencia con {roleLabel}</p>
                </div>

                <FeedbackForm bookingId={id} subjectId={subjectId} redirectPath={isExpert ? '/expert/bookings' : '/user/bookings'} />
            </div>
        </div>
    );
}
