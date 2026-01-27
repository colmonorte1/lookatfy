'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getAdminServices() {
  const supabase = await createClient();
  const { data } = await supabase.from('admin_services').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function getCountries() {
  const supabase = await createClient();
  const { data } = await supabase.from('active_countries').select('*').order('name');
  return data || [];
}

export async function getCurrentRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { role: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return { role: profile?.role || null };
}

async function getAdminClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return supabase;
  try {
    const { createServerClient } = await import('@supabase/ssr');
    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { cookies: { getAll: () => [], setAll: () => { } } }
    );
    return adminClient as unknown as ReturnType<typeof createClient>;
  } catch {
    return supabase;
  }
}

export async function createAdminService(payload: { name: string; description?: string; price: number; country_code?: string; active?: boolean; recording_enabled?: boolean }) {
  const adminClient = await getAdminClient();
  if (!adminClient) return { error: 'Unauthorized' };

  const { error } = await adminClient.from('admin_services').insert({
    name: payload.name,
    description: payload.description || null,
    price: payload.price,
    country_code: payload.country_code || null,
    active: payload.active ?? true,
    recording_enabled: payload.recording_enabled ?? false,
  });
  if (error) return { error: error.message };
  revalidatePath('/admin/services');
  return { success: true };
}

export async function toggleAdminServiceActive(id: string, active: boolean) {
  const adminClient = await getAdminClient();
  if (!adminClient) return { error: 'Unauthorized' };
  const { error } = await adminClient.from('admin_services').update({ active }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/services');
  return { success: true };
}

export async function deleteAdminService(id: string) {
  const adminClient = await getAdminClient();
  if (!adminClient) return { error: 'Unauthorized' };
  const { error } = await adminClient.from('admin_services').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/services');
  return { success: true };
}
