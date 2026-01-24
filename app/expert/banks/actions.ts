'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type BankAccount = {
  id: string;
  expert_id: string;
  bank: string;
  account_type: string;
  account_number: string;
  holder_name: string;
  document_id: string;
  created_at?: string;
};

export async function getMyBanks(): Promise<BankAccount[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from('expert_banks')
    .select('*')
    .eq('expert_id', user.id)
    .order('created_at', { ascending: false });
  return (data || []) as BankAccount[];
}

export type ActionResult = { success: true } | { error: string };

export async function createBank(input: Omit<BankAccount, 'id' | 'expert_id' | 'created_at'>): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  const { error } = await supabase
    .from('expert_banks')
    .insert([{ expert_id: user.id, ...input }]);
  if (error) return { error: error.message };
  revalidatePath('/expert/banks');
  return { success: true };
}

export async function updateBank(id: string, input: Partial<Omit<BankAccount, 'id' | 'expert_id' | 'created_at'>>): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  const { error } = await supabase
    .from('expert_banks')
    .update({ ...input })
    .eq('id', id)
    .eq('expert_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/expert/banks');
  return { success: true };
}

export async function deleteBank(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };
  const { error } = await supabase
    .from('expert_banks')
    .delete()
    .eq('id', id)
    .eq('expert_id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/expert/banks');
  return { success: true };
}
