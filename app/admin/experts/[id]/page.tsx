"use client";

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Star, DollarSign, Calendar, Clock, Video, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { USERS_MOCK } from '@/lib/data/users';

// Mock data extension for specific expert details
const EXPERT_DETAILS = {
    earnings: 3450.00,
    rating: 4.8,
    totalReviews: 124,
    totalSessions: 85,
    joinedDate: '15 Ene 2023',
    bio: 'Especialista en moda y estilo personal con más de 10 años de experiencia.',
    location: 'Madrid, España',
    services: [
        { id: 101, title: 'Asesoría de Estilo Express', price: 45, duration: '30 min', status: 'active' },
        { id: 102, title: 'Revisión de Armario', price: 120, duration: '2 horas', status: 'active' },
        { id: 103, title: 'Personal Shopper Virtual', price: 80, duration: '1 hora', status: 'paused' },
    ],
    history: [
        { id: 'BK-001', date: '2024-01-15', user: 'Maria Lopez', service: 'Revisión de Armario', amount: 120, status: 'completed' },
        { id: 'BK-002', date: '2024-01-14', user: 'Juan Ruiz', service: 'Asesoría Express', amount: 45, status: 'completed' },
        { id: 'BK-003', date: '2024-01-12', user: 'Sofia Diaz', service: 'Asesoría Express', amount: 45, status: 'cancelled' },
        { id: 'BK-004', date: '2024-01-10', user: 'Pedro Gomez', service: 'Revisión de Armario', amount: 120, status: 'completed' },
    ]
};

export default function AdminExpertDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use() or await in useEffect if preferred, but Next.js 16 recommends await params in layout/page
    const { id } = use(params);

    const expertBasic = USERS_MOCK.find(u => u.id === id) || {
        name: 'Experto Desconocido',
        email: 'N/A',
        role: 'expert',
        status: 'inactive',
        joinedAt: 'N/A'
    };

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/experts" style={{ display: 'inline-flex', alignItems: 'center', color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Volver al listado
                </Link>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '2rem', fontWeight: 700
                        }}>
                            {expertBasic.name.charAt(0)}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{expertBasic.name}</h1>
                            <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                <span>{expertBasic.email}</span>
                                <span>•</span>
                                <span>{EXPERT_DETAILS.location}</span>
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
                                    background: expertBasic.status === 'active' ? 'rgba(var(--success), 0.1)' : 'rgba(var(--warning), 0.1)',
                                    color: expertBasic.status === 'active' ? 'rgb(var(--success))' : 'rgb(var(--warning))',
                                    fontWeight: 600
                                }}>
                                    {expertBasic.status === 'active' ? 'Verificado' : 'Pendiente'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline">Contactar</Button>
                        <Button style={{ background: 'rgb(var(--text-main))', color: 'rgb(var(--surface))' }}>Editar Perfil</Button>
                    </div>
                </div>
            </div>

            {/* KPIs Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Ingresos Totales</span>
                        <DollarSign size={18} color="rgb(var(--success))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>${EXPERT_DETAILS.earnings.toLocaleString()}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Calificación</span>
                        <Star size={18} fill="orange" color="orange" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{EXPERT_DETAILS.rating} <span style={{ fontSize: '0.9rem', color: 'rgb(var(--text-muted))', fontWeight: 400 }}>({EXPERT_DETAILS.totalReviews})</span></div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Sesiones</span>
                        <Video size={18} color="rgb(var(--primary))" />
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{EXPERT_DETAILS.totalSessions}</div>
                </div>
                <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>Antigüedad</span>
                        <Calendar size={18} color="rgb(var(--text-muted))" />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 600, marginTop: '0.5rem' }}>{expertBasic.joinedAt}</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Services Section */}
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={18} /> Servicios Ofrecidos
                        </h3>
                        <span style={{ background: 'rgb(var(--surface-hover))', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem' }}>
                            {EXPERT_DETAILS.services.length} Activos
                        </span>
                    </div>
                    <div style={{ padding: '1rem' }}>
                        {EXPERT_DETAILS.services.map(service => (
                            <div key={service.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '1rem', borderBottom: '1px solid rgb(var(--border))',
                                marginBottom: '0.5rem'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{service.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))', display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={14} /> {service.duration}</span>
                                        <span>${service.price}</span>
                                    </div>
                                </div>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', borderRadius: '4px',
                                    background: service.status === 'active' ? 'rgba(var(--success), 0.1)' : 'rgba(var(--text-muted), 0.1)',
                                    color: service.status === 'active' ? 'rgb(var(--success))' : 'rgb(var(--text-muted))'
                                }}>
                                    {service.status === 'active' ? 'Activo' : 'Pausado'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* History Section */}
                <div style={{ background: 'rgb(var(--surface))', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={18} /> Últimas Sesiones
                        </h3>
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <tbody>
                                {EXPERT_DETAILS.history.map(session => (
                                    <tr key={session.id} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 600 }}>{session.user}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>{session.service}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600 }}>${session.amount}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>{session.date}</div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                                            {session.status === 'completed' ?
                                                <CheckCircle size={16} color="rgb(var(--success))" /> :
                                                <AlertCircle size={16} color="rgb(var(--error))" />
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
