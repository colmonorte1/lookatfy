import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Cron job para marcar como 'completed' los bookings confirmados cuya sesión ya terminó.
 *
 * Lógica: status='confirmed' AND (start_at + duration_minutes) < NOW()
 *
 * Configurar en vercel.json:
 * { "crons": [{ "path": "/api/cron/complete-bookings", "schedule": "every 10 minutes" }] }
 */
export async function POST(request: Request) {
  try {
    // Verificar autorización en producción
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === 'production') {
      if (!cronSecret || !authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key required' }, { status: 500 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const now = new Date().toISOString();

    // Obtener bookings confirmados con su duración del servicio
    const { data: confirmedBookings, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_at,
        service:services ( duration )
      `)
      .eq('status', 'confirmed')
      .not('start_at', 'is', null);

    if (fetchError) {
      console.error('Error fetching confirmed bookings:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!confirmedBookings || confirmedBookings.length === 0) {
      return NextResponse.json({ success: true, message: 'No confirmed bookings to process', completed: 0 });
    }

    // Filtrar los que ya terminaron: start_at + duration < now
    const nowMs = Date.now();
    const toComplete = confirmedBookings.filter((b: any) => {
      if (!b.start_at) return false;
      const serviceObj = Array.isArray(b.service) ? b.service[0] : b.service;
      const durationMin = Number(serviceObj?.duration) || 60;
      const endMs = new Date(b.start_at).getTime() + durationMin * 60 * 1000;
      return endMs < nowMs;
    });

    if (toComplete.length === 0) {
      return NextResponse.json({ success: true, message: 'No sessions have ended yet', completed: 0 });
    }

    const ids = toComplete.map((b: any) => b.id);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'completed' })
      .in('id', ids);

    if (updateError) {
      console.error('Error marking bookings as completed:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.log(`Marked ${ids.length} bookings as completed:`, ids);

    return NextResponse.json({
      success: true,
      message: `Marked ${ids.length} booking(s) as completed`,
      completed: ids.length,
      bookingIds: ids,
    });

  } catch (error: any) {
    console.error('Error in complete-bookings cron:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET es el método que usan los crons de Vercel
export async function GET(request: Request) {
  return POST(request);
}
