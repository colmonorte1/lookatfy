'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Circle, ChevronRight, User, Briefcase, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { completeOnboarding } from './actions';

interface OnboardingStep {
    id: number;
    title: string;
    description: string;
    completed: boolean;
    href: string;
    cta: string;
}

interface OnboardingClientProps {
    steps: OnboardingStep[];
    expertName: string;
}

const STEP_ICONS = [User, Briefcase, Calendar];

export default function OnboardingClient({ steps, expertName }: OnboardingClientProps) {
    const router = useRouter();
    const [isFinishing, setIsFinishing] = useState(false);

    const allDone = steps.every(s => s.completed);
    const completedCount = steps.filter(s => s.completed).length;
    const progressPct = Math.round((completedCount / steps.length) * 100);

    const handleFinish = async () => {
        setIsFinishing(true);
        await completeOnboarding();
        router.push('/expert');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'rgb(var(--background))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
        }}>
            <div style={{ maxWidth: '640px', width: '100%' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        background: 'rgba(var(--primary), 0.1)',
                        color: 'rgb(var(--primary))',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        fontSize: '1.75rem',
                    }}>
                        👋
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Bienvenido, {expertName}
                    </h1>
                    <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '1rem' }}>
                        Completa estos 3 pasos para que los clientes puedan encontrarte y reservar tus servicios.
                    </p>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                        <span>{completedCount} de {steps.length} pasos completados</span>
                        <span style={{ fontWeight: 600, color: 'rgb(var(--primary))' }}>{progressPct}%</span>
                    </div>
                    <div style={{
                        height: '8px', background: 'rgb(var(--surface-hover))',
                        borderRadius: '999px', overflow: 'hidden',
                    }}>
                        <div style={{
                            height: '100%',
                            width: `${progressPct}%`,
                            background: allDone ? 'rgb(var(--success))' : 'rgb(var(--primary))',
                            borderRadius: '999px',
                            transition: 'width 0.4s ease',
                        }} />
                    </div>
                </div>

                {/* Steps */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                    {steps.map((step, idx) => {
                        const Icon = STEP_ICONS[idx];
                        return (
                            <div
                                key={step.id}
                                style={{
                                    background: 'rgb(var(--surface))',
                                    border: `1px solid ${step.completed ? 'rgba(var(--success), 0.4)' : 'rgb(var(--border))'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1.25rem 1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                }}
                            >
                                {/* Step status icon */}
                                <div style={{
                                    flexShrink: 0,
                                    width: '44px', height: '44px',
                                    borderRadius: '50%',
                                    background: step.completed
                                        ? 'rgba(var(--success), 0.12)'
                                        : 'rgba(var(--primary), 0.08)',
                                    color: step.completed ? 'rgb(var(--success))' : 'rgb(var(--primary))',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {step.completed
                                        ? <CheckCircle size={22} />
                                        : <Icon size={20} />
                                    }
                                </div>

                                {/* Step info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: 700,
                                            color: 'rgb(var(--text-muted))',
                                            textTransform: 'uppercase', letterSpacing: '0.05em',
                                        }}>
                                            Paso {step.id}
                                        </span>
                                        {step.completed && (
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: 600,
                                                color: 'rgb(var(--success))',
                                                background: 'rgba(var(--success), 0.1)',
                                                padding: '0.1rem 0.5rem',
                                                borderRadius: '999px',
                                            }}>
                                                Completado
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.2rem' }}>
                                        {step.title}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                                        {step.description}
                                    </div>
                                </div>

                                {/* CTA button */}
                                <div style={{ flexShrink: 0 }}>
                                    {step.completed ? (
                                        <a href={step.href} style={{
                                            fontSize: '0.8rem', color: 'rgb(var(--text-muted))',
                                            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem',
                                        }}>
                                            Editar <ChevronRight size={14} />
                                        </a>
                                    ) : (
                                        <a href={step.href}>
                                            <Button size="sm" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                {step.cta} <ArrowRight size={14} />
                                            </Button>
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Finish CTA */}
                {allDone ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.25rem', fontSize: '0.95rem' }}>
                            Todo listo. Tu perfil ya está activo en el marketplace.
                        </p>
                        <Button
                            size="lg"
                            onClick={handleFinish}
                            disabled={isFinishing}
                            style={{ minWidth: '200px' }}
                        >
                            {isFinishing ? 'Entrando...' : 'Ir a mi Dashboard'}
                        </Button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <button
                            onClick={handleFinish}
                            disabled={isFinishing}
                            style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'rgb(var(--text-muted))', fontSize: '0.875rem',
                                textDecoration: 'underline',
                            }}
                        >
                            {isFinishing ? 'Entrando...' : 'Omitir por ahora, ir al dashboard'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
