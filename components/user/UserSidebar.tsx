"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, User, Calendar, Search, LogOut, Settings, Video, CreditCard } from 'lucide-react';
import styles from '../expert/ExpertSidebar.module.css'; // Reusing expert sidebar styles for consistency

const MENU_ITEMS = [
    { href: '/user', label: 'Inicio', icon: Home },
    { href: '/experts', label: 'Explorar Expertos', icon: Search },
    { href: '/user/bookings', label: 'Mis Reservas', icon: Calendar },
    { href: '/user/recordings', label: 'Mis Grabaciones', icon: Video },
    { href: '/user/payments', label: 'Pagos', icon: CreditCard },
    { href: '/user/profile', label: 'Mi Perfil', icon: User },
];

export const UserSidebar = () => {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <span className={styles.logo}>
                    Lookatfy
                    {/* Different badge color for user? Let's keep it simple or remove badge */}
                </span>
            </div>

            <nav className={styles.nav}>
                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.item} ${isActive ? styles.active : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className={styles.footer}>
                <button className={styles.logoutBtn}>
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
    );
};
