"use client";

import { Home, Bell, User, LogOut, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
    userType?: 'admin' | 'expert' | 'user';
    userName?: string;
    avatar?: string;
    email?: string; // Added email for dropdown context potentially
}

export const DashboardHeader = ({ userType = 'user', userName = 'Usuario', avatar, email }: DashboardHeaderProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    // Role label map
    const roleLabel: Record<string, string> = {
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

                    <div className={styles.profile} style={{ position: 'relative' }}>
                        <div
                            className={styles.profileTrigger}
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                        >
                            <div className={styles.userInfo}>
                                <span className={styles.userName}>{userName}</span>
                                <span className={styles.userRole}>{roleLabel[userType] || userType}</span>
                            </div>
                            <div className={styles.avatar}>
                                {avatar ? (
                                    <Image src={avatar} alt={userName} width={24} height={24} />
                                ) : (
                                    <User size={20} color="white" />
                                )}
                            </div>
                            <ChevronDown size={16} color="rgb(var(--text-secondary))" />
                        </div>

                        {dropdownOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '120%',
                                right: 0,
                                background: 'white',
                                borderRadius: '8px',
                                width: '180px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                padding: '0.5rem',
                                zIndex: 100,
                                border: '1px solid rgb(var(--border))'
                            }}>
                                <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: 'none', background: 'none', color: '#e63946', fontSize: '0.9rem', cursor: 'pointer' }} className="hover:bg-red-50">
                                    <LogOut size={16} />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        )}
                        {/* Backdrop */}
                        {dropdownOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99, cursor: 'default' }} onClick={() => setDropdownOpen(false)} />}
                    </div>
                </div>
            </div>
        </header>
    );
};
