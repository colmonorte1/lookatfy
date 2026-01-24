'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { BankAccount } from '../banks/actions';

export type Withdrawal = {
    id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'processing' | 'approved' | 'rejected' | 'paid';
    requested_at: string;
    processed_at?: string;
    transaction_ref?: string;
    admin_notes?: string;
    bank_snapshot: BankAccount;
};

export type FinancialSummary = {
    totalEarned: number;
    available: number;
    inDispute: number;
    paid: number;
    currency: string;
    commissionRate: number;
    availableNetPreview: number;
};

export async function getWithdrawalData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // 1. Fetch Completed Bookings (Income Source)
    const { data: bookings } = await supabase
        .from('bookings')
        .select('id, price, status')
        .eq('expert_id', user.id)
        .eq('status', 'completed');

    // 2. Fetch Disputes (Potential Deductions)
    // We need to know which completed bookings are currently under dispute (if any, though usually disputes happen before completion or reopen it)
    // Assuming disputes on completed bookings block withdrawal.
    const { data: disputes } = await supabase
        .from('disputes')
        .select('booking_id, status')
        .in('status', ['open', 'under_review']); // Only active disputes block funds

    // 3. Fetch Withdrawals (Outflows)
    const { data: withdrawals } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('expert_id', user.id)
        .order('requested_at', { ascending: false });

    // 4. Fetch Banks (For the form)
    const { data: banks } = await supabase
        .from('expert_banks')
        .select('*')
        .eq('expert_id', user.id);

    const allBookings = bookings || [];
    const allWithdrawals = (withdrawals || []) as Withdrawal[];
    const activeDisputes = disputes || [];
    const myBanks = banks || [];

    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('commission_percentage')
        .single();
    const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;

    // --- CALCULATIONS ---

    // A. Total Earned (Historical)
    const totalEarned = allBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    // B. In Dispute
    // Identify bookings that are in the dispute list
    const disputedBookingIds = new Set(activeDisputes.map(d => d.booking_id));
    const inDispute = allBookings
        .filter(b => disputedBookingIds.has(b.id))
        .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    // C. Paid (Already withdrawn and processed)
    const paid = allWithdrawals
        .filter(w => w.status === 'paid')
        .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // D. Pending/Processing/Approved (Locked funds)
    const lockedInWithdrawals = allWithdrawals
        .filter(w => ['pending', 'processing', 'approved'].includes(w.status))
        .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    // E. Available
    // Available = Total - InDispute - (Paid + PendingWithdrawals)
    // Note: Rejected withdrawals are ignored (money returns to pool)
    const available = totalEarned - inDispute - paid - lockedInWithdrawals;
    const availableNetPreview = Math.max(0, available - available * commissionRate);

    return {
        summary: {
            totalEarned,
            available: Math.max(0, available),
            inDispute,
            paid,
            currency: 'COP',
            commissionRate,
            availableNetPreview
        },
        withdrawals: allWithdrawals,
        banks: myBanks
    };
}

export async function requestWithdrawal(amount: number, bankId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };
    if (amount <= 0) return { error: 'Monto inválido' };

    // 1. Re-verify availability (Security check)
    const { summary, banks } = await getWithdrawalData();
    if (amount > summary.available) {
        return { error: 'Saldo insuficiente' };
    }

    // 2. Get Bank Details to snapshot
    const bank = banks.find(b => b.id === bankId);
    if (!bank) return { error: 'Banco no encontrado' };

    // 3. Create Withdrawal Request
    const { error } = await supabase
        .from('withdrawals')
        .insert({
            expert_id: user.id,
            amount,
            currency: summary.currency,
            status: 'pending',
            bank_snapshot: bank, // Store full bank object as JSON
            requested_at: new Date().toISOString()
        });

    if (error) return { error: error.message };

    revalidatePath('/expert/withdrawals');
    return { success: true };
}
