"use client";

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';

function ErrorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const error = searchParams.get('error') || 'Ocurrió un error inesperado';
    const code = searchParams.get('code');
    const bookingId = searchParams.get('bookingId');

    const getErrorMessage = (errorText: string) => {
        // Map common errors to user-friendly messages
        if (errorText.includes('insufficient funds') || errorText.includes('fondos insuficientes')) {
            return 'No hay fondos suficientes en tu cuenta. Por favor intenta con otro método de pago.';
        }
        if (errorText.includes('card declined') || errorText.includes('tarjeta rechazada')) {
            return 'Tu tarjeta fue rechazada. Por favor verifica los datos o intenta con otra tarjeta.';
        }
        if (errorText.includes('timeout') || errorText.includes('tiempo')) {
            return 'La transacción tomó demasiado tiempo. Por favor intenta nuevamente.';
        }
        if (errorText.includes('invalid') || errorText.includes('inválido')) {
            return 'Los datos ingresados no son válidos. Por favor verifica e intenta nuevamente.';
        }
        return errorText;
    };

    return (
        <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                    <AlertTriangle size={48} style={{ color: '#ef4444' }} />
                </div>

                <h1 style={{ fontSize: '2rem', marginBottom: '1rem', fontWeight: 700 }}>
                    Error en el Pago
                </h1>

                <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem', fontSize: '1.1rem' }}>
                    Lo sentimos, hubo un problema al procesar tu pago.
                </p>

                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', textAlign: 'left' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#ef4444' }}>
                        Detalles del Error
                    </h3>
                    <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.5rem' }}>
                        {getErrorMessage(error)}
                    </p>
                    {code && (
                        <p style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))', marginTop: '0.75rem' }}>
                            Código de error: {code}
                        </p>
                    )}
                    {bookingId && (
                        <p style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))' }}>
                            ID de reserva: {bookingId}
                        </p>
                    )}
                </div>

                <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>
                        <strong>Sugerencias:</strong>
                    </p>
                    <ul style={{ textAlign: 'left', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                        <li>Verifica que los datos ingresados sean correctos</li>
                        <li>Asegúrate de tener fondos suficientes</li>
                        <li>Intenta con otro método de pago</li>
                        <li>Si el problema persiste, contacta a soporte</li>
                    </ul>
                </div>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ArrowLeft size={18} />
                        Intentar Nuevamente
                    </Button>
                    <Link href="/" style={{ textDecoration: 'none' }}>
                        <Button variant="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Home size={18} />
                            Ir al Inicio
                        </Button>
                    </Link>
                </div>

                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgb(var(--border))' }}>
                    <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-muted))', marginBottom: '0.5rem' }}>
                        ¿Necesitas ayuda?
                    </p>
                    <Link href="/contact" style={{ color: 'rgb(var(--primary))', fontSize: '0.95rem', textDecoration: 'none' }}>
                        Contacta a nuestro equipo de soporte
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutErrorPage() {
    return (
        <Suspense fallback={
            <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
                Cargando...
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
