import { Sidebar } from '@/components/admin/Sidebar';
import styles from '@/components/layout/DashboardLayout.module.css';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { createClient } from '@/utils/supabase/server';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userProfile = null;
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        userProfile = profile;
    }

    // Default to admin fallback if no user found (though admin page likely protected by middleware/layout)
    // But for header we want real data.

    return (
        <div className={styles.layout}>
            <Sidebar />
            <main className={styles.mainWrapper}>
                <DashboardHeader
                    userType={userProfile?.role || 'user'}
                    userName={userProfile?.full_name || 'Usuario'}
                    avatar={userProfile?.avatar_url}
                    email={user?.email}
                />
                <div className={styles.contentContainer}>
                    {children}
                </div>
            </main>
        </div>
    );
}
