import DisputesClient from './DisputesClient';
import { createClient } from '@/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';

export default async function DisputesPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return (
            <div style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Disputas y Reclamos</h1>
                <p>Debes iniciar sesión como administrador para ver esta sección.</p>
            </div>
        );
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return (
            <div style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Disputas y Reclamos</h1>
                <p>No tienes permisos de administrador.</p>
            </div>
        );
    }

    let client = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        client = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            { cookies: { getAll: () => [], setAll: () => {} } }
        );
    }

    const { data: disputes } = await client
        .from('disputes')
        .select(`
            *,
            reporter:profiles!created_by(full_name, role)
        `)
        .order('created_at', { ascending: false });

    const list = disputes || [];
    const bookingIds = list.map((d: any) => d.booking_id).filter(Boolean);
    let bookingMap: Record<string, any> = {};
    if (bookingIds.length > 0) {
        const { data: bookings } = await client
            .from('bookings')
            .select(`
                id,
                service:services(title),
                user:profiles!user_id(full_name, email),
                expert:experts!expert_id(
                    profile:profiles(full_name, email)
                )
            `)
            .in('id', bookingIds);

        (bookings || []).forEach((b: any) => {
            bookingMap[b.id] = {
                id: b.id,
                service: { title: b?.service?.title },
                user: { full_name: b?.user?.full_name, email: b?.user?.email },
                expert: { full_name: b?.expert?.profile?.full_name, email: b?.expert?.profile?.email }
            };
        });
    }

    const enriched = list.map((d: any) => ({
        ...d,
        booking: bookingMap[d.booking_id] || undefined
    }));

    return <DisputesClient initialDisputes={enriched} />;
}
