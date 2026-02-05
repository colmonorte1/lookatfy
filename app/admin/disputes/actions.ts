'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendEmail } from '@/lib/email/brevo';
import { disputeOpenedTemplate, disputeResolvedTemplate } from '@/lib/email/templates';

// --- User/Expert Actions ---

export async function createDispute(data: {
    booking_id: string;
    reason: string;
    description: string;
    attachments?: string[];
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Validate booking ownership
    const { data: booking } = await supabase
        .from('bookings')
        .select('user_id, expert_id, date, time')
        .eq('id', data.booking_id)
        .single();

    if (!booking) return { error: 'Booking not found' };

    // Allow both user and expert to open dispute 
    // (though mostly users, experts might dispute "client no show" for guaranteed payment if configured)
    if (booking.user_id !== user.id && booking.expert_id !== user.id) {
        return { error: 'Not authorized for this booking' };
    }

    // Enforce 24h window from scheduled start
    try {
        const startIso = `${booking.date}T${String(booking.time || '00:00:00')}`;
        const startTs = new Date(startIso).getTime();
        const nowTs = Date.now();
        const diff = nowTs - startTs;
        const limit = 24 * 60 * 60 * 1000;
        if (!Number.isNaN(startTs) && diff > limit) {
            return { error: 'La ventana de reporte de 24h ha expirado.' };
        }
    } catch {}

    const { error } = await supabase.from('disputes').insert({
        booking_id: data.booking_id,
        created_by: user.id,
        reason: data.reason,
        description: data.description,
        status: 'open',
        user_attachments: data.attachments && data.attachments.length ? data.attachments : null
    });

    if (error) {
        if (error.code === '23505') return { error: 'Ya existe una disputa para esta reserva.' };
        return { error: error.message };
    }

    // Notify admins about new dispute (broadcast)
    try {
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || '';
        let writeClient = supabase;
        if (serviceRoleKey) {
            const { createServerClient } = await import('@supabase/ssr');
            writeClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { cookies: { getAll: () => [], setAll: () => { } } }
            );
        }
        await writeClient.from('notifications').insert({
            target_role: 'admin',
            type: 'dispute_opened',
            title: 'Nueva disputa abierta',
            body: `Se abrió una disputa para la reserva ${data.booking_id}.`,
            data: { booking_id: data.booking_id },
            status: 'unread',
            created_by: user.id,
        });
        // Send email to admins
        const { data: admins } = await writeClient.from('profiles').select('email, full_name').eq('role', 'admin');
        if (admins) {
            const bookingDate = `${booking.date} ${booking.time || ''}`.trim();
            for (const admin of admins) {
                if (admin.email) {
                    const html = disputeOpenedTemplate({ recipientName: admin.full_name || 'Admin', bookingDate, reason: data.reason, role: 'admin' });
                    await sendEmail({ to: admin.email, subject: 'Nueva disputa abierta', html }).catch(() => {});
                }
            }
        }
    } catch {}

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

// Signed upload URL for disputes evidence (bypasses RLS safely via Service Role)
export async function getDisputeEvidenceSignedUpload(path: string): Promise<{ token?: string; error?: string }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Only allow uploading to the caller's own folder
    if (!path.startsWith(`${user.id}/`)) return { error: 'Path not allowed' };

    let adminClient = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY || '';
    if (serviceRoleKey) {
        try {
            const { createServerClient } = await import('@supabase/ssr');
            adminClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { cookies: { getAll: () => [], setAll: () => { } } }
            );
        } catch (e) {
            console.error('Failed to init Service Role client for signed upload', e);
        }
    }

    const { data, error } = await adminClient
        .storage
        .from('disputes-evidence')
        .createSignedUploadUrl(path, { upsert: true });

    if (error) return { error: error.message };
    const payload = data as { token?: string; signedUrl?: string } | null;
    return { token: payload?.token };
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
    const serviceRoleKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

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

    // Optional second update for audit fields (ignore if columns don't exist)
    try {
        await adminClient
            .from('disputes')
            .update({
                resolved_by: user?.id || null,
                resolved_at: new Date().toISOString()
            })
            .eq('id', disputeId);
    } catch (e) {
        // noop: column might not exist yet in target DB
        console.warn('Audit columns update skipped', e);
    }

    revalidatePath('/admin/disputes');

    // Notify participants with resolution
    try {
        const { data: row } = await adminClient
            .from('disputes')
            .select('booking_id, resolution_notes')
            .eq('id', disputeId)
            .single();
        if (row?.booking_id) {
            const { data: booking } = await adminClient
                .from('bookings')
                .select('user_id, expert_id, date, time')
                .eq('id', row.booking_id)
                .single();
            if (booking) {
                await adminClient.from('notifications').insert([
                    {
                        recipient_user_id: booking.user_id,
                        type: 'dispute_resolved',
                        title: 'Tu disputa ha sido resuelta',
                        body: String(resolution.resolution_notes || ''),
                        data: { booking_id: row.booking_id },
                        status: 'unread',
                        created_by: user?.id || null,
                    },
                    {
                        recipient_user_id: booking.expert_id,
                        type: 'dispute_resolved',
                        title: 'Disputa resuelta',
                        body: String(resolution.resolution_notes || ''),
                        data: { booking_id: row.booking_id },
                        status: 'unread',
                        created_by: user?.id || null,
                    }
                ]);
                // Send dispute resolved emails
                const { data: userProfile } = await adminClient.from('profiles').select('email, full_name').eq('id', booking.user_id).single();
                const { data: expertProfile } = await adminClient.from('profiles').select('email, full_name').eq('id', booking.expert_id).single();
                if (userProfile?.email) {
                    const html = disputeResolvedTemplate({ recipientName: userProfile.full_name || 'Usuario', resolution: resolution.status, resolutionNotes: resolution.resolution_notes, role: 'user' });
                    await sendEmail({ to: userProfile.email, subject: 'Tu disputa ha sido resuelta', html }).catch(() => {});
                }
                if (expertProfile?.email) {
                    const html = disputeResolvedTemplate({ recipientName: expertProfile.full_name || 'Experto', resolution: resolution.status, resolutionNotes: resolution.resolution_notes, role: 'expert' });
                    await sendEmail({ to: expertProfile.email, subject: 'Disputa resuelta', html }).catch(() => {});
                }
            }
        }
    } catch {}
    return { success: true };
}

