"use client";

import { Video, Play, Download, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';

const RECORDINGS = [
    {
        id: 1,
        title: 'Asesoría de Estilo - Revisión Armario',
        expert: 'Laura García',
        date: '12 Ene 2024',
        duration: '45 min',
        thumbnail: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', // Placeholder gradient
        size: '250 MB'
    },
    {
        id: 2,
        title: 'Consulta Técnica - Configuración OBS',
        expert: 'Carlos Ruiz',
        date: '05 Ene 2024',
        duration: '1h 10m',
        thumbnail: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
        size: '420 MB'
    }
];

export default function UserRecordingsPage() {
    return (
        <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mis Grabaciones</h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {RECORDINGS.map(rec => (
                    <div key={rec.id} style={{
                        background: 'rgb(var(--surface))',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {/* Thumbnail Placeholder */}
                        <div style={{
                            height: '180px',
                            background: rec.thumbnail,
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{
                                width: '50px', height: '50px',
                                borderRadius: '50%',
                                background: 'rgba(0,0,0,0.3)',
                                backdropFilter: 'blur(4px)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white'
                            }}>
                                <Play size={24} fill="white" />
                            </div>
                            <span style={{
                                position: 'absolute', bottom: '10px', right: '10px',
                                background: 'rgba(0,0,0,0.7)', color: 'white',
                                padding: '2px 6px', borderRadius: '4px',
                                fontSize: '0.75rem', fontWeight: 600
                            }}>
                                {rec.duration}
                            </span>
                        </div>

                        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem', lineHeight: 1.3 }}>
                                {rec.title}
                            </h3>
                            <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                con {rec.expert}
                            </p>

                            <div style={{
                                display: 'flex', gap: '1rem',
                                color: 'rgb(var(--text-muted))',
                                fontSize: '0.85rem',
                                marginBottom: '1.5rem',
                                marginTop: 'auto'
                            }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Calendar size={14} /> {rec.date}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <Video size={14} /> {rec.size}
                                </span>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <Button variant="primary" size="sm" style={{ flex: 1 }}>
                                    Ver Ahora
                                </Button>
                                <Button variant="outline" size="sm">
                                    <Download size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {RECORDINGS.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    color: 'rgb(var(--text-secondary))',
                    border: '2px dashed rgb(var(--border))',
                    borderRadius: 'var(--radius-lg)'
                }}>
                    <Video size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>No tienes grabaciones</h3>
                    <p>Las grabaciones de tus sesiones virtuales aparecerán aquí.</p>
                </div>
            )}
        </div>
    );
}
