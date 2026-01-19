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
                console.error("Login error from supabase:", error);
                throw error;
            }

            // Check session
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Fetch role from profiles table (Source of Truth)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                const role = profile?.role || user.user_metadata?.role || 'client';

                if (role === 'expert') {
                    router.push('/expert');
                } else if (role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/user');
                }

                router.refresh();
            }

        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
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
