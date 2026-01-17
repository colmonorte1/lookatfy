import { Sidebar } from '@/components/admin/Sidebar';
import styles from '@/components/layout/DashboardLayout.module.css';
import { DashboardHeader } from '@/components/layout/DashboardHeader';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={styles.layout}>
            <Sidebar />
            <main className={styles.mainWrapper}>
                <DashboardHeader userType="admin" userName="Administrador" />
                <div className={styles.contentContainer}>
                    {children}
                </div>
            </main>
        </div>
    );
}
