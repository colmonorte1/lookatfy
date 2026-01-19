"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isSent, setIsSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/account/update-password`,
            });
            if (error) throw error;
            setIsSent(true);
        } catch (err: any) {
            setError(err.message || "Error al enviar el correo");
        } finally {
            setIsLoading(false);
        }
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
                    Si el correo existe en nuestra base de datos, recibirás las instrucciones para restablecer tu contraseña.
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