export async function addUserEvidence(disputeId: string, attachments: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Fetch dispute to enforce 24h window client-side too
    const { data: dispute, error: fetchError } = await supabase
        .from('disputes')
        .select('id, created_at, user_attachments')
        .eq('id', disputeId)
        .single();

    if (fetchError || !dispute) return { error: 'Dispute not found' };

    try {
        const createdTs = new Date(String(dispute.created_at)).getTime();
        const nowTs = Date.now();
        const limit = 24 * 60 * 60 * 1000;
        if (!Number.isNaN(createdTs) && nowTs - createdTs > limit) {
            return { error: 'La ventana de 24h para adjuntar evidencia ha expirado.' };
        }
    } catch {}

    const existing: string[] = Array.isArray(dispute.user_attachments) ? dispute.user_attachments : [];
    const merged = [...existing, ...attachments.filter((p) => p.startsWith(`${user.id}/`))];

    let writeClient = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        try {
            const { createServerClient } = await import('@supabase/ssr');
            writeClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { cookies: { getAll: () => [], setAll: () => { } } }
            );
        } catch {}
    }

    const { error } = await writeClient
        .from('disputes')
        .update({ user_attachments: merged, updated_at: new Date().toISOString() })
        .eq('id', disputeId);

    if (error) return { error: error.message };
    revalidatePath('/user/disputes');
    return { success: true };
}

export async function addExpertEvidence(disputeId: string, attachments: string[]) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    type Row = { id: string; created_at: string; expert_attachments: string[] | null };
    const { data: dispute, error: fetchError } = await supabase
        .from('disputes')
        .select('id, created_at, expert_attachments')
        .eq('id', disputeId)
        .single();

    if (fetchError || !dispute) return { error: 'Dispute not found' };

    try {
        const createdTs = new Date(String((dispute as Row).created_at)).getTime();
        const nowTs = Date.now();
        const limit = 24 * 60 * 60 * 1000;
        if (!Number.isNaN(createdTs) && nowTs - createdTs > limit) {
            return { error: 'La ventana de 24h para adjuntar evidencia ha expirado.' };
        }
    } catch {}

    const existing: string[] = Array.isArray((dispute as Row).expert_attachments) ? ((dispute as Row).expert_attachments as string[]) : [];
    const merged = [...existing, ...attachments.filter((p) => p.startsWith(`${user.id}/`))];

    let writeClient = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        try {
            const { createServerClient } = await import('@supabase/ssr');
            writeClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { cookies: { getAll: () => [], setAll: () => { } } }
            );
        } catch {}
    }

    const { error } = await writeClient
        .from('disputes')
        .update({ expert_attachments: merged, updated_at: new Date().toISOString() })
        .eq('id', disputeId);

    if (error) return { error: error.message };
    revalidatePath('/expert/disputes');
    return { success: true };
}

