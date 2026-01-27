'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type AdminWithdrawal = {
  id: string;
  expert_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'paid';
  requested_at: string;
  processed_at?: string | null;
  transaction_ref?: string | null;
  admin_notes?: string | null;
  bank_snapshot: {
    id: string;
    expert_id: string;
    bank: string;
    account_type: string;
    account_number: string;
    holder_name: string;
    document_id: string;
    created_at?: string;
  };
};

export type AdminWithdrawalDetail = {
  withdrawal: AdminWithdrawal;
  expert: { id: string; full_name?: string | null; email?: string | null };
  bookings: Array<{ id: string; price: number; date: string; time?: string | null; date_label: string; service_title?: string | null; user_full_name?: string | null }>;
  commission_rate: number;
  commission_amount: number;
  release_date: string;
  release_date_label: string;
  risk: { open_disputes: number; lost_disputes: number; fraud_flag: boolean };
};

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

export async function getAdminWithdrawals(): Promise<AdminWithdrawalDetail[]> {
  const adminClient = await getAdminClient();
  if (!adminClient) return [];

  const { data: raw } = await adminClient
    .from('withdrawals')
    .select('*')
    .order('requested_at', { ascending: false });

  const withdrawals = (raw || []) as AdminWithdrawal[];
  const expertIds = Array.from(new Set(withdrawals.map(w => w.expert_id)));

  const { data: experts } = await adminClient
    .from('profiles')
    .select('id, full_name, email')
    .in('id', expertIds);

  const { data: settingsData } = await adminClient
    .from('platform_settings')
    .select('commission_percentage')
    .single();
  const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;

  const details: AdminWithdrawalDetail[] = [];

  for (const w of withdrawals) {
    const expertList = (experts || []) as Array<{ id: string; full_name?: string | null; email?: string | null }>;
    const found = expertList.find(e => e.id === w.expert_id);
    const expert: { id: string; full_name?: string | null; email?: string | null } = found ? found : { id: w.expert_id };

    const { data: bookings } = await adminClient
      .from('bookings')
      .select('id, price, date, time, service:services(title), user:profiles!user_id(full_name)')
      .eq('expert_id', w.expert_id)
      .eq('status', 'completed')
      .order('date', { ascending: true });

    const { data: otherWithdrawals } = await adminClient
      .from('withdrawals')
      .select('amount, status, requested_at')
      .eq('expert_id', w.expert_id)
      .order('requested_at', { ascending: true });

    let consumed = (otherWithdrawals || [])
      .filter(o => o.requested_at < w.requested_at)
      .filter(o => ['pending', 'processing', 'approved', 'paid'].includes(String(o.status)))
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);

    let remaining = Number(w.amount) || 0;
    const associated: Array<{ id: string; price: number; date: string; time?: string | null; date_label: string; service_title?: string | null; user_full_name?: string | null }> = [];
    const pool = (bookings || []).map(b => {
      const d = new Date(String(b.date));
      const dateLabel = new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
        timeZone: 'America/Bogota'
      }).format(d);
      return {
        id: String(b.id),
        price: Number(b.price) || 0,
        date: String(b.date),
        time: (b as { time?: string | null }).time || null,
        date_label: dateLabel,
        service_title: (b as { service?: { title?: string | null } | null }).service?.title || null,
        user_full_name: (b as { user?: { full_name?: string | null } | null }).user?.full_name || null
      };
    });

    for (const b of pool) {
      if (consumed > 0) {
        consumed -= Math.min(consumed, b.price);
        continue;
      }
      if (remaining <= 0) break;
      associated.push(b);
      remaining -= b.price;
    }

    const commissionAmount = Number(w.amount) * commissionRate;
    const releaseDateObj = new Date(new Date(w.requested_at).getTime() + 48 * 60 * 60 * 1000);
    const releaseDate = releaseDateObj.toISOString();
    const releaseDateLabel = new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'America/Bogota'
    }).format(releaseDateObj);

    const { data: openDisputes } = await adminClient
      .from('disputes')
      .select('id, booking:bookings(expert_id)')
      .in('status', ['open', 'under_review']);

    const { data: lostDisputes } = await adminClient
      .from('disputes')
      .select('id, booking:bookings(expert_id)')
      .eq('status', 'resolved_refunded');

    const openForExpert = (openDisputes || []).filter(d => (d as { booking?: { expert_id?: string } }).booking?.expert_id === w.expert_id).length;
    const lostForExpert = (lostDisputes || []).filter(d => (d as { booking?: { expert_id?: string } }).booking?.expert_id === w.expert_id).length;
    const fraudFlag = lostForExpert >= 3;

    details.push({
      withdrawal: w,
      expert: { id: expert.id, full_name: expert.full_name, email: expert.email },
      bookings: associated,
      commission_rate: commissionRate,
      commission_amount: commissionAmount,
      release_date: releaseDate,
      release_date_label: releaseDateLabel,
      risk: { open_disputes: openForExpert, lost_disputes: lostForExpert, fraud_flag: fraudFlag }
    });
  }

  return details;
}

export async function approveWithdrawal(id: string, notes?: string) {
  const adminClient = await getAdminClient();
  if (!adminClient) return { error: 'Unauthorized' };
  const { error } = await adminClient
    .from('withdrawals')
    .update({ status: 'approved', admin_notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/withdrawals');
  return { success: true };
}

export async function markWithdrawalPaid(id: string, transactionRef: string) {
  const adminClient = await getAdminClient();
  if (!adminClient) return { error: 'Unauthorized' };
  if (!transactionRef || transactionRef.trim().length < 3) return { error: 'Referencia inválida' };
  const now = new Date().toISOString();
  const { error } = await adminClient
    .from('withdrawals')
    .update({ status: 'paid', transaction_ref: transactionRef, processed_at: now, updated_at: now })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/withdrawals');
  return { success: true };
}

export async function rejectWithdrawal(id: string, notes: string) {
  const adminClient = await getAdminClient();
  if (!adminClient) return { error: 'Unauthorized' };
  const { error } = await adminClient
    .from('withdrawals')
    .update({ status: 'rejected', admin_notes: notes || null, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/withdrawals');
  return { success: true };
}
