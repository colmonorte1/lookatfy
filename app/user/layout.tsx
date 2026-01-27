import { UserSidebar } from '@/components/user/UserSidebar';
import styles from '@/components/layout/DashboardLayout.module.css';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { createClient } from '@/utils/supabase/server';

export default async function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userProfile = null;
    if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        userProfile = profile;
    }

    return (
        <div className={styles.layout}>
            <UserSidebar />
            <main className={styles.mainWrapper}>
                <DashboardHeader
                    userType="user"
                    userName={userProfile?.full_name || 'Usuario'}
                    avatar={userProfile?.avatar_url}
                    email={user?.email}
                />
                <div className={styles.contentContainer} suppressHydrationWarning>
                    {children}
                </div>
            </main>
        </div>
    );
}