export async function addExpertResponse(disputeId: string, responseText: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    let readClient = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        try {
            const { createServerClient } = await import('@supabase/ssr');
            readClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { cookies: { getAll: () => [], setAll: () => { } } }
            );
        } catch {}
    }

    const { data: row, error: err1 } = await readClient
        .from('disputes')
        .select('id, created_at, booking_id, expert_response')
        .eq('id', disputeId)
        .single();
    if (err1 || !row) return { error: err1?.message || 'Dispute not found' };

    if (row.expert_response && row.expert_response.length > 0) {
        return { error: 'Ya enviaste una respuesta. No puedes enviar otra.' };
    }

    const { data: booking, error: err2 } = await readClient
        .from('bookings')
        .select('expert_id')
        .eq('id', row.booking_id)
        .single();
    if (err2 || !booking || booking.expert_id !== user.id) return { error: err2?.message || 'Not authorized' };

    try {
        const createdTs = new Date(String(row.created_at)).getTime();
        const nowTs = Date.now();
        const limit = 24 * 60 * 60 * 1000;
        if (!Number.isNaN(createdTs) && nowTs - createdTs > limit) {
            return { error: 'La ventana de 24h para responder ha expirado.' };
        }
    } catch {}

    const text = (responseText || '').trim();
    if (text.length < 3) return { error: 'La respuesta es muy corta.' };
    if (text.length > 4000) return { error: 'La respuesta es demasiado larga.' };

    const { error } = await supabase
        .from('disputes')
        .update({ expert_response: text, updated_at: new Date().toISOString() })
        .eq('id', disputeId);
    if (error) return { error: error.message };
    revalidatePath('/expert/disputes');
    revalidatePath('/admin/disputes');
    revalidatePath('/user/disputes');
    return { success: true };
}

export async function addUserResponse(disputeId: string, responseText: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    let readClient = supabase;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        try {
            const { createServerClient } = await import('@supabase/ssr');
            readClient = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                { cookies: { getAll: () => [], setAll: () => { } } }
            );
        } catch {}
    }

    const { data: row, error: err1 } = await readClient
        .from('disputes')
        .select('id, created_at, booking_id, user_response')
        .eq('id', disputeId)
        .single();
    if (err1 || !row) return { error: err1?.message || 'Dispute not found' };

    if (row.user_response && row.user_response.length > 0) {
        return { error: 'Ya enviaste una respuesta. No puedes enviar otra.' };
    }

    const { data: booking, error: err2 } = await readClient
        .from('bookings')
        .select('user_id')
        .eq('id', row.booking_id)
        .single();
    if (err2 || !booking || booking.user_id !== user.id) return { error: err2?.message || 'Not authorized' };

    try {
        const createdTs = new Date(String(row.created_at)).getTime();
        const nowTs = Date.now();
        const limit = 24 * 60 * 60 * 1000;
        if (!Number.isNaN(createdTs) && nowTs - createdTs > limit) {
            return { error: 'La ventana de 24h para responder ha expirado.' };
        }
    } catch {}

    const text = (responseText || '').trim();
    if (text.length < 3) return { error: 'La respuesta es muy corta.' };
    if (text.length > 4000) return { error: 'La respuesta es demasiado larga.' };

    const { error } = await supabase
        .from('disputes')
        .update({ user_response: text, updated_at: new Date().toISOString() })
        .eq('id', disputeId);
    if (error) return { error: error.message };
    revalidatePath('/expert/disputes');
    revalidatePath('/admin/disputes');
    revalidatePath('/user/disputes');
    return { success: true };
}
