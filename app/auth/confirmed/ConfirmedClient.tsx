"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import confetti from 'canvas-confetti';

interface ConfirmedClientProps {
    fullName: string;
    dashboardUrl: string;
    role: string;
}

export default function ConfirmedClient({ fullName, dashboardUrl, role }: ConfirmedClientProps) {
    const router = useRouter();
    const [countdown, setCountdown] = useState(5);
    const firstName = fullName.split(' ')[0] || 'Usuario';

    useEffect(() => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#6366f1', '#10b981', '#f59e0b'],
        });
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push(dashboardUrl);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [dashboardUrl, router]);

    const roleLabel = role === 'expert' ? 'Experto' : role === 'admin' ? 'Administrador' : 'Cliente';

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgb(var(--bg))',
            padding: '2rem 1rem',
        }}>
            <div style={{
                maxWidth: '460px',
                width: '100%',
                textAlign: 'center',
            }}>
                {/* Success icon */}
                <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgb(var(--success))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                    }}>
                        <CheckCircle size={40} color="white" />
                    </div>
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    marginBottom: '0.75rem',
                    background: 'linear-gradient(to right, rgb(var(--primary)), rgb(var(--secondary)))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    {`Bienvenido, ${firstName}!`}
                </h1>

                <p style={{
                    fontSize: '1.1rem',
                    color: 'rgb(var(--text-secondary))',
                    marginBottom: '1.5rem',
                    lineHeight: 1.6,
                }}>
                    Tu cuenta ha sido confirmada exitosamente. Ya puedes disfrutar de todos los servicios de Lookatfy.
                </p>

                {/* Role badge */}
                <div style={{
                    display: 'inline-block',
                    padding: '0.5rem 1.25rem',
                    background: 'rgba(var(--primary), 0.1)',
                    color: 'rgb(var(--primary))',
                    borderRadius: '2rem',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    marginBottom: '2rem',
                }}>
                    Cuenta {roleLabel}
                </div>

                {/* CTA Button */}
                <div style={{ marginBottom: '1rem' }}>
                    <Button
                        onClick={() => router.push(dashboardUrl)}
                        size="lg"
                        style={{ width: '100%' }}
                    >
                        Ir a mi Panel
                    </Button>
                </div>

                {/* Countdown */}
                <p style={{
                    fontSize: '0.85rem',
                    color: 'rgb(var(--text-muted))',
                }}>
                    {countdown > 0
                        ? `Redirigiendo en ${countdown} segundo${countdown !== 1 ? 's' : ''}...`
                        : 'Redirigiendo...'}
                </p>
            </div>
        </div>
    );
}
