import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import UserProfileForm from './UserProfileForm';

export default async function UserProfilePage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    const { data: recordings } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    return (
        <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mi Perfil</h1>
            <UserProfileForm user={profile} />
            <div style={{ marginTop: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Mis Grabaciones</h2>
                {(!recordings || recordings.length === 0) ? (
                    <div style={{ padding: '1rem', border: '1px solid rgb(var(--border))', borderRadius: '8px', color: 'rgb(var(--text-secondary))' }}>
                        No hay grabaciones disponibles por el momento.
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {recordings.map((r: any) => (
                            <div key={r.id} style={{ border: '1px solid rgb(var(--border))', borderRadius: '8px', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div style={{ fontWeight: 600 }}>{r.room_name || 'Sala'}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                        {new Date(r.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {r.storage_url ? (
                                    <video src={r.storage_url} controls style={{ width: '100%', borderRadius: '8px' }} />
                                ) : (
                                    <div style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>
                                        Archivo en procesamiento o pendiente de URL.
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
