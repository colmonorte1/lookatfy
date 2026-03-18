'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function completeOnboarding() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado' };

    const { error } = await supabase
        .from('experts')
        .update({ complete_setup: true })
        .eq('id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/expert');
    return { success: true };
}
