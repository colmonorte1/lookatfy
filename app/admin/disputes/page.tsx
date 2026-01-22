import DisputesClient from './DisputesClient';
import { createClient } from '@/utils/supabase/server';
import { createServerClient } from '@supabase/ssr';

type Reporter = { full_name?: string | null; role?: 'client' | 'expert' | 'admin' | null };
type DisputeRow = {
    id: string;
    created_at: string;
    reason: string;
    description: string;
    status: 'open' | 'under_review' | 'resolved_refunded' | 'resolved_dismissed';
    resolution_notes?: string | null;
    resolved_at?: string | null;
    user_attachments?: string[] | null;
    expert_attachments?: string[] | null;
    expert_response?: string | null;
    user_response?: string | null;
    booking_id?: string | null;
    reporter?: Reporter;
};
type BookingJoin = {
    id: string;
    service?: { title?: string | null };
    user?: { full_name?: string | null; email?: string | null };
    expert?: { profile?: { full_name?: string | null; email?: string | null } };
};
type BookingView = {
    id: string;
    service?: { title?: string };
    user?: { full_name?: string; email?: string };
    expert?: { full_name?: string; email?: string };
};

type AdminDispute = DisputeRow & { booking?: BookingView };

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

    const list: DisputeRow[] = (disputes || []) as DisputeRow[];
    const bookingIds = list.map((d) => d.booking_id).filter((v): v is string => typeof v === 'string');
    const bookingMap: Record<string, BookingView> = {};
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

        (bookings || []).forEach((b) => {
            const row = b as BookingJoin;
            bookingMap[row.id] = {
                id: row.id,
                service: { title: row?.service?.title || undefined },
                user: { full_name: row?.user?.full_name || undefined, email: row?.user?.email || undefined },
                expert: { full_name: row?.expert?.profile?.full_name || undefined, email: row?.expert?.profile?.email || undefined }
            };
        });
    }

    const enriched: AdminDispute[] = list.map((d) => ({
        ...d,
        booking: d.booking_id ? bookingMap[d.booking_id] : undefined
    }));

    return <DisputesClient initialDisputes={enriched} />;
}
