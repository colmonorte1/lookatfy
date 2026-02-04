import ExpertsClient from '@/components/marketplace/ExpertsClient';
import { createClient } from '@/utils/supabase/server';
import { Expert } from '@/lib/data/experts';

export default async function ExpertsPage() {
    const supabase = await createClient();

    // 1. Fetch experts (no JOINs to avoid RLS issues)
    const { data: expertsRaw } = await supabase
        .from('experts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

    const expertsData = expertsRaw || [];
    const expertIds = expertsData.map((e: any) => e.id).filter(Boolean);

    // 2. Fetch profiles for experts (expert.id = profile.id in this schema)
    let profilesMap: Record<string, { full_name?: string; avatar_url?: string }> = {};

    if (expertIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', expertIds);

        (profiles || []).forEach((p: any) => {
            profilesMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
    }

    // 3. Fetch services for experts
    let servicesMap: Record<string, Array<{ price?: number; status?: string; category?: string }>> = {};

    if (expertIds.length > 0) {
        const { data: services } = await supabase
            .from('services')
            .select('expert_id, price, status, category')
            .in('expert_id', expertIds);

        (services || []).forEach((s: any) => {
            if (!servicesMap[s.expert_id]) servicesMap[s.expert_id] = [];
            servicesMap[s.expert_id].push({ price: s.price, status: s.status, category: s.category });
        });
    }

    // 4. Fetch ratings for experts
    const ratingMap: Record<string, { avg: number; count: number }> = {};
    if (expertIds.length) {
        const { data: ratingsData } = await supabase
            .from('reviews')
            .select('subject_id, rating')
            .in('subject_id', expertIds);
        type ReviewRow = { subject_id: string; rating: number };
        const agg: Record<string, number[]> = {};
        (ratingsData as ReviewRow[] || []).forEach((r) => {
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
            ratingMap[id] = { avg: Number(avg.toFixed(1)), count };
        });
    }

    // 5. Build experts list with merged data
    const items: Expert[] = expertsData.map((e: any) => {
        const profile = profilesMap[e.id];
        const expertServices = servicesMap[e.id] || [];
        const firstActiveService = expertServices.find((s) => s.status === 'active');
        const categories: string[] = Array.from(
            new Set(expertServices.map((s) => s.category).filter((v): v is string => typeof v === 'string'))
        );
        return {
            id: e.id,
            name: profile?.full_name || 'Experto',
            title: e.title || 'Asesoría',
            rating: ratingMap[e.id]?.avg ?? e.rating ?? 5.0,
            reviews: ratingMap[e.id]?.count ?? e.reviews_count ?? 0,
            price: firstActiveService?.price || 0,
            image: profile?.avatar_url || 'https://i.pravatar.cc/400?u=expert',
            tags: categories,
            bio: '',
            isOnline: Boolean(firstActiveService),
            languages: Array.isArray(e.languages) ? e.languages : [],
            skills: Array.isArray(e.skills) ? e.skills : [],
        };
    });

    return (
        <main className="container" style={{ padding: '2rem 1rem 4rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Encuentra tu Experto</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', maxWidth: '600px', margin: '0 auto' }}>
                    Conecta al instante mediante videollamada con profesionales verificados listos para ayudarte.
                </p>
            </header>

            <ExpertsClient items={items} />
        </main>
    );
}
