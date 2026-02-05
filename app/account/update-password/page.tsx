"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
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

        if (password.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres.');
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg || 'Error al actualizar la contraseña');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                background: 'rgb(var(--background))',
            }}>
                <div style={{ textAlign: 'center', maxWidth: '400px' }}>
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'rgba(var(--success), 0.1)',
                        color: 'rgb(var(--success))',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                    }}>
                        <Lock size={30} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Contraseña actualizada</h1>
                    <p style={{ color: 'rgb(var(--text-secondary))', lineHeight: 1.6 }}>
                        Tu contraseña ha sido actualizada correctamente. Serás redirigido al login.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'rgb(var(--background))',
        }}>
            <div style={{ maxWidth: '400px', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Nueva Contraseña</h1>
                    <p style={{ color: 'rgb(var(--text-secondary))' }}>
                        Ingresa tu nueva contraseña.
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
                        textAlign: 'center',
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <Input
                            label="Nueva contraseña"
                            type="password"
                            placeholder="••••••••"
                            icon={<Lock size={18} />}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {password.length > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ height: '8px', background: 'rgb(var(--border))', borderRadius: '999px', width: '120px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(strength / 4) * 100}%`, background: strengthColor, transition: 'width 0.3s' }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>Fortaleza: {strengthLabel}</span>
                            </div>
                        )}
                    </div>

                    <Input
                        label="Confirmar contraseña"
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock size={18} />}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <Button
                        type="submit"
                        style={{ width: '100%', marginTop: '0.5rem' }}
                        isLoading={isLoading}
                    >
                        Actualizar Contraseña
                    </Button>
                </form>
            </div>
        </div>
    );
}
