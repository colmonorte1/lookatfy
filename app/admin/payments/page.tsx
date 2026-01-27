import { createClient } from '@/utils/supabase/server';
import AdminPaymentsClient from '@/components/admin/AdminPaymentsClient';

export default async function AdminPaymentsPage() {
    const supabase = await createClient();

    // Fetch Bookings that represent payments (confirmed or completed)
    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
            *,
            user:profiles!user_id(full_name),
            expert:experts!expert_id(
                profile:profiles(full_name)
            )
        `)
        .in('status', ['confirmed', 'completed'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching payments:", error);
    }

    type TransactionRow = {
        id: string;
        price?: number | string;
        currency?: string;
        status: string;
        created_at?: string;
        date?: string;
        user?: { full_name?: string } | { full_name?: string }[];
        expert?: { profile?: { full_name?: string } } | { profile?: { full_name?: string } }[];
    };
    const transactions = (bookings || []) as TransactionRow[];

    const { data: disputes } = await supabase
        .from('disputes')
        .select('booking_id, status, created_at')
        .in('status', ['open', 'under_review']);
    const disputedBookingIds = new Set(((disputes || []) as { booking_id: string; status: string }[]).map(d => d.booking_id));

    const { data: settingsData } = await supabase
        .from('platform_settings')
        .select('commission_percentage')
        .single();

    const commissionRate = (Number(settingsData?.commission_percentage) || 10) / 100;
    const formattedTransactions = transactions.map(t => ({
        id: t.id,
        date: t.created_at || t.date || new Date().toISOString(),
        status: t.status,
        price: Number(t.price || 0),
        currency: t.currency || 'USD',
        userFullName: Array.isArray(t.user) ? t.user[0]?.full_name : t.user?.full_name,
        expertFullName: Array.isArray(t.expert) ? t.expert[0]?.profile?.full_name : t.expert?.profile?.full_name
    }));

    const totalVolume = formattedTransactions.reduce((sum, t) => sum + t.price, 0);
    const platformFees = totalVolume * commissionRate;
    const transactionCount = formattedTransactions.length;
    const disputesCount = formattedTransactions.filter(t => disputedBookingIds.has(t.id)).length;

    const formatMoney = (amount: number, currency = 'USD') => new Intl.NumberFormat('es-CO', { style: 'currency', currency }).format(amount);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Pagos y Transacciones</h1>
            </div>

            {/* Metrics Quick View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Volumen Total (Histórico)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{formatMoney(totalVolume)}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Comisiones Plataforma ({commissionRate * 100}%)</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'rgb(var(--success))' }}>{formatMoney(platformFees)}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Transacciones Exitosas</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}>{transactionCount}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Transacciones en disputa</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem', color: 'rgb(var(--error))' }}>{disputesCount}</div>
                </div>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden'
            }}>
                <AdminPaymentsClient 
                    transactions={formattedTransactions}
                    commissionRate={commissionRate}
                    disputedIds={Array.from(disputedBookingIds)}
                    disputes={(disputes || []) as { created_at: string; status: string }[]}
                />
            </div>
        </div>
    );
}
