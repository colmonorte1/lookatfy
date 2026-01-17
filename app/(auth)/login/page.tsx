"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simular delay
        setTimeout(() => setIsLoading(false), 2000);
    };

    return (
        <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Bienvenido de nuevo</h1>
                <p style={{ color: 'rgb(var(--text-secondary))' }}>Ingresa tus credenciales para acceder</p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@lookatfy.com"
                    icon={<Mail size={18} />}
                    required
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock size={18} />}
                        required
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
