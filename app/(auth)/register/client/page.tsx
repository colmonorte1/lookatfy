"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerClient } from '../../actions';

export default function ClientRegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
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

        if (strength < 2) {
            setError('La contraseña es muy débil. Incluye mayúsculas, números o caracteres especiales.');
            setIsLoading(false);
            return;
        }

        try {
            const result = await registerClient({ firstName, lastName, email, password });

            if (!result.success) {
                setError(result.error || 'Error al registrarse');
                return;
            }

            if (result.needsEmailConfirmation) {
                setEmailSent(true);
            } else {
                router.push('/user');
            }
        } catch {
            setError('Error inesperado al registrarse. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
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
                    <Mail size={30} />
                </div>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Revisa tu correo</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem', lineHeight: 1.6 }}>
                    Hemos enviado un enlace de confirmación a <strong>{email}</strong>.
                    Revisa tu bandeja de entrada (y spam) para activar tu cuenta.
                </p>
                <Link href="/login" style={{ color: 'rgb(var(--primary))', fontWeight: 600 }}>
                    Ir al Login
                </Link>
            </div>
        );
    }

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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="Nombre"
                        placeholder="Tu nombre"
                        icon={<User size={18} />}
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                        label="Apellidos"
                        placeholder="Tus apellidos"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>

                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    icon={<Mail size={18} />}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <Input
                        label="Contraseña"
                        type="password"
                        placeholder="Crea una contraseña segura"
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
                    <p style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))' }}>
                        Mínimo 8 caracteres. Usa mayúsculas, números y símbolos para mayor seguridad.
                    </p>
                </div>

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
