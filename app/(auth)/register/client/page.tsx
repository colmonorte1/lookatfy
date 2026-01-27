"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ClientRegisterPage() {
    const [fullName, setFullName] = useState('');
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
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'client'
                    }
                }
            });

            if (error) throw error;

            // Success redirect, or show check email message
            // Since we might have email confirmation enabled by default in Supabase, 
            // checking "user" object or session is wise.
            // For MVP often we turn off confirm email for faster testing or handle the "Check your email" state.
            // Assuming auto-confirm or ignoring for now:

            router.push('/user/profile');

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg || 'Error al registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgb(var(--text-secondary))', textDecoration: 'none', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Volver
            </Link>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Crear Cuenta Cliente</h1>
                <p style={{ color: 'rgb(var(--text-secondary))' }}>Entra a un mundo de expertos a tu alcance</p>
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
                    label="Nombre Completo"
                    placeholder="Tu nombre y apellidos"
                    icon={<User size={18} />}
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                />

                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    icon={<Mail size={18} />}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                    label="Contraseña"
                    type="password"
                    placeholder="Crea una contraseña segura"
                    icon={<Lock size={18} />}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                    type="submit"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    isLoading={isLoading}
                    size="lg"
                >
                    Registrarme
                </Button>

                <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', textAlign: 'center', lineHeight: '1.5' }}>
                    Al registrarte, aceptas nuestros <Link href="#" style={{ color: 'rgb(var(--primary))' }}>Términos de Servicio</Link> y <Link href="#" style={{ color: 'rgb(var(--primary))' }}>Política de Privacidad</Link>.
                </p>
            </form>
        </div>
    );
}
