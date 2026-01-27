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

    revalidatePath('/admin/experts');
    return { success: true };
}
