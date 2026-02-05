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

    let serviceTypes: any[] = [];
    try {
        const { data } = await supabase.from('service_types').select('*').order('name');
        serviceTypes = data || [];
    } catch {}

    // Count services per category
    const categoriesWithCount = await Promise.all(
        (categories || []).map(async (cat: any) => {
            try {
                const { count } = await supabase
                    .from('services')
                    .select('id', { count: 'exact', head: true })
                    .eq('category', cat.slug);
                return { ...cat, service_count: count || 0 };
            } catch {
                return { ...cat, service_count: 0 };
            }
        })
    );

    // Count services per type
    const typesWithCount = await Promise.all(
        serviceTypes.map(async (t: any) => {
            try {
                const { count } = await supabase
                    .from('services')
                    .select('id', { count: 'exact', head: true })
                    .eq('service_type', t.slug);
                return { ...t, service_count: count || 0 };
            } catch {
                return { ...t, service_count: 0 };
            }
        })
    );

    return {
        countries: countries || [],
        currencies: currencies || [],
        categories: categoriesWithCount,
        service_types: typesWithCount
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

// --- Service Types Actions ---
export async function addServiceType(data: { name: string; slug?: string }) {
    const supabase = await createClient();
    const payload = { name: data.name, slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-') };
    const { error } = await supabase.from('service_types').insert(payload);
    if (error) {
        if (error.code === '23505') return { error: 'El tipo de servicio ya existe.' };
        return { error: error.message };
    }
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function deleteServiceType(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from('service_types').delete().eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}

export async function updateServiceType(id: string, data: { name: string; slug?: string }) {
    const supabase = await createClient();
    const payload = { name: data.name, slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-') };
    const { error } = await supabase.from('service_types').update(payload).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/settings');
    return { success: true };
}
