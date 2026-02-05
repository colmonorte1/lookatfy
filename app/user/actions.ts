'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email/brevo';
import { bookingCancelledTemplate } from '@/lib/email/templates';

export async function cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify ownership
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*, service:services!service_id(title), expert:profiles!expert_id(email, full_name), user_profile:profiles!user_id(full_name)')
        .eq('id', bookingId)
        .eq('user_id', user.id)
        .single();

    if (fetchError || !booking) {
        return { success: false, error: 'Booking not found or access denied' };
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
        return { success: false, error: 'Cannot cancel an already completed or cancelled booking' };
    }

    const { error } = await supabase
        .from('bookings')
        .update({
            status: 'cancelled',
            cancellation_reason: reason
        })
        .eq('id', bookingId);

    if (error) {
        return { success: false, error: error.message };
    }

    // Notify expert about cancellation via email
    try {
        const expertData = Array.isArray(booking.expert) ? booking.expert[0] : booking.expert;
        const userData = Array.isArray(booking.user_profile) ? booking.user_profile[0] : booking.user_profile;
        const serviceData = Array.isArray(booking.service) ? booking.service[0] : booking.service;
        if (expertData?.email) {
            const whenStr = `${booking.date} ${booking.time || ''}`.trim();
            const html = bookingCancelledTemplate({
                recipientName: expertData.full_name || 'Experto',
                otherPartyName: userData?.full_name || 'Cliente',
                serviceTitle: serviceData?.title,
                whenStr,
                timezone: booking.expert_timezone || 'UTC',
                reason,
                role: 'expert',
            });
            await sendEmail({ to: expertData.email, subject: 'Reserva cancelada', html });
        }
    } catch (e) {
        console.error('Error sending cancellation email:', e);
    }

    revalidatePath('/user/bookings');
    return { success: true };
}
