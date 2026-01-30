"use client";

import { Home, Bell, User, LogOut, ChevronDown, Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import styles from './DashboardHeader.module.css';
import { useNotifications } from '@/components/notifications/NotificationsProvider';

interface DashboardHeaderProps {
    userType?: 'admin' | 'expert' | 'user';
    userName?: string;
    avatar?: string;
    email?: string; // Added email for dropdown context potentially
}

export const DashboardHeader = ({ userType = 'user', userName = 'Usuario', avatar, email }: DashboardHeaderProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();
    const notifications = useNotifications();

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
                <div className={styles.left}>
                    <button
                        className={styles.menuButton}
                        aria-label="Abrir menú"
                        aria-controls="dashboard-sidebar"
                        aria-expanded={isSidebarOpen}
                        onClick={() => {
                            setIsSidebarOpen(!isSidebarOpen);
                            if (typeof window !== 'undefined') {
                                window.dispatchEvent(new CustomEvent('dashboard:toggleSidebar'));
                            }
                        }}
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Right Side: Actions & Profile */}
                <div className={styles.right}>
                    <Link href="/" className={styles.iconButton} title="Ir al Inicio">
                        <Home size={20} />
                    </Link>

                    <div className={styles.profile} style={{ position: 'relative' }}>
                        <button
                            className={styles.iconButton}
                            title="Notificaciones"
                            onClick={() => {
                                const next = !notifOpen
                                setNotifOpen(next)
                                if (next) {
                                    notifications.markAllUnreadRead()
                                }
                            }}
                        >
                            <Bell size={20} />
                            {notifications.unreadCount > 0 && (
                                <span className={styles.badge}>{notifications.unreadCount}</span>
                            )}
                        </button>
                        {notifOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '120%',
                                right: 48,
                                background: 'white',
                                borderRadius: '8px',
                                width: '320px',
                                maxHeight: '360px',
                                overflow: 'auto',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                padding: '0.5rem',
                                zIndex: 100,
                                border: '1px solid rgb(var(--border))'
                            }}>
                                {notifications.notifications.length === 0 && (
                                    <div style={{ padding: '0.75rem', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>
                                        No tienes notificaciones
                                    </div>
                                )}
                                {notifications.notifications.map((n) => (
                                    <div key={n.id} style={{ padding: '0.5rem', borderRadius: 6, background: n.status === 'unread' ? 'rgba(0,0,0,0.03)' : 'transparent', marginBottom: '0.25rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{n.title}</div>
                                        {n.body && <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>{n.body}</div>}
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
                                            {n.status !== 'read' && (
                                                <button onClick={() => notifications.markRead(n.id)} className={styles.iconButton} title="Marcar como leída">
                                                    Leer
                                                </button>
                                            )}
                                            <button onClick={() => notifications.archive(n.id)} className={styles.iconButton} title="Archivar">
                                                Archivar
                                            </button>
                                            {n.recipient_user_id && (
                                                <button onClick={() => notifications.remove(n.id)} className={styles.iconButton} title="Eliminar">
                                                    Eliminar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

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
