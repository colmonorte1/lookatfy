'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getPlatformSettings() {
    const supabase = await createClient();
    const { data: settings } = await supabase
        .from('platform_settings')
        .select('*')
        .single();

    return settings;
}

export async function updatePlatformSettings(formData: any) {
    const supabase = await createClient();

    // Check Authorization (Double check, though RLS handles it)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Use Upsert to handle both Create and Update in one go
    const { error } = await supabase
        .from('platform_settings')
        .upsert({
            id: 1, // Always ID 1
            commission_percentage: formData.platformFee,
            min_withdrawal: formData.minWithdrawal,
            currency: formData.currency,
            support_email: formData.supportEmail,
            auto_approve_services: formData.autoApproveServices,
            auto_verify_experts: formData.autoVerifyExperts,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error("Error saving settings:", error);
        return { error: error.message };
    }

    revalidatePath('/admin/settings');
    revalidatePath('/admin/payments');
    return { success: true };
}

// --- Master Data Actions ---

export async function getMasterData() {
    const supabase = await createClient();

    const { data: countries } = await supabase.from('active_countries').select('*').order('name');
    const { data: currencies } = await supabase.from('active_currencies').select('*').order('name');
    const { data: categories } = await supabase.from('service_categories').select('*').order('name');

    // Count services per category manually if join not supported or complex
    // Or we can just return categories and handle count in UI or separate query.
    // The previous mock had 'count'. Let's try to get it via count join or just ignore for now.

    return {
        countries: countries || [],
        currencies: currencies || [],
        categories: categories || []
    };
}

export async function addCountry(data: { code: string; name: string }) {
    const supabase = await createClient();
    const { error } = await supabase.from('active_countries').insert(data);
    if (error) {
        if (error.code === '23505') return { error: 'El código de país ya existe.' };
        return { error: error.message };
    }
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function deleteCountry(code: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('active_countries').delete().eq('code', code);
    if (error) return { error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function addCurrency(data: { code: string; name: string; symbol: string }) {
    const supabase = await createClient();
    const { error } = await supabase.from('active_currencies').insert(data);
    if (error) {
        if (error.code === '23505') return { error: 'El código de moneda ya existe.' };
        return { error: error.message };
    }
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function deleteCurrency(code: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('active_currencies').delete().eq('code', code);
    if (error) return { error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function addCategory(data: { name: string; slug: string; icon?: string }) {
    const supabase = await createClient();
    const { error } = await supabase.from('service_categories').insert(data);
    if (error) {
        if (error.code === '23505') return { error: 'El nombre o identificador (slug) de la categoría ya existe.' };
        return { error: error.message };
    }
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function deleteCategory(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('service_categories').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}
