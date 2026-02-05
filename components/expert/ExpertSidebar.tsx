"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, User, Calendar, Clock, Briefcase, LogOut, DollarSign, AlertCircle, Wallet, Landmark } from 'lucide-react';
import styles from './ExpertSidebar.module.css';
import { createClient } from '@/utils/supabase/client';

const MENU_ITEMS = [
    { href: '/expert', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/expert/services', label: 'Mis Servicios', icon: Briefcase },
    { href: '/expert/earnings', label: 'Mis Ganancias', icon: DollarSign },
    { href: '/expert/withdrawals', label: 'Mis Retiros', icon: Wallet },
    { href: '/expert/bookings', label: 'Mis Reservas', icon: Calendar },
    { href: '/expert/schedule', label: 'Mis Horarios', icon: Clock },
    { href: '/expert/disputes', label: 'Disputas', icon: AlertCircle },
    { href: '/expert/profile', label: 'Mi Perfil', icon: User },
    { href: '/expert/banks', label: 'Bancos', icon: Landmark },
    //   { href: '/expert/settings', label: 'Configuración', icon: Settings },
];

export const ExpertSidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    // Listen to global toggle events from header
    // and close on route change
    useEffect(() => {
        const handler = () => setIsOpen(prev => !prev);
        window.addEventListener('dashboard:toggleSidebar', handler as EventListener);
        return () => {
            window.removeEventListener('dashboard:toggleSidebar', handler as EventListener);
        };
    }, []);

    // Intentionally avoid setState within effects per lint rule

    return (
        <>
        {/* Backdrop for mobile */}
        {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
        <aside id="dashboard-sidebar" className={`${styles.sidebar} ${isOpen ? styles.open : ''}`} role="navigation">
            <div className={styles.header}>
                <span className={styles.logo}>
                    Lookatfy
                    <span className={styles.badge}>Expert</span>
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
                <button className={styles.logoutBtn} onClick={handleLogout}>
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </aside>
        </>
    );
};
