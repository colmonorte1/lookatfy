import ServicesGrid from '@/components/landing/ServicesGrid';
import { ExpertCard } from '@/components/marketplace/ExpertCard';
import { Expert } from '@/lib/data/experts';
import { EmptyState } from '@/components/ui/Status/Status';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseAnon } from '@supabase/supabase-js';

export default async function Home() {
  const supabase = await createClient();

  // Fetch active services
  const { data: services } = await supabase
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
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  const hasServices = Array.isArray(services) && services.length > 0;

  // Compute per-service rating averages (user -> expert) based on bookings
  let serviceRatingMap: Record<string, { avg: number; count: number }> = {};
  if (hasServices) {
    const serviceIds = (services || []).map((s: any) => s.id);
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

  const { data: experts } = await supabase
    .from('experts')
    .select(`
      *,
      profile:profiles (
        full_name,
        avatar_url
      ),
      services:services (
        price,
        status
      )
    `)
    .order('created_at', { ascending: false })
    .limit(8);

  type ExpertRow = {
    id: string;
    title?: string;
    rating?: number;
    reviews_count?: number;
    profile?: { full_name?: string; avatar_url?: string };
    services?: Array<{ price?: number; status?: string }>;
  };

  // Compute expert rating averages for featured experts
  const expertRows = (experts as ExpertRow[] || []);
  const expertIds = expertRows.map(e => e.id);
  let expertRatingMap: Record<string, { avg: number; count: number }> = {};
  if (expertIds.length) {
    const { data: ratingsData } = await supabase
      .from('reviews')
      .select('subject_id, rating')
      .in('subject_id', expertIds);
    const agg: Record<string, number[]> = {};
    (ratingsData || []).forEach((r: any) => {
      const id = r.subject_id;
      const val = Number(r.rating);
      if (!isNaN(val)) {
        if (!agg[id]) agg[id] = [];
        agg[id].push(val);
      }
    });
    Object.entries(agg).forEach(([id, arr]) => {
      const count = arr.length;
      const avg = count ? arr.reduce((a, b) => a + b, 0) / count : 0;
      expertRatingMap[id] = { avg: Number(avg.toFixed(1)), count };
    });
  }

  const featuredExperts: Expert[] = expertRows.map((e) => {
    const firstActiveService = Array.isArray(e.services) ? e.services.find((s) => s.status === 'active') : null;
    return {
      id: e.id,
      name: e.profile?.full_name || 'Experto',
      title: e.title || 'Asesoría',
      rating: expertRatingMap[e.id]?.avg ?? e.rating ?? 5.0,
      reviews: expertRatingMap[e.id]?.count ?? e.reviews_count ?? 0,
      price: firstActiveService?.price || 0,
      image: e.profile?.avatar_url || 'https://i.pravatar.cc/400?u=expert',
      tags: [],
      bio: '',
      isOnline: false
    };
  });

  const servicesWithRatings = (services || []).map((s: any) => ({
    ...s,
    rating_avg: serviceRatingMap[s.id]?.avg ?? undefined,
    reviews_count_service: serviceRatingMap[s.id]?.count ?? undefined
  }));

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

  return (
    <main>
      {hasServices ? (
        <ServicesGrid services={servicesWithRatings} categories={categoriesList} countries={countriesList} />
      ) : (
        <EmptyState title="Aún no hay servicios activos" description="Prueba más tarde o explora expertos disponibles.">
          <Link href="/experts">
            <Button>Ver expertos</Button>
          </Link>
        </EmptyState>
      )}

      <section style={{ padding: '4rem 1rem', borderTop: '1px solid rgb(var(--border))' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Expertos Destacados</h2>
            <Link href="/experts" style={{ color: 'rgb(var(--primary))', fontWeight: 600 }}>Ver todos</Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            {featuredExperts.map((expert) => (
              <ExpertCard key={expert.id} expert={expert} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
