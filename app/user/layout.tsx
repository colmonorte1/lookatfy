import { UserSidebar } from '@/components/user/UserSidebar';
import styles from '@/components/layout/DashboardLayout.module.css';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.layout}>
            <UserSidebar />
            <main className={styles.mainWrapper}>
                <DashboardHeader userType="user" userName="Usuario Demo" />
                <div className={styles.contentContainer} suppressHydrationWarning>
                    {children}
                </div>
            </main>
        </div>
    );
}
