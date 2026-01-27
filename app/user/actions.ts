'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    // Verify ownership
    const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
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

    revalidatePath('/user/bookings');
    return { success: true };
}
