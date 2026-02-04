"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const scorePassword = (p: string) => {
        let s = 0;
        if (p.length >= 8) s++;
        if (/[A-Z]/.test(p)) s++;
        if (/[0-9]/.test(p)) s++;
        if (/[^A-Za-z0-9]/.test(p)) s++;
        return s;
    };
    const strength = scorePassword(password);
    const strengthLabel = strength <= 1 ? 'Débil' : strength === 2 ? 'Media' : strength === 3 ? 'Buena' : 'Alta';
    const strengthColor = strength <= 1 ? 'rgb(var(--error))' : strength === 2 ? 'rgb(var(--warning))' : strength === 3 ? 'rgb(var(--primary))' : 'rgb(var(--success))';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                const msg = String(error?.message || 'Error al iniciar sesión');
                const friendly = msg.toLowerCase().includes('invalid login credentials')
                    ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
                    : msg;
                setError(friendly);
                return;
            }

            // Check session
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch role from profiles table (Source of Truth)
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('role, email, full_name, status, deleted_at')
                    .eq('id', user.id)
                    .single();

                // Debug logging (only in development)
                if (process.env.NODE_ENV === 'development') {
                    console.log('🔐 Login Debug Info:');
                    console.log('User ID:', user.id);
                    console.log('Email:', user.email);
                    console.log('Profile Data:', profile);
                    console.log('Profile Error:', profileError);
                    console.log('Role from profile:', profile?.role);
                    console.log('Role from metadata:', user.user_metadata?.role);
                }

                // Check if user is suspended or deleted
                if (profile?.status === 'suspended') {
                    await supabase.auth.signOut();
                    setError('Tu cuenta ha sido suspendida. Contacta al administrador para más información.');
                    return;
                }

                if (profile?.status === 'deleted' || profile?.deleted_at) {
                    await supabase.auth.signOut();
                    setError('Esta cuenta ha sido eliminada. Contacta al administrador si crees que es un error.');
                    return;
                }

                const role = profile?.role || user.user_metadata?.role || 'client';

                console.log('🎯 Redirecting user with role:', role);

                if (role === 'expert') {
                    console.log('→ Redirecting to /expert');
                    router.push('/expert');
                } else if (role === 'admin') {
                    console.log('→ Redirecting to /admin');
                    router.push('/admin');
                } else {
                    console.log('→ Redirecting to /user');
                    router.push('/user');
                }

                router.refresh();
            }

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            const friendly = msg.toLowerCase().includes('invalid login credentials')
                ? 'Credenciales inválidas. Verifica tu correo y contraseña.'
                : msg;
            setError(friendly || 'Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bienvenido de nuevo</h1>
                <p style={{ color: 'rgb(var(--text-secondary))' }}>Ingresa tus credenciales para acceder</p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(var(--error), 0.1)',
                    color: 'rgb(var(--error))',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@lookatfy.com"
                    icon={<Mail size={18} />}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock size={18} />}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ height: '8px', background: 'rgb(var(--border))', borderRadius: '999px', width: '120px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(strength/4)*100}%`, background: strengthColor }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>Fortaleza: {strengthLabel}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <Link
                            href="/forgot-password"
                            style={{ fontSize: '0.875rem', color: 'rgb(var(--primary))', fontWeight: 500 }}
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </div>

                <Button
                    type="submit"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    isLoading={isLoading}
                >
                    Iniciar Sesión
                </Button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>
                ¿No tienes una cuenta?{' '}
                <Link href="/register" style={{ color: 'rgb(var(--primary))', fontWeight: 600 }}>
                    Regístrate gratis
                </Link>
            </p>
        </>
    );
}
