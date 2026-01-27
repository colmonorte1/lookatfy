import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export default async function ExpertProfileSettingsPage() {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect('/login');
    }

    // Fetch Profile Data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    // Fetch Expert Data
    const { data: expert } = await supabase
        .from('experts')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div style={{ maxWidth: '100%' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mi Perfil Público</h1>
            <ProfileForm user={profile} expert={expert} />
        </div>
    );
}
