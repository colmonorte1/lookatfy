"use client";

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

// Mock data fetcher
const getServiceById = (id: string) => {
    // Return mock data based on ID
    return {
        id,
        title: id === '1' ? 'Acompañamiento de Compras Tech' : 'Asesoría Online Express',
        type: id === '1' ? 'Presencial' : 'Virtual',
        price: id === '1' ? 45 : 25,
        location: id === '1' ? 'Madrid, Centro' : 'Online',
        duration: id === '1' ? '2 horas' : '45 min',
        description: 'Servicio detallado de prueba...'
    };
};

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    // Unwrap params using React.use() for Next.js 15+
    const { id } = use(params);

    // In a real app, use useEffect to fetch data. Here we mock it synchronously for simplicity or assume it's available.
    // For this prototype, we'll just set initial state to some defaults to avoid complex fetching logic in a client component without a real backend.
    const [isLoading, setIsLoading] = useState(false);
    const mockService = getServiceById(id);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            router.push('/expert/services');
        }, 1000);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/expert/services" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgb(var(--text-secondary))', textDecoration: 'none' }}>
                <ArrowLeft size={18} /> Volver a mis servicios
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Editar Servicio</h1>
                <Button variant="ghost" style={{ color: 'rgb(var(--error))', gap: '0.5rem' }}>
                    <Trash2 size={18} /> Eliminar
                </Button>
            </div>

            <form onSubmit={handleSave} style={{
                background: 'rgb(var(--surface))',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
            }}>
                <Input
                    label="Nombre del Servicio"
                    defaultValue={mockService.title}
                    required
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'rgb(var(--text-main))' }}>
                            Tipo de Servicio
                        </label>
                        <select
                            style={{
                                width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'rgb(var(--text-main))'
                            }}
                            defaultValue={mockService.type}
                        >
                            <option value="Virtual">Virtual (Videollamada)</option>
                            <option value="Presencial">Presencial</option>
                        </select>
                    </div>
                    <Input
                        label="Precio ($/€)"
                        type="number"
                        defaultValue={mockService.price}
                        required
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <Input
                        label="Duración Estimada"
                        defaultValue={mockService.duration}
                        placeholder="ej. 1 hora, 45 min"
                        required
                    />
                    <Input
                        label="Ubicación / Plataforma"
                        defaultValue={mockService.location}
                        required
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'rgb(var(--text-main))' }}>
                        Descripción
                    </label>
                    <textarea
                        style={{
                            width: '100%', minHeight: '120px', padding: '0.75rem', borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))', color: 'rgb(var(--text-main))',
                            fontFamily: 'inherit', resize: 'vertical'
                        }}
                        defaultValue={mockService.description}
                        required
                    />
                </div>

                <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Cancelar
                    </Button>
                    <Button type="submit" isLoading={isLoading} style={{ gap: '0.5rem' }}>
                        <Save size={18} /> Guardar Cambios
                    </Button>
                </div>
            </form>
        </div>
    );
}
