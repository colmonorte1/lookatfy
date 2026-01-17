"use client";

import { Button } from '@/components/ui/Button/Button';
import { Plus, Edit2, Trash2, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';

const SERVICES = [
    {
        id: 1,
        title: 'Acompañamiento de Compras Tech',
        type: 'Presencial',
        price: 45,
        location: 'Madrid, Centro',
        duration: '2 horas',
        status: 'active',
        includes: ['Ruta personalizada', 'Asesoría de imagen', 'Descuentos excl.'],
        notIncludes: ['Transporte', 'Coste de prendas']
    },
    {
        id: 2,
        title: 'Asesoría Online Express',
        type: 'Virtual',
        price: 25,
        location: 'Online',
        duration: '45 min',
        status: 'active',
        includes: ['Video llamada 45min', 'Grabación de sesión'],
        notIncludes: ['Dossier PDF', 'Revisiones extra']
    },
];

export default function ExpertServicesPage() {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Mis Servicios</h1>
                <Link href="/expert/services/new">
                    <Button style={{ gap: '0.5rem' }}>
                        <Plus size={18} />
                        Nuevo Servicio
                    </Button>
                </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {SERVICES.map(service => (
                    <div key={service.id} style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <span style={{
                                    fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase',
                                    color: service.type === 'Virtual' ? 'rgb(var(--primary))' : 'rgb(var(--secondary))',
                                    background: service.type === 'Virtual' ? 'rgba(var(--primary), 0.1)' : 'rgba(var(--secondary), 0.1)',
                                    padding: '0.25rem 0.5rem', borderRadius: '1rem'
                                }}>
                                    {service.type}
                                </span>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: '0.5rem', lineHeight: 1.3 }}>
                                    {service.title}
                                </h3>
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                ${service.price}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={16} />
                                {service.location}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={16} />
                                {service.duration}
                            </div>
                        </div>

                        {/* Inclusions Section */}
                        <div style={{
                            margin: '0.5rem 0',
                            padding: '0.75rem',
                            background: 'rgb(var(--background))',
                            borderRadius: '8px',
                            fontSize: '0.85rem'
                        }}>
                            {service.includes && service.includes.length > 0 && (
                                <div style={{ marginBottom: service.notIncludes?.length ? '0.5rem' : 0 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'rgb(var(--success))' }}>Incluye:</div>
                                    <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                                        {service.includes.map((item, idx) => (
                                            <li key={idx} style={{ color: 'rgb(var(--text-secondary))' }}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {service.notIncludes && service.notIncludes.length > 0 && (
                                <div>
                                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'rgb(var(--text-muted))' }}>No incluye:</div>
                                    <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                                        {service.notIncludes.map((item, idx) => (
                                            <li key={idx} style={{ color: 'rgb(var(--text-muted))', fontStyle: 'italic' }}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <Link href={`/expert/services/${service.id}/edit`}>
                                <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--text-secondary))' }}>
                                    <Edit2 size={16} />
                                </Button>
                            </Link>
                            <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--error))' }}>
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
