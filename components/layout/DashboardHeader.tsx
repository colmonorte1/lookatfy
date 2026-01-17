import { Home, Bell, User } from 'lucide-react';
import Link from 'next/link';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
    userType?: 'admin' | 'expert' | 'user';
    userName?: string;
    avatar?: string;
}

export const DashboardHeader = ({ userType = 'user', userName = 'Usuario', avatar }: DashboardHeaderProps) => {

    // Mock role label map
    const roleLabel = {
        admin: 'Administrador',
        expert: 'Experto',
        user: 'Usuario'
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                {/* Left Side: Empty or Breadcrumbs potentially */}
                <div className={styles.left}>
                    {/* Placeholder for future breadcrumbs or title */}
                </div>

                {/* Right Side: Actions & Profile */}
                <div className={styles.right}>
                    <Link href="/" className={styles.iconButton} title="Ir al Inicio">
                        <Home size={20} />
                    </Link>

                    <button className={styles.iconButton} title="Notificaciones">
                        <Bell size={20} />
                        <span className={styles.badge}>2</span>
                    </button>

                    <div className={styles.profile}>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{userName}</span>
                            <span className={styles.userRole}>{roleLabel[userType]}</span>
                        </div>
                        <div className={styles.avatar}>
                            {avatar ? (
                                <img src={avatar} alt={userName} />
                            ) : (
                                <User size={20} color="white" />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
