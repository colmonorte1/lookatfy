"use client";

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Calendar, Video, PlayCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { USERS_MOCK } from '@/lib/data/users';

// Mock data extension for specific user details
const USER_DETAILS = {
    totalSpend: 540.00,
    sessionsAttended: 12,
    recordingsCount: 8,
    joinedDate: '22 May 2023',
    location: 'Barcelona, España',
    bookings: [
        { id: 'BK-101', date: '2024-01-20', expert: 'Laura García', service: 'Asesoría de Estilo', price: 120, status: 'upcoming' },
        { id: 'BK-098', date: '2024-01-10', expert: 'Pedro Martinez', service: 'Consulta Legal', price: 80, status: 'completed' },
        { id: 'BK-085', date: '2023-12-15', expert: 'Ana Vega', service: 'Clase de Yoga', price: 30, status: 'completed' },
        { id: 'BK-072', date: '2023-11-30', expert: 'Laura García', service: 'Revisión Armario', price: 100, status: 'completed' },
    ],
    recordings: [
        { id: 'REC-001', title: 'Consulta Legal - Dudas Contrato', expert: 'Pedro Martinez', date: '10 Ene 2024', duration: '45 min' },
        { id: 'REC-002', title: 'Clase de Yoga - Respiración', expert: 'Ana Vega', date: '15 Dic 2023', duration: '60 min' },
        { id: 'REC-003', title: 'Revisión de Armario - Temporada Invierno', expert: 'Laura García', date: '30 Nov 2023', duration: '55 min' },
    ]
};

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);

    const userBasic = USERS_MOCK.find(u => u.id === id) || {
        name: 'Usuario Desconocido',
        email: 'N/A',
        role: 'user',
        status: 'inactive',
        joinedAt: 'N/A'
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/users" style={{ display: 'inline-flex', alignItems: 'center', color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver al listado
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 700
                        }}>
                            {userBasic.name.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{userBasic.name}</h1>
                            <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                <span>{userBasic.email}</span>
                                <span>•</span>
                                <span>{USER_DETAILS.location}</span>
                            </div>
                            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px',
                                    border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))'
                                }}>
                                    ID: {id}
                                </span>
                                <span style={{
                                    fontSize: '0.8rem', padding: '0.1rem 0.5rem', borderRadius: '4px',
                                    background: userBasic.status === 'active' ? 'rgba(var(--success), 0.1)' : 'rgba(var(--warning), 0.1)',
                                    color: userBasic.status === 'active' ? 'rgb(var(--success))' : 'rgb(var(--warning))',
                                    fontWeight: 600
                                }}>
                                    {userBasic.status === 'active' ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline">Enviar Mensaje</Button>
                        <Button style={{ background: 'rgb(var(--text-main))', color: 'rgb(var(--surface))' }}>Editar Usuario</Button>
                    </div>
                </div>
            </div>

            {/* KPIs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Gasto Total</span>
                        <CreditCard size={18} color="rgb(var(--primary))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>${USER_DETAILS.totalSpend.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Sesiones Asistidas</span>
                        <Video size={18} color="rgb(var(--secondary))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{USER_DETAILS.sessionsAttended}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Grabaciones</span>
                        <PlayCircle size={18} color="rgb(var(--error))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{USER_DETAILS.recordingsCount}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Miembro Desde</span>
                        <Calendar size={18} color="rgb(var(--text-muted))" />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem' }}>{userBasic.joinedAt}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Bookings/Services Section */}
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Calendar size={18} /> Servicios Contratados
                        </h3>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <tbody>
                                {USER_DETAILS.bookings.map(booking => (
                                    <tr key={booking.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{booking.service}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>con {booking.expert}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem' }}>{booking.date}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px',
                                                background: booking.status === 'completed' ? 'rgba(var(--success), 0.1)' : 'rgba(var(--primary), 0.1)',
                                                color: booking.status === 'completed' ? 'rgb(var(--success))' : 'rgb(var(--primary))'
                                            }}>
                                                {booking.status === 'completed' ? 'Completado' : 'Próximo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Recordings Section */}
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <PlayCircle size={18} /> Grabaciones Disponibles
                        </h3>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        {USER_DETAILS.recordings.map(rec => (
                            <div key={rec.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1rem', borderBottom: '1px solid rgb(var(--border))',
                                marginBottom: '0.5rem'
                            }}>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '8px',
                                        background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <PlayCircle size={20} color="rgb(var(--text-secondary))" />
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{rec.title}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                            {rec.expert} • {rec.date}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Clock size={14} /> {rec.duration}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
