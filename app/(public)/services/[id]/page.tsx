import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import ServiceDetailClient from './ServiceDetailClient';

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch Service (no JOINs to avoid RLS issues)
    const { data: serviceRaw, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !serviceRaw) {
        console.error("Error fetching service or not found:", error);
        notFound();
    }

    // 2. Fetch Expert separately (expert.id = profile.id in this schema)
    const { data: expertData } = serviceRaw.expert_id
        ? await supabase
            .from('experts')
            .select('*')
            .eq('id', serviceRaw.expert_id)
            .single()
        : { data: null };

    // 3. Fetch Profile (expert.id = profile.id)
    const { data: profileData } = expertData
        ? await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', expertData.id)
            .single()
        : { data: null };

    // 4. Build service with expert data
    const service = {
        ...serviceRaw,
        expert: expertData ? {
            ...expertData,
            languages: Array.isArray(expertData.languages) ? expertData.languages : [],
            skills: Array.isArray(expertData.skills) ? expertData.skills : [],
            profile: profileData || null
        } : null
    };

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
        // Fetch reviews without JOINs
        const { data: reviewsRaw } = await supabase
            .from('reviews')
            .select('id, rating, comment, created_at, reviewer_id, subject_id, booking_id')
            .in('booking_id', bookingIds)
            .order('created_at', { ascending: false })
            .limit(10);

        const reviewsData = reviewsRaw || [];

        // Get unique reviewer_ids and subject_ids
        const reviewerIds = [...new Set(reviewsData.map((r: any) => r.reviewer_id).filter(Boolean))];
        const subjectIds = [...new Set(reviewsData.map((r: any) => r.subject_id).filter(Boolean))];

        // Fetch profiles for reviewers
        let reviewersMap: Record<string, { full_name?: string; avatar_url?: string }> = {};
        if (reviewerIds.length > 0) {
            const { data: reviewerProfiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', reviewerIds);

            (reviewerProfiles || []).forEach((p: any) => {
                reviewersMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
            });
        }

        // Fetch profiles for subjects (to check role)
        let subjectsMap: Record<string, { role?: string }> = {};
        if (subjectIds.length > 0) {
            const { data: subjectProfiles } = await supabase
                .from('profiles')
                .select('id, role')
                .in('id', subjectIds);

            (subjectProfiles || []).forEach((p: any) => {
                subjectsMap[p.id] = { role: p.role };
            });
        }

        // Build reviews with merged data, filter by expert role
        reviews = reviewsData
            .filter((r: any) => subjectsMap[r.subject_id]?.role === 'expert')
            .slice(0, 5)
            .map((r: any) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                created_at: r.created_at,
                reviewer: reviewersMap[r.reviewer_id] || null,
                subject: subjectsMap[r.subject_id] || null
            }));
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

    const expertDataForClient = service.expert ? {
        ...service.expert,
        full_name: service.expert.profile?.full_name,
        avatar_url: service.expert.profile?.avatar_url,
        rating_avg: Number(expertAvg.toFixed(1)),
        reviews_total: expertCount,
        verified: service.expert.verified,
        languages: Array.isArray((service.expert as any).languages) ? (service.expert as any).languages : [],
        skills: Array.isArray((service.expert as any).skills) ? (service.expert as any).skills : [],
        timezone: (service.expert as any).timezone || null
    } : {};

    return <ServiceDetailClient service={service} expert={expertDataForClient} reviews={reviews} />;
}
