import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import CallClient from './CallClient';

interface CallPageProps {
    searchParams: Promise<{
        roomUrl?: string;
        userName?: string;
        bookingId?: string;
    }>;
}

export default async function CallPage({ searchParams }: CallPageProps) {
    const { roomUrl = '', userName = '', bookingId = '' } = await searchParams;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // El middleware ya protege /call, pero validamos igual por seguridad
    if (!user) {
        redirect(`/login?redirect=/call${bookingId ? `?bookingId=${bookingId}` : ''}`);
    }

    // Si se proporciona un bookingId, validar que el usuario tiene acceso a ese booking
    if (bookingId) {
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('id, user_id, expert_id, status, meeting_url')
            .eq('id', bookingId)
            .single();

        if (error || !booking) {
            redirect('/user/bookings');
        }

        // Solo el cliente o el experto de la reserva pueden entrar
        const isAuthorized = booking.user_id === user.id || booking.expert_id === user.id;
        if (!isAuthorized) {
            redirect('/user/bookings');
        }

        // El booking debe estar confirmado para poder unirse
        if (booking.status !== 'confirmed') {
            redirect('/user/bookings');
        }

        // Usar la meeting_url validada del booking, no la del query param
        const validatedRoomUrl = booking.meeting_url || roomUrl;

        return (
            <CallClient
                initialRoomUrl={validatedRoomUrl}
                initialUserName={userName}
                bookingId={bookingId}
            />
        );
    }

    // Sin bookingId no se puede acceder a la sala
    redirect('/user/bookings');
}
