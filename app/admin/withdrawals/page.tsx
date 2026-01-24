import { createClient } from '@/utils/supabase/server';
import { getAdminWithdrawals } from './actions';
import AdminWithdrawalsList from '@/components/admin/AdminWithdrawalsList';

export default async function AdminWithdrawalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div>No autenticado</div>;

  const details = await getAdminWithdrawals();

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Solicitudes de Retiro</h1>

      <AdminWithdrawalsList items={details} />
    </div>
  );
}
