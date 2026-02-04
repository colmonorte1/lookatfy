'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleExpertVerification(expertId: string, currentStatus: boolean): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Check Admin Role (Double check on server side)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { success: false, error: 'Forbidden' };

    const { error } = await supabase
        .from('experts')
        .update({ verified: !currentStatus })
        .eq('id', expertId);

    if (error) {
        console.error('Error toggling expert status:', error);
        return { success: false, error: error.message };
    }

    // Notify expert about verification status change
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
            recipient_user_id: expertId,
            type: !currentStatus ? 'expert_verified' : 'expert_unverified',
            title: !currentStatus ? 'Verificación aprobada' : 'Verificación desactivada',
            body: !currentStatus ? 'Tu perfil de experto ha sido verificado.' : 'Tu verificación fue desactivada por un administrador.',
            status: 'unread',
            created_by: user.id,
          });
    } catch {}

    revalidatePath('/admin/experts');
    revalidatePath(`/admin/experts/${expertId}`);
    return { success: true };
}

export async function deleteExpert(expertId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Check Admin Role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { success: false, error: 'Forbidden' };

    // Soft delete: set deleted_at timestamp and deleted_by
    const { error } = await supabase
        .from('experts')
        .update({
            deleted_at: new Date().toISOString(),
            deleted_by: user.id
        })
        .eq('id', expertId);

    if (error) {
        console.error('Error deleting expert:', error);
        return { success: false, error: error.message };
    }

    // Update profile role to 'client' (expert is no longer active)
    const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'client' })
        .eq('id', expertId);

    if (roleError) {
        console.error('Error downgrading user role:', roleError);
    }

    // Notify expert about deletion
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
            recipient_user_id: expertId,
            type: 'expert_deleted',
            title: 'Perfil de experto eliminado',
            body: 'Tu perfil de experto fue eliminado. Contacta al administrador si tienes dudas.',
            status: 'unread',
            created_by: user.id,
          });
    } catch {}

    revalidatePath('/admin/experts');
    return { success: true };
}

export async function restoreExpert(expertId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();

    // Check Admin Role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { success: false, error: 'Forbidden' };

    // Restore: clear deleted_at and deleted_by
    const { error } = await supabase
        .from('experts')
        .update({
            deleted_at: null,
            deleted_by: null
        })
        .eq('id', expertId);

    if (error) {
        console.error('Error restoring expert:', error);
        return { success: false, error: error.message };
    }

    // Restore profile role to 'expert'
    const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'expert' })
        .eq('id', expertId);

    if (roleError) {
        console.error('Error restoring user role:', roleError);
    }

    // Notify expert about restoration
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
            recipient_user_id: expertId,
            type: 'expert_restored',
            title: 'Perfil de experto restaurado',
            body: 'Tu perfil de experto ha sido restaurado.',
            status: 'unread',
            created_by: user.id,
          });
    } catch {}

    revalidatePath('/admin/experts');
    revalidatePath(`/admin/experts/${expertId}`);
    return { success: true };
}
