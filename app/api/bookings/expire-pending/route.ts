import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * API endpoint to automatically cancel expired pending bookings
 * Should be called periodically (e.g., every 5 minutes via cron job)
 *
 * Cancels bookings that:
 * - Have status 'pending'
 * - Have expires_at timestamp in the past
 */
export async function POST() {
    try {
        const supabase = await createClient();

        // Find all pending bookings that have expired
        const now = new Date().toISOString();

        const { data: expiredBookings, error: fetchError } = await supabase
            .from('bookings')
            .select('id, user_id, expert_id, date, time, expires_at')
            .eq('status', 'pending')
            .lt('expires_at', now);

        if (fetchError) {
            console.error('Error fetching expired bookings:', fetchError);
            return NextResponse.json(
                { error: 'Error fetching expired bookings' },
                { status: 500 }
            );
        }

        if (!expiredBookings || expiredBookings.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No expired bookings found',
                cancelled: 0
            });
        }

        console.log(`Found ${expiredBookings.length} expired bookings to cancel`);

        // Cancel all expired bookings
        const bookingIds = expiredBookings.map(b => b.id);

        const { error: updateError } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .in('id', bookingIds);

        if (updateError) {
            console.error('Error cancelling expired bookings:', updateError);
            return NextResponse.json(
                { error: 'Error cancelling expired bookings' },
                { status: 500 }
            );
        }

        // Create notifications for affected users
        const notifications = expiredBookings.flatMap(booking => [
            {
                user_id: booking.user_id,
                title: '❌ Reserva cancelada',
                message: `Tu reserva para el ${booking.date} a las ${booking.time} fue cancelada porque el pago no se confirmó a tiempo.`,
                type: 'booking',
                read: false
            },
            {
                user_id: booking.expert_id,
                title: 'Reserva cancelada',
                message: `Una reserva pendiente para el ${booking.date} a las ${booking.time} fue cancelada por falta de confirmación de pago.`,
                type: 'booking',
                read: false
            }
        ]);

        const { error: notificationError } = await supabase
            .from('notifications')
            .insert(notifications);

        if (notificationError) {
            console.error('Error creating notifications:', notificationError);
            // Don't fail if notifications fail
        }

        console.log(`Successfully cancelled ${expiredBookings.length} expired bookings`);

        return NextResponse.json({
            success: true,
            message: `Cancelled ${expiredBookings.length} expired bookings`,
            cancelled: expiredBookings.length,
            bookingIds: bookingIds
        });

    } catch (error) {
        console.error('Error in expire-pending bookings:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Allow GET requests for testing (remove in production)
export async function GET() {
    return POST();
}
