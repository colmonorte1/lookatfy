import { ExpertSidebar } from '@/components/expert/ExpertSidebar';
import styles from '@/components/layout/DashboardLayout.module.css';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

export default function ExpertLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={styles.layout}>
            <ExpertSidebar />
            <main className={styles.mainWrapper}>
                <DashboardHeader userType="expert" userName="Experto Demo" />
                <div className={styles.contentContainer}>
                    {children}
                </div>
            </main>
        </div>
    );
}
