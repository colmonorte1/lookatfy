import { ExpertSidebar } from '@/components/expert/ExpertSidebar';
import styles from '@/components/layout/DashboardLayout.module.css';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { createClient } from '@/utils/supabase/server';

export default async function ExpertLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let userProfile = null;
    if (user) {
        // Experts table extends profiles, or we might need to join or fetch from experts table if specific data needed
        // But headers use common fields (name, avatar) which are likely in profiles too (if synchronized) or we fetch from experts.
        // Assuming experts have profile entry or consistent fields. 
        // Based on schema, expert linked to profile. Let's fetch profile for consistency in header.
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        userProfile = profile;
    }

    return (
        <div className={styles.layout}>
            <ExpertSidebar />
            <main className={styles.mainWrapper}>
                <DashboardHeader
                    userType="expert"
                    userName={userProfile?.full_name || 'Experto'}
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
