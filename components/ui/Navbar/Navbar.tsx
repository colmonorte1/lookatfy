"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Button } from '../Button/Button';
import styles from './Navbar.module.css';
import { User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface NavbarProps {
    user?: {
        full_name?: string;
        avatar_url?: string;
        role?: string;
        email?: string;
    } | null;
}

export const Navbar = ({ user }: NavbarProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
        setDropdownOpen(false);
    };

    const getDashboardLink = () => {
        switch (user?.role) {
            case 'admin': return '/admin';
            case 'expert': return '/expert';
            default: return '/user/bookings';
        }
    };

    return (
        <nav className={styles.navbar}>
            <div className={`container ${styles.container}`}>
                <Link href="/" className={styles.logo}>
                    Lookatfy
                </Link>

                <div className={styles.links}>
                    <Link href="/" className={styles.link}>Inicio</Link>
                    <Link href="/services/search" className={styles.link}>Explorar</Link>
                    <Link href="/experts" className={styles.link}>Expertos</Link>
                    <Link href="/about" className={styles.link}>Cómo funciona</Link>
                </div>

                <div className={styles.actions}>
                    {user ? (
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'rgba(0,0,0,0.05)',
                                    border: '1px solid rgba(0,0,0,0.1)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '2rem',
                                    color: '#333',
                                    cursor: 'pointer'
                                }}
                            >
                                {user.avatar_url ? (
                                    <Image src={user.avatar_url} alt="Avatar" width={24} height={24} style={{ borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <User size={20} />
                                )}
                                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{user.full_name?.split(' ')[0] || 'Cuenta'}</span>
                                <ChevronDown size={14} />
                            </button>

                            {dropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '120%',
                                    right: 0,
                                    background: 'white',
                                    borderRadius: '8px',
                                    width: '200px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    padding: '0.5rem',
                                    zIndex: 100,
                                    color: '#333'
                                }}>
                                    <div style={{ padding: '0.5rem', borderBottom: '1px solid #eee', marginBottom: '0.5rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.full_name}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666', textTransform: 'capitalize' }}>{user.role}</div>
                                    </div>

                                    <Link href={getDashboardLink()} onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', textDecoration: 'none', color: '#333', fontSize: '0.9rem', transition: 'background 0.2s' }} className="hover:bg-gray-100">
                                        <LayoutDashboard size={16} />
                                        <span>Mi Panel</span>
                                    </Link>

                                    <button onClick={handleSignOut} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '4px', border: 'none', background: 'none', color: '#e63946', fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.25rem' }}>
                                        <LogOut size={16} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            )}
                            {/* Backdrop to close */}
                            {dropdownOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setDropdownOpen(false)} />}
                        </div>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm">Log In</Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="primary" size="sm">Sign Up</Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};
