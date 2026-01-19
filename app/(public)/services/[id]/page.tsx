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

    // Fetch Reviews (Last 5 for this expert)
    // We join reviewer:profiles to get name/avatar
    const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
            *,
            reviewer:profiles!reviewer_id ( full_name, avatar_url )
        `)
        .eq('subject_id', service.expert_id)
        .order('created_at', { ascending: false })
        .limit(5);

    const reviews = reviewsData || [];

    // Safety check if expert link is broken (though RLS/FK should prevent this)
    const expertData = service.expert ? {
        ...service.expert,
        full_name: service.expert.profile?.full_name,
        avatar_url: service.expert.profile?.avatar_url,
        // Use real rating if available (or calculate from reviews if not stored on expert)
        rating: service.expert.rating || 5.0,
        reviews_count: service.expert.reviews_count || reviews.length,
        verified: service.expert.verified
    } : {};

    return <ServiceDetailClient service={service} expert={expertData} reviews={reviews} />;
}
