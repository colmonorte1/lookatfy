import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import RecordingsGrid from './RecordingsGrid';

export default async function UserRecordingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { data: rows } = await supabase
    .from('recordings')
    .select(`
      *,
      booking:bookings!booking_id(
        id,
        date,
        time,
        service:services!service_id(title, duration),
        expert:experts!expert_id(
          profile:profiles(full_name)
        )
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const recordings = rows || [];

  const name = profile?.full_name || 'Tu perfil';

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Mis grabaciones</h1>
        <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>{name}</p>
      </div>

      <RecordingsGrid userId={user.id} />
    </div>
  );
}
