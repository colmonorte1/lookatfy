"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/Button/Button';
import { Calendar, Video, Clock, MapPin, XCircle, RefreshCw, CheckCircle, Video as VideoIcon } from 'lucide-react';

const BOOKINGS = [
    {
        id: 1,
        expert: 'María López',
        expertRole: 'Fashion Stylist',
        service: 'Asesoría de Estilo Personal',
        type: 'Virtual',
        date: 'Hoy, 17 Ene',
        time: '18:00 PM',
        status: 'confirmed',
        price: 50,
        avatar: 'https://i.pravatar.cc/150?u=maria',
        roomUrl: 'https://demo.daily.co/test-room'
    },
    {
        id: 2,
        expert: 'Carlos Méndez',
        expertRole: 'Consultor de Negocios',
        service: 'Consultoría 1:1 Estrategia',
        type: 'Virtual',
        date: '22 Ene 2026',
        time: '10:00 AM',
        status: 'pending',
        price: 120,
        avatar: 'https://i.pravatar.cc/150?u=carlos'
    },
    {
        id: 3,
        expert: 'Laura García',
        expertRole: 'Personal Shopper',
        service: 'Ruta de Compras Personalizada',
        type: 'Presencial',
        date: '12 Ene 2026',
        time: '11:00 AM',
        status: 'completed',
        price: 80,
        avatar: 'https://i.pravatar.cc/150?u=laura'
    },
    {
        id: 4,
        expert: 'Ana Torres',
        expertRole: 'Abogada Laboral',
        service: 'Revisión de Contrato',
        type: 'Virtual',
        date: '05 Ene 2026',
        time: '16:30 PM',
        status: 'cancelled',
        price: 60,
        avatar: 'https://i.pravatar.cc/150?u=ana'
    }
];

const getStatusColor = (status: string) => {
    switch (status) {
        case 'confirmed': return { bg: 'rgba(var(--success), 0.1)', text: 'rgb(var(--success))', label: 'Confirmada', icon: CheckCircle };
        case 'pending': return { bg: 'rgba(var(--warning), 0.1)', text: 'rgb(var(--warning))', label: 'Pendiente', icon: Clock };
        case 'completed': return { bg: 'rgba(var(--primary), 0.1)', text: 'rgb(var(--primary))', label: 'Completada', icon: CheckCircle };
        case 'cancelled': return { bg: 'rgba(var(--error), 0.1)', text: 'rgb(var(--error))', label: 'Cancelada', icon: XCircle };
        default: return { bg: 'rgb(var(--surface-hover))', text: 'rgb(var(--text-secondary))', label: status, icon: Clock };
    }
};

export default function UserBookingsPage() {
    return (
        <div style={{ maxWidth: '1000px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Mis Reservas</h1>
                <Button variant="outline" size="sm">Descargar Historial</Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {BOOKINGS.map(booking => {
                    const statusInfo = getStatusColor(booking.status);
                    const StatusIcon = statusInfo.icon;

                    return (
                        <div key={booking.id} className="card-hover" style={{
                            background: 'rgb(var(--surface))',
                            padding: '1.5rem',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgb(var(--border))',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(300px, 2fr) 1fr',
                            gap: '2rem',
                            transition: 'var(--transition-all)'
                        }}>
                            {/* Left: Info */}
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <img
                                    src={booking.avatar}
                                    alt={booking.expert}
                                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgb(var(--surface-hover))' }}
                                />
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{booking.service}</h3>
                                        <span style={{
                                            background: statusInfo.bg, color: statusInfo.text,
                                            padding: '0.2rem 0.6rem', borderRadius: '1rem',
                                            fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem'
                                        }}>
                                            <StatusIcon size={12} /> {statusInfo.label}
                                        </span>
                                    </div>
                                    <div style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        con <span style={{ color: 'rgb(var(--text-main))', fontWeight: 500 }}>{booking.expert}</span> ({booking.expertRole})
                                    </div>

                                    <div style={{ display: 'flex', gap: '1.5rem', color: 'rgb(var(--text-secondary))', fontSize: '0.85rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Calendar size={14} /> {booking.date}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Clock size={14} /> {booking.time}
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            {booking.type === 'Virtual' ? <Video size={14} /> : <MapPin size={14} />}
                                            {booking.type}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.75rem', borderLeft: '1px solid rgb(var(--border))', paddingLeft: '2rem' }}>
                                {booking.status === 'confirmed' && (
                                    <>
                                        {booking.type === 'Virtual' && (
                                            <Link href={`/call?roomUrl=${encodeURIComponent(booking.roomUrl || '')}&userName=Usuario`} target="_blank">
                                                <Button fullWidth style={{ gap: '0.5rem' }}>
                                                    <VideoIcon size={16} /> Unirse ahora
                                                </Button>
                                            </Link>
                                        )}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                            <Button variant="outline" size="sm" onClick={() => alert('Funcionalidad de reprogramar pendiente')}>
                                                <RefreshCw size={14} style={{ marginRight: '0.25rem' }} /> Reprogramar
                                            </Button>
                                            <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--error))' }} onClick={() => alert('¿Seguro que quieres cancelar?')}>
                                                <XCircle size={14} style={{ marginRight: '0.25rem' }} /> Cancelar
                                            </Button>
                                        </div>
                                    </>
                                )}

                                {booking.status === 'pending' && (
                                    <div style={{ textAlign: 'center', color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Esperando confirmación del experto...
                                    </div>
                                )}

                                {(booking.status === 'completed' || booking.status === 'cancelled') && (
                                    <Button variant="outline" fullWidth>
                                        Ver Detalles
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
