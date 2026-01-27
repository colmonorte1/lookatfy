import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import BanksManager from '@/components/expert/BanksManager';
import { getMyBanks } from './actions';
import { ExpertSidebar } from '@/components/expert/ExpertSidebar';

export default async function ExpertBanksPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect('/login');
  }

  const banks = await getMyBanks();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '100% 1fr', minHeight: '100vh' }}>
      <ExpertSidebar />
      <main style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Bancos</h1>
          <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem' }}>
            Configura tus cuentas bancarias para recibir pagos.
          </p>
          <BanksManager initialBanks={banks} />
        </div>
      </main>
    </div>
  );
}

