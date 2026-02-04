import ServicesGrid from '@/components/landing/ServicesGrid';
import { EmptyState } from '@/components/ui/Status/Status';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseAnon } from '@supabase/supabase-js';
import { normalize } from '@/utils/text';

// Type Definitions for better type safety
type ServiceCategory = { name: string | null };
type ActiveCountry = { name: string | null };

type ServiceRow = {
    id: string;
    title: string | null;
    category: string | null;
    country: string | null;
    price: number | null;
    currency: string | null;
    image_url: string | null;
    status: string | null;
    created_at: string;
    expert_id: string | null;
};

type ExpertRow = {
    id: string;
    title: string | null;
    rating: number | null;
    reviews_count: number | null;
    city: string | null;
    country: string | null;
};

type ProfileRow = {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
};

type BookingRow = {
    id: string;
    service_id: string | null;
};

type ReviewRow = {
    rating: number;
    booking_id: string;
};

export default async function ServicesSearchPage({
    searchParams
}: {
    searchParams: Promise<{ q?: string; category?: string; country?: string }>
}) {
    const supabase = await createClient();
    const { q, category, country } = await searchParams;

    // Cached function to get filter options (categories and countries)
    // NOTE: Using unstable_cache - may change in future Next.js versions
    const getFilters = unstable_cache(async () => {
        try {
            const anon = createSupabaseAnon(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );

            const [{ data: catRows }, { data: countryRows }] = await Promise.all([
                anon.from('service_categories').select('name').order('name'),
                anon.from('active_countries').select('name').order('name')
            ]);

            const categoriesList = Array.from(
                new Set(
                    ((catRows || []) as ServiceCategory[])
                        .map((r) => r.name)
                        .filter((n): n is string => !!n)
                )
            );

            const countriesList = Array.from(
                new Set(
                    ((countryRows || []) as ActiveCountry[])
                        .map((r) => r.name)
                        .filter((n): n is string => !!n)
                )
            );

            return { categoriesList, countriesList };
        } catch (error) {
            console.error('Error fetching filters:', error);
            return { categoriesList: [], countriesList: [] };
        }
    }, ['filters-master'], { revalidate: 300 });

    const { categoriesList, countriesList } = await getFilters();

    try {
        // 1. Fetch services WITHOUT JOINs (RLS compatible)
        let query = supabase
            .from('services')
            .select('*')
            .eq('status', 'active');

        // Apply category filter at database level
        if (category && category !== 'Todas') {
            query = query.eq('category', category);
        }

        // Apply country filter at database level if possible
        if (country && country !== 'Todos') {
            query = query.eq('country', country);
        }

        const { data: servicesData, error: servicesError } = await query
            .order('created_at', { ascending: false })
            .limit(50);

        if (servicesError) {
            console.error('Error fetching services:', servicesError);
            throw servicesError;
        }

        const services = (servicesData || []) as ServiceRow[];

        // 2. Apply text search filter (client-side for now as it requires normalization)
        let filteredServices = services;
        if (q && q.trim()) {
            const term = normalize(q.trim());
            filteredServices = services.filter((s) => {
                const title = normalize(s.title || '');
                return title.includes(term);
            });
        }

        const hasServices = filteredServices.length > 0;

        if (!hasServices) {
            // Show contextual empty state based on applied filters
            const hasFilters = !!q || (category && category !== 'Todas') || (country && country !== 'Todos');
            const emptyTitle = hasFilters ? 'No encontramos resultados' : 'No hay servicios disponibles';
            const emptyDescription = hasFilters
                ? 'Intenta ajustar los filtros de búsqueda o explora otras categorías.'
                : 'Aún no hay servicios activos en este momento.';

            return (
                <main>
                    <EmptyState title={emptyTitle} description={emptyDescription}>
                        <Link href="/">
                            <Button>Volver</Button>
                        </Link>
                    </EmptyState>
                </main>
            );
        }

        // 3. Get unique expert IDs from services
        const expertIds = [...new Set(
            filteredServices
                .map(s => s.expert_id)
                .filter((id): id is string => !!id)
        )];

        // 4. Fetch experts separately (RLS compatible)
        let expertsMap: Record<string, ExpertRow> = {};
        if (expertIds.length > 0) {
            const { data: experts } = await supabase
                .from('experts')
                .select('id, title, rating, reviews_count, city, country')
                .in('id', expertIds);

            (experts || []).forEach((expert: any) => {
                expertsMap[expert.id] = expert as ExpertRow;
            });
        }

        // 5. Fetch profiles separately (RLS compatible)
        let profilesMap: Record<string, ProfileRow> = {};
        if (expertIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .in('id', expertIds);

            (profiles || []).forEach((profile: any) => {
                profilesMap[profile.id] = profile as ProfileRow;
            });
        }

        // 6. Calculate service ratings from reviews
        // This is a multi-step process to avoid JOINs and maintain RLS compatibility:
        // Step A: Fetch bookings for these services
        // Step B: Fetch reviews for those bookings
        // Step C: Map reviews back to services via booking IDs
        // Step D: Aggregate ratings per service (average and count)
        const serviceIds = filteredServices.map(s => s.id);
        let serviceRatingMap: Record<string, { avg: number; count: number }> = {};

        if (serviceIds.length > 0) {
            // Step A: Get bookings for these services
            const { data: bookingsData } = await supabase
                .from('bookings')
                .select('id, service_id')
                .in('service_id', serviceIds);

            const bookings = (bookingsData || []) as BookingRow[];
            const bookingIds = bookings.map(b => b.id);

            if (bookingIds.length > 0) {
                // Step B: Get reviews for these bookings
                const { data: reviewsData } = await supabase
                    .from('reviews')
                    .select('rating, booking_id')
                    .in('booking_id', bookingIds);

                const reviews = (reviewsData || []) as ReviewRow[];

                // Step C: Map bookings to service IDs
                const bookingToServiceMap: Record<string, string> = {};
                bookings.forEach(b => {
                    if (b.service_id) {
                        bookingToServiceMap[b.id] = b.service_id;
                    }
                });

                // Step D: Aggregate ratings per service
                const ratingsPerService: Record<string, number[]> = {};
                reviews.forEach(review => {
                    const serviceId = bookingToServiceMap[review.booking_id];
                    const rating = Number(review.rating);

                    if (serviceId && !isNaN(rating)) {
                        if (!ratingsPerService[serviceId]) {
                            ratingsPerService[serviceId] = [];
                        }
                        ratingsPerService[serviceId].push(rating);
                    }
                });

                // Calculate averages
                Object.entries(ratingsPerService).forEach(([serviceId, ratings]) => {
                    const count = ratings.length;
                    const sum = ratings.reduce((a, b) => a + b, 0);
                    const avg = count > 0 ? sum / count : 0;

                    serviceRatingMap[serviceId] = {
                        avg: Number(avg.toFixed(1)),
                        count
                    };
                });
            }
        }

        // 7. Enrich services with expert and rating data
        const servicesWithRatings = filteredServices.map((service) => {
            const expertId = service.expert_id;
            const expert = expertId ? expertsMap[expertId] : null;
            const profile = expertId ? profilesMap[expertId] : null;
            const ratings = serviceRatingMap[service.id];

            return {
                id: service.id,
                title: service.title || 'Servicio',
                price: service.price || 0,
                currency: service.currency || 'USD',
                category: service.category || 'General',
                image_url: service.image_url || undefined,
                country: service.country || undefined,
                rating_avg: ratings?.avg || undefined,
                reviews_count_service: ratings?.count || undefined,
                expert: {
                    id: expertId || '',
                    title: expert?.title || 'Profesional',
                    rating: expert?.rating || 5,
                    reviews_count: expert?.reviews_count || 0,
                    city: expert?.city || undefined,
                    country: expert?.country || undefined,
                    profile: {
                        full_name: profile?.full_name || 'Experto',
                        avatar_url: profile?.avatar_url || '/images/default-avatar.png',
                    },
                },
            };
        });

        return (
            <main>
                <ServicesGrid
                    services={servicesWithRatings}
                    categories={categoriesList}
                    countries={countriesList}
                />
            </main>
        );

    } catch (error) {
        console.error('Error in services search page:', error);

        return (
            <main>
                <EmptyState
                    title="Error al cargar servicios"
                    description="Hubo un problema al cargar los servicios. Por favor intenta nuevamente."
                >
                    <Link href="/">
                        <Button>Volver al inicio</Button>
                    </Link>
                </EmptyState>
            </main>
        );
    }
}
