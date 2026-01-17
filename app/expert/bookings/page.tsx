"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Calendar, Video, Clock } from 'lucide-react';

const BOOKINGS = [
    { id: 1, customer: 'Juan Pérez', date: '16 Ene 2024', time: '10:00 AM', status: 'upcoming', price: 25, serviceTitle: 'Asesoría de Estilo', serviceType: 'Virtual' },
    { id: 2, customer: 'María Lopez', date: '17 Ene 2024', time: '03:00 PM', status: 'upcoming', price: 45, serviceTitle: 'Personal Shopper', serviceType: 'Presencial' },
    { id: 3, customer: 'Carlos Ruiz', date: '12 Ene 2024', time: '11:00 AM', status: 'completed', price: 25, serviceTitle: 'Asesoría Tech', serviceType: 'Virtual' },
];

export default function ExpertBookingsPage() {
    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mis Reservas</h1>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                <Button variant="primary" size="sm" style={{ borderRadius: '2rem' }}>Próximas</Button>
                <Button variant="ghost" size="sm" style={{ borderRadius: '2rem', background: 'rgb(var(--surface))' }}>Historial</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {BOOKINGS.map(booking => (
                    <div key={booking.id} style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{
                                width: '50px', height: '50px', borderRadius: '50%', background: 'rgb(var(--surface-hover))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                            }}>
                                {booking.customer.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{booking.customer}</div>
                                <div style={{ fontSize: '0.9rem', color: 'rgb(var(--primary))', fontWeight: 500, margin: '0.2rem 0' }}>
                                    {booking.serviceTitle} • <span style={{ textTransform: 'uppercase', fontSize: '0.75rem', background: 'rgba(var(--primary), 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{booking.serviceType}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Calendar size={14} /> {booking.date}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={14} /> {booking.time}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>${booking.price}</div>
                            {booking.status === 'upcoming' && (
                                <Link href={`/call?roomUrl=https://your-domain.daily.co/test-room&userName=Experto`}>
                                    <Button style={{ gap: '0.5rem' }}>
                                        <Video size={18} />
                                        Entrar
                                    </Button>
                                </Link>
                            )}
                            {booking.status === 'completed' && (
                                <span style={{
                                    padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                    background: 'rgba(var(--success), 0.1)', color: 'rgb(var(--success))',
                                    fontSize: '0.875rem', fontWeight: 500
                                }}>
                                    Completada
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
