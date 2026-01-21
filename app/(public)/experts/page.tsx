import { ExpertCard } from '@/components/marketplace/ExpertCard';
import ExpertsClient from '@/components/marketplace/ExpertsClient';
import { createClient } from '@/utils/supabase/server';
import { Expert } from '@/lib/data/experts';

export default async function ExpertsPage() {
    const supabase = await createClient();

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
                status,
                category
            )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

    type ExpertRow = {
        id: string;
        title?: string;
        rating?: number;
        reviews_count?: number;
        profile?: { full_name?: string; avatar_url?: string };
        services?: Array<{ price?: number; status?: string; category?: string }>;
    };

    const rows = (experts as ExpertRow[] || []);
    const expertIds = rows.map(e => e.id).filter(Boolean);

    let ratingMap: Record<string, { avg: number; count: number }> = {};
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
            ratingMap[id] = { avg: Number(avg.toFixed(1)), count };
        });
    }

    const items: Expert[] = rows.map((e) => {
        const firstActiveService = Array.isArray(e.services) ? e.services.find((s) => s.status === 'active') : null;
        const categories = Array.isArray(e.services) ? Array.from(new Set(e.services.map((s) => s.category).filter(Boolean))) : [];
        return {
            id: e.id,
            name: e.profile?.full_name || 'Experto',
            title: e.title || 'Asesoría',
            rating: ratingMap[e.id]?.avg ?? e.rating ?? 5.0,
            reviews: ratingMap[e.id]?.count ?? e.reviews_count ?? 0,
            price: firstActiveService?.price || 0,
            image: e.profile?.avatar_url || 'https://i.pravatar.cc/400?u=expert',
            tags: categories,
            bio: '',
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

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2rem'
            }}>
                
            </div>
        </main>
    );
}
