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

  // 1. Fetch active services (no JOINs to avoid RLS issues)
  const { data: servicesRaw } = await supabase
    .from('services')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  const servicesData = servicesRaw || [];
  const hasServices = servicesData.length > 0;

  // 2. Fetch experts for services separately
  const serviceExpertIds = [...new Set(servicesData.map((s: any) => s.expert_id).filter(Boolean))];
  let serviceExpertsMap: Record<string, any> = {};

  if (serviceExpertIds.length > 0) {
    const { data: serviceExperts } = await supabase
      .from('experts')
      .select('id, title, rating, reviews_count, city, country')
      .in('id', serviceExpertIds);

    (serviceExperts || []).forEach((e: any) => {
      serviceExpertsMap[e.id] = e;
    });
  }

  // 3. Fetch profiles for service experts
  // Note: expert.id = profile.id in this schema
  let serviceExpertProfilesMap: Record<string, { full_name?: string; avatar_url?: string }> = {};

  if (serviceExpertIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', serviceExpertIds);

    (profiles || []).forEach((p: any) => {
      serviceExpertProfilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    });
  }

  // 4. Merge services with expert data
  const services = servicesData.map((s: any) => {
    const expert = s.expert_id ? serviceExpertsMap[s.expert_id] : null;
    const profile = s.expert_id ? serviceExpertProfilesMap[s.expert_id] : null;
    return {
      ...s,
      expert: expert ? {
        ...expert,
        profile: profile || null
      } : null
    };
  });

  // Compute per-service rating averages based on bookings
  let serviceRatingMap: Record<string, { avg: number; count: number }> = {};
  if (hasServices) {
    const serviceIds = servicesData.map((s: any) => s.id);
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, service_id')
      .in('service_id', serviceIds);

    const bookingIds = (bookings || []).map((b: any) => b.id);
    if (bookingIds.length) {
      // Fetch reviews and bookings separately
      const { data: reviewsRows } = await supabase
        .from('reviews')
        .select('rating, booking_id')
        .in('booking_id', bookingIds);

      // Create booking -> service_id map
      const bookingServiceMap: Record<string, string> = {};
      (bookings || []).forEach((b: any) => {
        bookingServiceMap[b.id] = b.service_id;
      });

      const agg: Record<string, number[]> = {};
      (reviewsRows || []).forEach((r: any) => {
        const sid = bookingServiceMap[r.booking_id];
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

  // 5. Fetch featured experts (no JOINs)
  const { data: expertsRaw } = await supabase
    .from('experts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8);

  const expertsData = expertsRaw || [];
  const expertIds = expertsData.map((e: any) => e.id).filter(Boolean);

  // 6. Fetch profiles for featured experts (expert.id = profile.id)
  let expertProfilesMap: Record<string, { full_name?: string; avatar_url?: string }> = {};

  if (expertIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', expertIds);

    (profiles || []).forEach((p: any) => {
      expertProfilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    });
  }

  // 7. Fetch services for featured experts
  let expertServicesMap: Record<string, Array<{ price?: number; status?: string }>> = {};

  if (expertIds.length > 0) {
    const { data: expertServices } = await supabase
      .from('services')
      .select('expert_id, price, status')
      .in('expert_id', expertIds);

    (expertServices || []).forEach((s: any) => {
      if (!expertServicesMap[s.expert_id]) expertServicesMap[s.expert_id] = [];
      expertServicesMap[s.expert_id].push({ price: s.price, status: s.status });
    });
  }

  // 8. Compute expert rating averages for featured experts
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

  // 9. Build featured experts list
  const featuredExperts: Expert[] = expertsData.map((e: any) => {
    const profile = expertProfilesMap[e.id];
    const expertServices = expertServicesMap[e.id] || [];
    const firstActiveService = expertServices.find((s) => s.status === 'active');
    return {
      id: e.id,
      name: profile?.full_name || 'Experto',
      title: e.title || 'Asesoría',
      rating: expertRatingMap[e.id]?.avg ?? e.rating ?? 5.0,
      reviews: expertRatingMap[e.id]?.count ?? e.reviews_count ?? 0,
      price: firstActiveService?.price || 0,
      image: profile?.avatar_url || 'https://i.pravatar.cc/400?u=expert',
      tags: [],
      bio: '',
      isOnline: false
    };
  });

  // 10. Build services with ratings
  const servicesWithRatings = services.map((s: any) => ({
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
