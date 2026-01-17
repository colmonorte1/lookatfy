"use client";

import { useState } from 'react';
import { Eye, Ban, CheckCircle, XCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Modal } from '@/components/ui/Modal/Modal';

// Enhanced Mock Data
const SERVICES = [
    {
        id: 1,
        title: 'Asesoría de Estilo Completa',
        expert: 'Laura García',
        category: 'Moda',
        price: 120,
        status: 'active',
        description: 'Una sesión intensiva de 2 horas donde analizaremos tu armario, definiremos tu paleta de colores y crearemos outfits ganadores para la temporada.',
        includes: ['Análisis de colorimetría', 'Revisión de armario (virtual)', 'Guía PDF personalizada', '3 Looks completos'],
        notIncludes: ['Compras físicas', 'Maquillaje'],
        createdAt: '2023-11-15 10:30 AM'
    },
    {
        id: 2,
        title: 'Configuración de Servidores Linux',
        expert: 'Carlos Ruiz',
        category: 'Tecnología',
        price: 80,
        status: 'review',
        description: 'Te ayudo a configurar tu servidor VPS desde cero. Seguridad, firewall, y despliegue de tu primera aplicación Node.js o Python.',
        includes: ['Setup inicial Ubuntu/Debian', 'Configuración Nginx', 'Certificado SSL (Let\'s Encrypt)', 'Firewall UFW'],
        notIncludes: ['Mantenimiento mensual', 'Migración de bases de datos complejas'],
        createdAt: '2024-01-10 14:20 PM'
    },
    {
        id: 3,
        title: 'Clase de Yoga Inicial',
        expert: 'Ana Vega',
        category: 'Salud',
        price: 30,
        status: 'active',
        description: 'Clase introductoria al Hatha Yoga. Aprenderemos las posturas básicas, respiración consciente y relajación final.',
        includes: ['Sesión de 60 min', 'Corrección de posturas en vivo', 'Grabación de la clase'],
        notIncludes: ['Material de yoga (esterilla, bloques)', 'Consulta médica'],
        createdAt: '2023-12-05 09:00 AM'
    },
    {
        id: 4,
        title: 'Consultoría SEO Avanzada',
        expert: 'Juan Pérez',
        category: 'Marketing',
        price: 150,
        status: 'banned',
        description: 'Auditoría completa de tu sitio web para mejorar el ranking en Google. Keyword research y estrategia de contenidos.',
        includes: ['Auditoría técnica', 'Plan de contenidos', 'Análisis de competencia'],
        notIncludes: ['Implementación de código', 'Redacción de artículos'],
        createdAt: '2024-01-12 11:45 AM'
    },
];

export default function AdminServicesPage() {
    const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);

    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Catálogo de Servicios</h1>

            <div style={{
                background: 'rgb(var(--surface))',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                overflow: 'hidden'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgb(var(--surface-hover))', textAlign: 'left', fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>
                            <th style={{ padding: '1rem' }}>Servicio</th>
                            <th style={{ padding: '1rem' }}>Experto</th>
                            <th style={{ padding: '1rem' }}>Categoría</th>
                            <th style={{ padding: '1rem' }}>Precio</th>
                            <th style={{ padding: '1rem' }}>Estado</th>
                            <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {SERVICES.map(service => (
                            <tr key={service.id} style={{ borderBottom: '1px solid rgb(var(--border))', fontSize: '0.9rem' }}>
                                <td style={{ padding: '1rem', fontWeight: 600 }}>{service.title}</td>
                                <td style={{ padding: '1rem' }}>{service.expert}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        background: 'rgb(var(--surface-hover))', padding: '0.2rem 0.6rem',
                                        borderRadius: '4px', fontSize: '0.8rem'
                                    }}>
                                        {service.category}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>${service.price}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        textTransform: 'capitalize',
                                        padding: '0.2rem 0.6rem', borderRadius: '1rem',
                                        fontSize: '0.8rem', fontWeight: 600,
                                        background: service.status === 'active' ? 'rgba(var(--success), 0.1)' :
                                            service.status === 'review' ? 'rgba(var(--warning), 0.1)' :
                                                'rgba(var(--error), 0.1)',
                                        color: service.status === 'active' ? 'rgb(var(--success))' :
                                            service.status === 'review' ? 'rgb(var(--warning))' :
                                                'rgb(var(--error))'
                                    }}>
                                        {service.status === 'review' ? 'En Revisión' : service.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            title="Ver Detalle"
                                            onClick={() => setSelectedService(service)}
                                        >
                                            <Eye size={18} />
                                        </Button>
                                        {service.status !== 'active' && (
                                            <Button size="sm" style={{ background: 'rgb(var(--success))', width: '32px', padding: 0 }} title="Aprobar">
                                                <CheckCircle size={18} />
                                            </Button>
                                        )}
                                        {service.status !== 'banned' && (
                                            <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--error))' }} title="Suspender">
                                                <Ban size={18} />
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Service Details Modal */}
            <Modal
                isOpen={!!selectedService}
                onClose={() => setSelectedService(null)}
                title="Detalles del Servicio"
            >
                {selectedService && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Header Info */}
                        <div style={{ paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{selectedService.title}</h3>
                            <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))', fontSize: '0.9rem' }}>
                                <span>Por <strong>{selectedService.expert}</strong></span>
                                <span>•</span>
                                <span>Creado el {selectedService.createdAt}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Descripción</h4>
                            <p style={{ lineHeight: 1.6, color: 'rgb(var(--text-secondary))' }}>
                                {selectedService.description}
                            </p>
                        </div>

                        {/* Lists */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <CheckCircle size={16} color="rgb(var(--success))" /> Qué incluye
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {selectedService.includes.map((item, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', fontSize: '0.9rem', color: 'rgb(var(--text-main))' }}>
                                            <Check size={14} style={{ marginTop: '3px', color: 'rgb(var(--success))' }} />
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <XCircle size={16} color="rgb(var(--text-muted))" /> Qué NO incluye
                                </h4>
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {selectedService.notIncludes.map((item, i) => (
                                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', fontStyle: 'italic' }}>
                                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgb(var(--text-muted))' }}></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgb(var(--border))', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <Button variant="outline" onClick={() => setSelectedService(null)}>Cerrar</Button>
                            {selectedService.status === 'review' && (
                                <Button style={{ background: 'rgb(var(--success))' }}>
                                    <CheckCircle size={18} style={{ marginRight: '0.5rem' }} /> Aprobar Servicio
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
