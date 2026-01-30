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

    // Delete from experts table
    const { error } = await supabase
        .from('experts')
        .delete()
        .eq('id', expertId);

    if (error) {
        console.error('Error deleting expert:', error);
        return { success: false, error: error.message };
    }

    // Also update profile role to 'client'? 
    // Usually good practice if they are no longer an expert.
    const { error: roleError } = await supabase
        .from('profiles')
        .update({ role: 'client' })
        .eq('id', expertId);

    if (roleError) {
        // Log but don't fail, primary deletion succeeded
        console.error('Error downgrading user role:', roleError);
    }

    // Notify expert about deletion/downgrade
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
            body: 'Tu perfil de experto fue eliminado y tu rol cambiado a cliente.',
            status: 'unread',
            created_by: user.id,
          });
    } catch {}

    revalidatePath('/admin/experts');
    return { success: true };
}
