import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

        // Update booking status to cancelled
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                status: 'cancelled'
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating booking:', updateError);
            return NextResponse.json(
                { error: `Error al rechazar el pago: ${updateError.message}` },
                { status: 500 }
            );
        }

        // Create notification for user and expert
        const notifications = [
            {
                user_id: booking.user_id,
                title: 'Pago rechazado',
                message: `Tu pago para la reserva ${id.slice(0, 8)} ha sido rechazado por el administrador. Contacta con soporte para más información.`,
                type: 'payment',
                read: false
            },
            {
                user_id: booking.expert_id,
                title: 'Pago rechazado',
                message: `El pago de la reserva ${id.slice(0, 8)} ha sido rechazado por el administrador.`,
                type: 'payment',
                read: false
            }
        ];

        const { error: notificationError } = await supabase.from('notifications').insert(notifications);

        if (notificationError) {
            console.error('Error creating notifications:', notificationError);
            // Don't fail the request if notifications fail
        }

        return NextResponse.json({
            success: true,
            message: 'Pago rechazado correctamente'
        });

    } catch (error) {
        console.error('Error in reject payment:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
