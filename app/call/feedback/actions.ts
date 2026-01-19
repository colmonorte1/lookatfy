'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function submitReview(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'No autorizado' };
    }

    const bookingId = formData.get('bookingId') as string;
    const rating = Number(formData.get('rating'));
    const comment = formData.get('comment') as string;
    const subjectId = formData.get('subjectId') as string; // Who we are rating

    if (!bookingId || !rating || !subjectId) {
        return { error: 'Faltan datos requeridos' };
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
        return { error: 'Error al guardar la calificación. Tal vez ya calificaste esta sesión.' };
    }

    // TODO: Update Expert Rating Aggregate (Optional for MVP, trigger is better)

    return { success: true };
}
