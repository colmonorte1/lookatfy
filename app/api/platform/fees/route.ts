import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const revalidate = 300; // cache 5 min

/**
 * Retorna las tarifas de servicio configuradas en platform_settings.
 * Es público — no requiere autenticación.
 */
export async function GET() {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );

    const { data, error } = await supabase
      .from('platform_settings')
      .select('service_fee_cop, service_fee_usd')
      .single();

    if (error || !data) {
      // Fallback a valores por defecto si no hay settings
      return NextResponse.json({ cop: 2000, usd: 2 });
    }

    return NextResponse.json({
      cop: Number(data.service_fee_cop ?? 2000),
      usd: Number(data.service_fee_usd ?? 2),
    });
  } catch {
    return NextResponse.json({ cop: 2000, usd: 2 });
  }
}
