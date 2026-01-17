"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Video, Settings, LogOut, ShoppingBag, DollarSign, Wallet, ShieldAlert } from 'lucide-react';
import styles from './Sidebar.module.css';

const MENU_ITEMS = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
    { href: '/admin/experts', label: 'Expertos', icon: Video },
    { href: '/admin/services', label: 'Catálogo', icon: ShoppingBag },
    { href: '/admin/payments', label: 'Pagos', icon: DollarSign },
    { href: '/admin/withdrawals', label: 'Retiros', icon: Wallet },
    { href: '/admin/disputes', label: 'Disputas', icon: ShieldAlert },
    { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export const Sidebar = () => {
    const pathname = usePathname();

    return (
        <aside className={styles.sidebar}>
            <div className={styles.header}>
                <span className={styles.logo}>Lookatfy<span className={styles.badge}>Admin</span></span>
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
