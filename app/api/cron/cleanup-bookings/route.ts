import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron job para limpiar bookings pendientes expirados
 *
 * Configurar en Vercel:
 * vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-bookings",
 *     "schedule": "*/15 * * * *"
 *   }]
 * }
 *
 * O llamar manualmente:
 * curl -X POST http://localhost:3000/api/cron/cleanup-bookings \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function POST(request: Request) {
  try {
    // Verificar autorización (en producción)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // En producción, verificar el secret
    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Conectar a Supabase con service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key required' }, { status: 500 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    // Encontrar bookings pendientes expirados
    const now = new Date().toISOString();
    const { data: expiredBookings, error: findError } = await supabase
      .from('bookings')
      .select('id, created_at, expires_at')
      .eq('status', 'pending')
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    if (findError) {
      console.error('Error finding expired bookings:', findError);
      return NextResponse.json({ error: findError.message }, { status: 500 });
    }

    const count = expiredBookings?.length || 0;

    if (count === 0) {
      return NextResponse.json({
        success: true,
        message: 'No expired bookings found',
        cancelled: 0,
      });
    }

    // Cancelar bookings expirados
    const bookingIds = expiredBookings.map(b => b.id);
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .in('id', bookingIds);

    if (updateError) {
      console.error('Error cancelling expired bookings:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`Cancelled ${count} expired bookings:`, bookingIds);

    return NextResponse.json({
      success: true,
      message: `Successfully cancelled ${count} expired booking(s)`,
      cancelled: count,
      bookingIds,
    });

  } catch (error: any) {
    console.error('Error in cleanup-bookings cron:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// También permitir GET para testing
export async function GET() {
  return NextResponse.json({
    message: 'Booking cleanup cron job endpoint',
    usage: 'POST with Authorization: Bearer CRON_SECRET',
    schedule: 'Every 15 minutes',
  });
}
