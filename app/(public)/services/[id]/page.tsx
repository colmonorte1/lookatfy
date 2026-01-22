import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ServiceDetailClient from './ServiceDetailClient';

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch Service + Expert Profile
    // We join 'experts' (which has minimal data) -> 'profiles' (which has full name, avatar) is usually the link.
    // My schema: services(expert_id) -> experts(id) -> profiles(id)
    // Wait, let's check schema again. `experts` PK is `id`, which FKs to `profiles.id`. 
    // `services.expert_id` refs `experts.id`.
    // So we need to join: services -> expert:experts!expert_id(*)
    // And ideally experts -> profiles(*)

    // Supabase query to deep join: 
    // select('*, expert:experts(*, profile:profiles(*))')

    const { data: service, error } = await supabase
        .from('services')
        .select(`
            *,
            expert:experts (
                *,
                languages,
                skills,
                profile:profiles (
                    full_name,
                    avatar_url
                )
            )
        `)
        .eq('id', id)
        .single();

    if (error || !service) {
        console.error("Error fetching service or not found:", error);
        // If real ID not found, maybe show a generic error or 404. 
        // For development/demo, if we don't have real data matching the ID in URL (which might be from old links), allow a graceful fail or 404.
        // If this is a numeric ID 1, 2, 3.. it might fail if UUIDs are used. 
        // My services schema uses UUID? Or Serial?
        // Let's assume standard UUID if newly created, but if I seeded data manually it might be different. 
        // The mock used '1', '2'. 
        // Since I just created services, they likely have UUIDs.
        // If I visit /services/1 it will fail.
        // I should probably handle this. 

        notFound();
    }

    // Transform data to flat structure expected by Client Component if needed, or pass as is.
    // The client component expects `expert` object with name, avatar etc.
    // The joined data `service.expert` will contain `profile` object.
    // Let's flatten it for easier consumption.

    // Fetch Service-specific Reviews (last 5)
    const { data: bookingsForService } = await supabase
        .from('bookings')
        .select('id')
        .eq('service_id', service.id)
        .order('created_at', { ascending: false })
        .limit(50);

    type BookingIdRow = { id: string };
    const bookingIds = ((bookingsForService || []) as BookingIdRow[]).map((b) => b.id);

    type ReviewRow = {
        id: string;
        rating: number;
        comment?: string | null;
        created_at: string;
        reviewer?: { full_name?: string | null; avatar_url?: string | null } | null;
        subject?: { role?: string | null } | null;
    };
    let reviews: ReviewRow[] = [];
    if (bookingIds.length > 0) {
        try {
            const { data: reviewsData } = await supabase
                .from('reviews')
                .select(`
                    *,
                    reviewer:profiles!reviewer_id ( full_name, avatar_url ),
                    subject:profiles!subject_id!inner ( role )
                `)
                .in('booking_id', bookingIds)
                .eq('subject.role', 'expert')
                .order('created_at', { ascending: false })
                .limit(5);
            reviews = (reviewsData || []) as ReviewRow[];
        } catch {
            const { data: reviewsAll } = await supabase
                .from('reviews')
                .select(`
                    *,
                    reviewer:profiles!reviewer_id ( full_name, avatar_url ),
                    subject:profiles!subject_id ( role )
                `)
                .in('booking_id', bookingIds)
                .order('created_at', { ascending: false })
                .limit(10);
            reviews = (((reviewsAll || []) as ReviewRow[]).filter((r) => r.subject?.role === 'expert')).slice(0, 5);
        }
    }

    // Safety check if expert link is broken (though RLS/FK should prevent this)
    // Compute Expert-wide rating stats
    let expertAvg = 5.0;
    let expertCount = 0;
    try {
        const { data: expertRatings } = await supabase
            .from('reviews')
            .select('rating')
            .eq('subject_id', service.expert_id);
        type ExpertRatingRow = { rating?: number | string | null };
        const ratings = (((expertRatings || []) as ExpertRatingRow[]).map((r) => Number(r.rating))).filter((n) => !isNaN(n));
        expertCount = ratings.length;
        expertAvg = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length) : 5.0;
    } catch {}

    const expertData = service.expert ? {
        ...service.expert,
        full_name: service.expert.profile?.full_name,
        avatar_url: service.expert.profile?.avatar_url,
        rating_avg: Number(expertAvg.toFixed(1)),
        reviews_total: expertCount,
        verified: service.expert.verified,
        languages: Array.isArray((service.expert as any).languages) ? (service.expert as any).languages : [],
        skills: Array.isArray((service.expert as any).skills) ? (service.expert as any).skills : []
    } : {};

    return <ServiceDetailClient service={service} expert={expertData} reviews={reviews} />;
}
