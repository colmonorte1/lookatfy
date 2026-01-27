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
    type NameRow = { name: string | null };
    const categoriesList = Array.from(new Set(((catRows || []) as NameRow[]).map((r) => r.name).filter((n): n is string => !!n)));
    const countriesList = Array.from(new Set(((countryRows || []) as NameRow[]).map((r) => r.name).filter((n): n is string => !!n)));
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

  type ServiceRow = {
    id: string;
    title?: string | null;
    category?: string | null;
    country?: string | null;
    price?: number | string | null;
    currency?: string | null;
    expert?: { country?: string | null; profile?: { full_name?: string | null; avatar_url?: string | null } | null } | null;
  };
  let filtered: ServiceRow[] = ((services || []) as ServiceRow[]);
  if (q && q.trim()) {
    const term = normalize(q.trim());
    filtered = filtered.filter((s) => {
      const t = normalize(String(s.title || ''));
      const n = normalize(String(s.expert?.profile?.full_name || ''));
      return t.includes(term) || n.includes(term);
    });
  }
  if (country && country !== 'Todos') {
    const c = normalize(country);
    filtered = filtered.filter((s) => {
      const sc = String(s.country || s.expert?.country || '');
      return sc && normalize(sc).includes(c);
    });
  }

  let serviceRatingMap: Record<string, { avg: number; count: number }> = {};
  if (filtered.length) {
    const serviceIds = filtered.map((s) => s.id);
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, service_id')
      .in('service_id', serviceIds);
    type BookingRow = { id: string; service_id?: string | null };
    const bookingIds = ((bookings || []) as BookingRow[]).map((b) => b.id);
    if (bookingIds.length) {
      const { data: reviewsRows } = await supabase
        .from('reviews')
        .select(`
          rating,
          booking:bookings!booking_id ( service_id )
        `)
        .in('booking_id', bookingIds);
      const agg: Record<string, number[]> = {};
      type JoinedReviewRow = { rating: number; booking?: { service_id?: string | null } };
      ((reviewsRows || []) as JoinedReviewRow[]).forEach((r) => {
        const sid = r.booking?.service_id || undefined;
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

  const servicesWithRatings = filtered.map((s) => ({
    id: s.id,
    title: String(s.title || 'Servicio'),
    price: Number((s as any).price ?? 0),
    currency: String((s as any).currency || 'USD'),
    category: String(s.category || 'General'),
    image_url: (s as any).image_url || undefined,
    country: s.country || undefined,
    rating_avg: serviceRatingMap[s.id]?.avg ?? undefined,
    reviews_count_service: serviceRatingMap[s.id]?.count ?? undefined,
    expert: {
      id: String((s.expert as any)?.id || ''),
      title: String((s.expert as any)?.title || 'Profesional'),
      rating: Number((s.expert as any)?.rating ?? 5),
      reviews_count: Number((s.expert as any)?.reviews_count ?? 0),
      city: (s.expert as any)?.city || undefined,
      country: (s.expert as any)?.country || undefined,
      profile: {
        full_name: String(s.expert?.profile?.full_name || 'Experto'),
        avatar_url: String(s.expert?.profile?.avatar_url || 'https://i.pravatar.cc/150?u=expert'),
      },
    },
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
