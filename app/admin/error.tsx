'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

export default function AdminDashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Admin Dashboard Error:', error);
    }, [error]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgb(var(--surface))',
                border: '1px solid rgb(var(--border))',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(var(--error), 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <AlertTriangle size={32} style={{ color: 'rgb(var(--error))' }} />
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Error al cargar el Dashboard
                </h2>

                <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Hubo un problema al cargar los datos del dashboard. Por favor, intenta nuevamente.
                </p>

                {error.message && (
                    <div style={{
                        background: 'rgba(var(--error), 0.05)',
                        border: '1px solid rgba(var(--error), 0.2)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.75rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.85rem',
                        color: 'rgb(var(--text-secondary))',
                        textAlign: 'left',
                        fontFamily: 'monospace',
                        wordBreak: 'break-word'
                    }}>
                        <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'rgb(var(--error))' }}>
                            Error técnico:
                        </strong>
                        {error.message}
                    </div>
                )}

                <Button
                    onClick={reset}
                    style={{
                        gap: '0.5rem',
                        display: 'inline-flex',
                        alignItems: 'center'
                    }}
                >
                    <RefreshCw size={16} />
                    Intentar nuevamente
                </Button>

                <p style={{
                    fontSize: '0.8rem',
                    color: 'rgb(var(--text-muted))',
                    marginTop: '1rem'
                }}>
                    Si el problema persiste, contacta al equipo de soporte.
                </p>
            </div>
        </div>
    );
}
