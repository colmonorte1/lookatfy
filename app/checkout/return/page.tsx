"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

function ReturnContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');
    const [bookingData, setBookingData] = useState<any>(null);
    const [transactionData, setTransactionData] = useState<any>(null);

    const id = searchParams.get('id'); // Transaction or Booking ID from Wompi

    useEffect(() => {
        const checkPaymentStatus = async () => {
            if (!id) {
                setStatus('failed');
                return;
            }

            try {
                const supabase = createClient();

                // Try to find the transaction by Wompi transaction ID or reference
                const { data: transaction, error: txError } = await supabase
                    .from('payment_transactions')
                    .select('*, bookings(*)')
                    .or(`wompi_transaction_id.eq.${id},wompi_reference.eq.${id}`)
                    .single();

                if (txError || !transaction) {
                    // Fallback: check by booking ID
                    const { data: booking, error: bookingError } = await supabase
                        .from('bookings')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (bookingError || !booking) {
                        setStatus('failed');
                        return;
                    }

                    setBookingData(booking);

                    // Determine status from booking
                    if (booking.status === 'confirmed') {
                        setStatus('success');
                    } else if (booking.status === 'pending') {
                        setStatus('pending');
                    } else {
                        setStatus('failed');
                    }
                    return;
                }

                setTransactionData(transaction);
                setBookingData(transaction.bookings);

                // Determine status from transaction
                if (transaction.status === 'APPROVED') {
                    setStatus('success');
                } else if (transaction.status === 'PENDING') {
                    setStatus('pending');
                } else {
                    setStatus('failed');
                }
            } catch (error) {
                console.error('Error checking payment status:', error);
                setStatus('failed');
            }
        };

        checkPaymentStatus();

        // Poll every 5 seconds if pending
        const interval = setInterval(() => {
            if (status === 'pending') {
                checkPaymentStatus();
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [id, status]);

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <Loader2 size={64} style={{ color: 'rgb(var(--primary))', margin: '0 auto 2rem', animation: 'spin 1s linear infinite' }} />
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Verificando tu pago...</h1>
                        <p style={{ color: 'rgb(var(--text-secondary))' }}>Por favor espera un momento mientras confirmamos tu transacción.</p>
                    </div>
                );

            case 'success':
                return (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <CheckCircle size={48} style={{ color: '#22c55e' }} />
                        </div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>¡Pago Confirmado!</h1>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem', fontSize: '1.1rem' }}>
                            Tu reserva ha sido confirmada exitosamente. Recibirás un correo con los detalles.
                        </p>

                        {bookingData && (
                            <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem', textAlign: 'left' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Detalles de la Reserva</h3>
                                <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
                                    <div><strong>ID de Reserva:</strong> {bookingData.id}</div>
                                    <div><strong>Fecha:</strong> {bookingData.date}</div>
                                    <div><strong>Hora:</strong> {bookingData.time}</div>
                                    {bookingData.price && <div><strong>Monto:</strong> ${bookingData.price} {bookingData.currency}</div>}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/user/bookings" style={{ textDecoration: 'none' }}>
                                <Button>Ver Mis Reservas</Button>
                            </Link>
                            <Link href="/" style={{ textDecoration: 'none' }}>
                                <Button variant="secondary">Ir al Inicio</Button>
                            </Link>
                        </div>
                    </div>
                );

            case 'pending':
                return (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(234, 179, 8, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <Clock size={48} style={{ color: '#eab308' }} />
                        </div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Pago Pendiente</h1>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem', fontSize: '1.1rem' }}>
                            Tu pago está siendo procesado. Esto puede tardar unos minutos.
                        </p>
                        <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                            <AlertCircle size={24} style={{ color: '#eab308', marginBottom: '0.5rem' }} />
                            <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>
                                Estamos verificando tu pago automáticamente. Recibirás un correo cuando se confirme.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button onClick={() => window.location.reload()}>
                                Verificar Ahora
                            </Button>
                            <Link href="/user/bookings" style={{ textDecoration: 'none' }}>
                                <Button variant="secondary">Ver Mis Reservas</Button>
                            </Link>
                        </div>
                    </div>
                );

            case 'failed':
                return (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                            <XCircle size={48} style={{ color: '#ef4444' }} />
                        </div>
                        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Pago No Confirmado</h1>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2rem', fontSize: '1.1rem' }}>
                            Lo sentimos, no pudimos confirmar tu pago. Por favor intenta nuevamente.
                        </p>
                        {transactionData?.status_message && (
                            <div style={{ background: 'rgb(var(--surface))', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
                                <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>
                                    <strong>Motivo:</strong> {transactionData.status_message}
                                </p>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Button onClick={() => router.back()}>
                                Intentar Nuevamente
                            </Button>
                            <Link href="/" style={{ textDecoration: 'none' }}>
                                <Button variant="secondary">Ir al Inicio</Button>
                            </Link>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="container" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderContent()}
            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

export default function ReturnPage() {
    return (
        <Suspense fallback={
            <div className="container" style={{ padding: '4rem', textAlign: 'center' }}>
                <Loader2 size={48} style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />
            </div>
        }>
            <ReturnContent />
        </Suspense>
    );
}
