"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Mail } from 'lucide-react';
import { useState } from 'react';

export default function ForgotPasswordPage() {
    const [isSent, setIsSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setIsSent(true);
        }, 1500);
    };

    if (isSent) {
        return (
            <div style={{ textAlign: 'center' }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(var(--success), 0.1)',
                    color: 'rgb(var(--success))',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <Mail size={30} />
                </div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>¡Correo enviado!</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Hemos enviado las instrucciones para restablecer tu contraseña a tu correo electrónico.
                </p>
                <Button
                    variant="outline"
                    onClick={() => setIsSent(false)}
                    style={{ width: '100%' }}
                >
                    Volver a intentar
                </Button>
            </div>
        );
    }

    return (
        <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Recuperar Contraseña</h1>
                <p style={{ color: 'rgb(var(--text-secondary))' }}>
                    Ingresa tu email y te enviaremos un enlace para restablecerla.
                </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@lookatfy.com"
                    icon={<Mail size={18} />}
                    required
                />

                <Button
                    type="submit"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    isLoading={isLoading}
                >
                    Enviar Instrucciones
                </Button>
            </form>
        </>
    );
}
