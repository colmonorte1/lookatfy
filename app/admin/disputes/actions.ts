'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

// --- User/Expert Actions ---

export async function createDispute(data: {
    booking_id: string;
    reason: string;
    description: string;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Validate booking ownership
    const { data: booking } = await supabase
        .from('bookings')
        .select('user_id, expert_id')
        .eq('id', data.booking_id)
        .single();

    if (!booking) return { error: 'Booking not found' };

    // Allow both user and expert to open dispute 
    // (though mostly users, experts might dispute "client no show" for guaranteed payment if configured)
    if (booking.user_id !== user.id && booking.expert_id !== user.id) {
        return { error: 'Not authorized for this booking' };
    }

    const { error } = await supabase.from('disputes').insert({
        booking_id: data.booking_id,
        created_by: user.id,
        reason: data.reason,
        description: data.description,
        status: 'open'
    });

    if (error) {
        if (error.code === '23505') return { error: 'Ya existe una disputa para esta reserva.' };
        return { error: error.message };
    }

    revalidatePath('/user/bookings');
    revalidatePath('/expert/bookings');
    return { success: true };
}

// --- Admin Actions ---

export async function getDisputes() {
    const supabase = await createClient();

    // Check admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Verify Role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || profile?.role !== 'admin') {
        console.error("Access denied: User is not admin", profile, profileError);
        return [];
    }

    // Use Service Role if available to bypass RLS policies
    let adminClient = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
        try {
            const { createServerClient } = await import('@supabase/ssr');
            adminClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { cookies: { getAll: () => [], setAll: () => { } } }
            );
            console.log("Using Service Role for Admin Disputes fetch");
        } catch (e) {
            console.error("Failed to create admin client", e);
        }
    }

    // Fetch disputes with Booking and Users
    const { data: disputes, error } = await adminClient
        .from('disputes')
        .select(`
            *,
            booking:bookings (
                id, date, time, price, currency,
                service:services(title),
                user:profiles!user_id(full_name, email),
                expert:profiles!expert_id(full_name, email)
            ),
            reporter:profiles!created_by(full_name, role)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching disputes:', error);
        return [];
    }

    console.log("Admin Disputes Fetched:", disputes?.length);
    return disputes || [];
}

export async function resolveDispute(
    disputeId: string,
    resolution: { status: 'resolved_refunded' | 'resolved_dismissed'; resolution_notes: string; admin_notes?: string }
) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Verify Role manually
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

    if (profile?.role !== 'admin') return { error: 'Unauthorized' };

    // Use Service Role if available to bypass RLS policies
    let adminClient = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
        try {
            const { createServerClient } = await import('@supabase/ssr');
            adminClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { cookies: { getAll: () => [], setAll: () => { } } }
            );
        } catch (e) { console.error("Admin Client Error", e); }
    }

    const { error } = await adminClient
        .from('disputes')
        .update({
            status: resolution.status,
            resolution_notes: resolution.resolution_notes,
            admin_notes: resolution.admin_notes,
            updated_at: new Date().toISOString()
        })
        .eq('id', disputeId);

    if (error) return { error: error.message };

    revalidatePath('/admin/disputes');
    return { success: true };
}
