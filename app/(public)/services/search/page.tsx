import ServicesGrid from '@/components/landing/ServicesGrid';
import { EmptyState } from '@/components/ui/Status/Status';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseAnon } from '@supabase/supabase-js';

export default async function ServicesSearchPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; country?: string }> }) {
  const supabase = await createClient();
  const { q, category, country } = await searchParams;

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const getFilters = unstable_cache(async () => {
    const anon = createSupabaseAnon(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const [{ data: catRows }, { data: countryRows }] = await Promise.all([
      anon.from('service_categories').select('name').order('name'),
      anon.from('active_countries').select('name').order('name')
    ]);
    const categoriesList = Array.from(new Set((catRows || []).map((r: any) => String(r.name)).filter(Boolean)));
    const countriesList = Array.from(new Set((countryRows || []).map((r: any) => String(r.name)).filter(Boolean)));
    return { categoriesList, countriesList };
  }, ['filters-master'], { revalidate: 300 });

  const { categoriesList, countriesList } = await getFilters();

  let query = supabase
    .from('services')
    .select(`
      *,
      expert:experts (
        id,
        title,
        rating,
        reviews_count,
        city,
        country,
        profile:profiles (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('status', 'active');

  if (category && category !== 'Todas') {
    query = query.eq('category', category);
  }

  const { data: services } = await query.order('created_at', { ascending: false }).limit(50);
  const hasServices = Array.isArray(services) && services.length > 0;

  let filtered = (services || []);
  if (q && q.trim()) {
    const term = normalize(q.trim());
    filtered = filtered.filter((s: any) => {
      const t = normalize(String(s.title || ''));
      const n = normalize(String(s.expert?.profile?.full_name || ''));
      return t.includes(term) || n.includes(term);
    });
  }
  if (country && country !== 'Todos') {
    const c = normalize(country);
    filtered = filtered.filter((s: any) => {
      const sc = String(s.country || s.expert?.country || '');
      return sc && normalize(sc).includes(c);
    });
  }

  let serviceRatingMap: Record<string, { avg: number; count: number }> = {};
  if (filtered.length) {
    const serviceIds = filtered.map((s: any) => s.id);
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, service_id')
      .in('service_id', serviceIds);
    const bookingIds = (bookings || []).map((b: any) => b.id);
    if (bookingIds.length) {
      const { data: reviewsRows } = await supabase
        .from('reviews')
        .select(`
          rating,
          booking:bookings!booking_id ( service_id )
        `)
        .in('booking_id', bookingIds);
      const agg: Record<string, number[]> = {};
      (reviewsRows || []).forEach((r: any) => {
        const sid = r.booking?.service_id;
        const val = Number(r.rating);
        if (sid && !isNaN(val)) {
          if (!agg[sid]) agg[sid] = [];
          agg[sid].push(val);
        }
      });
      Object.entries(agg).forEach(([sid, arr]) => {
        const count = arr.length;
        const avg = count ? arr.reduce((a, b) => a + b, 0) / count : 0;
        serviceRatingMap[sid] = { avg: Number(avg.toFixed(1)), count };
      });
    }
  }

  const servicesWithRatings = filtered.map((s: any) => ({
    ...s,
    rating_avg: serviceRatingMap[s.id]?.avg ?? undefined,
    reviews_count_service: serviceRatingMap[s.id]?.count ?? undefined
  }));

  return (
    <main>
      {servicesWithRatings.length ? (
        <ServicesGrid services={servicesWithRatings} categories={categoriesList} countries={countriesList} />
      ) : (
        <EmptyState title="Sin resultados" description="No hay servicios que coincidan.">
          <Link href="/">
            <Button>Volver</Button>
          </Link>
        </EmptyState>
      )}
    </main>
  );
}
