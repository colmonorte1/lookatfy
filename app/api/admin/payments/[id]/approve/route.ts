import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logAdminAction } from '@/lib/audit';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'No autorizado' },
                { status: 401 }
            );
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return NextResponse.json(
                { error: 'No tienes permisos de administrador' },
                { status: 403 }
            );
        }

        // Get booking details
        const { data: booking, error: bookingError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', id)
            .single();

        if (bookingError) {
            console.error('Error fetching booking:', bookingError);
            return NextResponse.json(
                { error: `Pago no encontrado: ${bookingError.message}` },
                { status: 404 }
            );
        }

        if (!booking) {
            return NextResponse.json(
                { error: 'Pago no encontrado' },
                { status: 404 }
            );
        }

        // Create Daily.co room for the meeting if it doesn't exist
        let meeting_url = booking.meeting_url;

        if (!meeting_url) {
            try {
                const DAILY_API_KEY = process.env.DAILY_API_KEY;

                if (DAILY_API_KEY) {
                    const dailyResponse = await fetch('https://api.daily.co/v1/rooms', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${DAILY_API_KEY}`,
                        },
                        body: JSON.stringify({
                            properties: {
                                enable_chat: true,
                                enable_screenshare: true,
                                enable_recording: 'cloud',
                                exp: Math.round(Date.now() / 1000) + 7 * 24 * 60 * 60, // Expires in 7 days
                            },
                        }),
                    });

                    if (dailyResponse.ok) {
                        const dailyData = await dailyResponse.json();
                        meeting_url = dailyData.url;
                        console.log('Created Daily.co room:', meeting_url);
                    } else {
                        console.error('Failed to create Daily.co room:', await dailyResponse.text());
                    }
                } else {
                    console.warn('DAILY_API_KEY not configured');
                }
            } catch (error) {
                console.error('Error creating Daily.co room:', error);
                // Continue without meeting URL - can be created later
            }
        }

        // Update booking status to confirmed (payment approved, meeting scheduled)
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'confirmed',
                meeting_url: meeting_url || booking.meeting_url
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return NextResponse.json(
                { error: `Error al aprobar el pago: ${updateError.message}` },
                { status: 500 }
            );
        }

        // Create notification for user and expert
        const notifications = [
            {
                recipient_user_id: booking.user_id,
                title: '✅ Reserva confirmada',
                body: `Tu pago ha sido confirmado. Tu reserva para el ${booking.date} a las ${booking.time} está lista. Podrás acceder a la reunión cuando llegue la hora.`,
                type: 'booking_confirmed',
                status: 'unread',
                created_by: user.id,
            },
            {
                recipient_user_id: booking.expert_id,
                title: '✅ Nueva reserva confirmada',
                body: `Tienes una nueva reserva confirmada para el ${booking.date} a las ${booking.time}. Prepárate para la sesión.`,
                type: 'booking_confirmed',
                status: 'unread',
                created_by: user.id,
            }
        ];

        const { error: notificationError } = await supabase.from('notifications').insert(notifications);

        if (notificationError) {
            console.error('Error creating notifications:', notificationError);
            // Don't fail the request if notifications fail
        }

        await logAdminAction({
            adminId: user.id,
            action: 'approve_payment',
            targetType: 'booking',
            targetId: id,
            details: { booking_date: booking.date, booking_time: booking.time, price: booking.price },
        });

        return NextResponse.json({
            success: true,
            message: 'Pago aprobado correctamente'
        });

    } catch (error) {
        console.error('Error in approve payment:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
