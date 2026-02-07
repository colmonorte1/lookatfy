"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, Video, Settings, LogOut, ShoppingBag, DollarSign, Wallet, ShieldAlert, MonitorPlay } from 'lucide-react';
import styles from './Sidebar.module.css';
import { createClient } from '@/utils/supabase/client';

const MENU_ITEMS = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Usuarios', icon: Users },
    { href: '/admin/sessions', label: 'Sesiones', icon: MonitorPlay },
    { href: '/admin/experts', label: 'Expertos', icon: Video },
    { href: '/admin/services', label: 'Catálogo', icon: ShoppingBag },
    { href: '/admin/payments', label: 'Pagos', icon: DollarSign },
    { href: '/admin/withdrawals', label: 'Retiros', icon: Wallet },
    { href: '/admin/disputes', label: 'Disputas', icon: ShieldAlert },
    { href: '/admin/settings', label: 'Configuración', icon: Settings },
];

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    useEffect(() => {
        const handler = () => setIsOpen(prev => !prev);
        window.addEventListener('dashboard:toggleSidebar', handler as EventListener);
        return () => window.removeEventListener('dashboard:toggleSidebar', handler as EventListener);
    }, []);

    // Intentionally avoid setState within effects per lint rule

    return (
        <>
            {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
            <aside id="dashboard-sidebar" className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} role="navigation">
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
                    <button className={styles.logoutBtn} onClick={handleLogout}>
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
