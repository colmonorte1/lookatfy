import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import UserProfileForm from './UserProfileForm';
import { LocalToastProvider } from '@/components/ui/Toast/Toast';

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

    return (
        <LocalToastProvider>
            <div style={{ maxWidth: '800px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mi Perfil</h1>
                <UserProfileForm user={profile} />
            </div>
        </LocalToastProvider>
    );
}
