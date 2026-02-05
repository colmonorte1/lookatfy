import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ConfirmedClient from './ConfirmedClient';

export default async function ConfirmedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', user.id)
        .single();

    const role = profile?.role || 'client';
    const fullName = profile?.full_name || '';
    const dashboardUrl = role === 'admin' ? '/admin' : role === 'expert' ? '/expert' : '/user';

    return <ConfirmedClient fullName={fullName} dashboardUrl={dashboardUrl} role={role} />;
}
