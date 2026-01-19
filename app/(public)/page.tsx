import ServicesGrid from '@/components/landing/ServicesGrid';
import { createClient } from '@/utils/supabase/server';

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

  return (
    <main>
      <ServicesGrid services={services || []} />
    </main>
  );
}
