"use client";

import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Save, User, MapPin } from 'lucide-react';
import Image from 'next/image';

export default function ExpertProfileSettingsPage() {
    return (
        <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mi Perfil Público</h1>

            <div style={{
                background: 'rgb(var(--surface))',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))'
            }}>
                <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>

                    {/* Avatar Section */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{
                            width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden',
                            background: 'rgb(var(--surface-hover))', border: '1px solid rgb(var(--border))'
                        }}>
                            <Image
                                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
                                alt="Avatar"
                                width={100} height={100}
                            />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Foto de Perfil</h3>
                            <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.75rem' }}>
                                Se recomienda una foto profesional 400x400px.
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <Button variant="outline" size="sm">Cambiar Foto</Button>
                                <Button variant="ghost" size="sm" style={{ color: 'rgb(var(--error))' }}>Eliminar</Button>
                            </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgb(var(--border))', width: '100%' }} />

                    {/* Form Fields */}
                    <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <Input label="Nombre" defaultValue="Ana" />
                            <Input label="Apellido" defaultValue="Silva" />
                        </div>

                        <Input label="Título Profesional" defaultValue="Consultora de Tecnología Personal" />

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Biografía</label>
                            <textarea
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))',
                                    fontFamily: 'inherit',
                                    minHeight: '120px',
                                    resize: 'vertical'
                                }}
                                defaultValue="Te ayudo a elegir tu próximo computador, configurar tu oficina en casa o resolver problemas técnicos complejos en minutos."
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <Input label="Precio por Hora ($)" type="number" defaultValue={25} />
                            <Input label="Ubicación (Opcional)" icon={<MapPin size={16} />} defaultValue="Madrid, España" />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                            <Button type="submit" style={{ gap: '0.5rem' }}>
                                <Save size={18} />
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
