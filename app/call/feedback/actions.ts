'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitReview(prevState: unknown, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const bookingId = formData.get('bookingId') as string;
    const rating = Number(formData.get('rating'));
    const comment = formData.get('comment') as string;
    const subjectId = formData.get('subjectId') as string;
    const redirectPath = formData.get('redirectPath') as string | null;

    if (!bookingId || !rating || !subjectId) {
        return { error: 'Faltan datos requeridos' };
    }

    const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingId)
        .eq('reviewer_id', user.id)
        .limit(1);

    if (existing && existing.length > 0) {
        return { error: 'Ya calificaste esta sesión.' };
    }

    const { error } = await supabase
        .from('reviews')
        .insert({
            booking_id: bookingId,
            reviewer_id: user.id,
            subject_id: subjectId,
            rating,
            comment
        });

    if (error) {
        console.error('Submit review error:', error);
        if (error?.code === '23505') {
            return { error: 'Ya calificaste esta sesión.' };
        }
        return { error: 'Error al guardar la calificación.' };
    }

    if (redirectPath) {
        revalidatePath(redirectPath);
    }
    return { success: true };
}
