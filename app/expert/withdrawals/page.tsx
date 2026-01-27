import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { ExpertSidebar } from '@/components/expert/ExpertSidebar';
import WithdrawalModule from '@/components/expert/WithdrawalModule';
import { getWithdrawalData } from './actions';

export default async function ExpertWithdrawalsPage() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Fetch all required data
    const { summary, withdrawals, banks } = await getWithdrawalData();

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '100% 1fr', minHeight: '100vh' }}>
            <ExpertSidebar />
            <main style={{ padding: '2rem' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Mis Retiros</h1>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem' }}>
                        Gestiona tus ganancias y solicita transferencias a tus cuentas bancarias.
                    </p>
                    
                    <WithdrawalModule 
                        summary={summary} 
                        withdrawals={withdrawals} 
                        banks={banks} 
                    />
                </div>
            </main>
        </div>
    );
}
