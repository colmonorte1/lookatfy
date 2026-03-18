import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ExpertRecordingsGrid from './ExpertRecordingsGrid';

export default async function ExpertRecordingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Mis grabaciones</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>
                    Grabaciones de tus sesiones completadas con clientes.
                </p>
            </div>
            <ExpertRecordingsGrid expertId={user.id} />
        </div>
    );
}
