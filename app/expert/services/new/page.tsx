"use client";

import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ArrowLeft, Save, Plus, X, Check, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// --- Local Component: Checklist Input ---
function ChecklistSection({
    title,
    placeholder,
    items,
    onAdd,
    onRemove,
    icon: Icon
}: {
    title: string;
    placeholder: string;
    items: string[];
    onAdd: (item: string) => void;
    onRemove: (index: number) => void;
    icon: any;
}) {
    const [inputValue, setInputValue] = useState('');

    const handleAdd = () => {
        if (!inputValue.trim()) return;
        onAdd(inputValue.trim());
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAdd();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Icon size={16} /> {title}
            </label>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{ flex: 1 }}>
                    <Input
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                </div>
                <Button variant="secondary" onClick={handleAdd} type="button" style={{ padding: '0 1rem' }}>
                    <Plus size={20} />
                </Button>
            </div>

            {items.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {items.map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            background: 'rgb(var(--background))',
                            padding: '0.5rem 0.75rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))',
                            fontSize: '0.9rem'
                        }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgb(var(--text-muted))' }} />
                                {item}
                            </span>
                            <button
                                onClick={() => onRemove(idx)}
                                type="button"
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgb(var(--text-muted))', display: 'flex' }}
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function NewServicePage() {
    const [includes, setIncludes] = useState<string[]>([]);
    const [notIncludes, setNotIncludes] = useState<string[]>([]);

    const addInclude = (item: string) => setIncludes([...includes, item]);
    const removeInclude = (idx: number) => setIncludes(includes.filter((_, i) => i !== idx));

    const addNotInclude = (item: string) => setNotIncludes([...notIncludes, item]);
    const removeNotInclude = (idx: number) => setNotIncludes(notIncludes.filter((_, i) => i !== idx));

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/expert/services" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    color: 'rgb(var(--text-secondary))', fontSize: '0.9rem',
                    fontWeight: 500, marginBottom: '1rem'
                }}>
                    <ArrowLeft size={16} />
                    Volver a Servicios
                </Link>
                <h1 style={{ fontSize: '2rem' }}>Nuevo Servicio</h1>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))'
            }}>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <Input label="Nombre del Servicio" placeholder="Ej: Acompañamiento de Compras - 2 horas" />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tipo de Servicio</label>
                            <select style={{
                                padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                border: '1px solid rgb(var(--border))', fontFamily: 'inherit',
                                background: 'rgb(var(--background))'
                            }}>
                                <option value="virtual">Virtual (Videollamada)</option>
                                <option value="presencial">Presencial (Acompañamiento)</option>
                                <option value="hibrido">Híbrido</option>
                            </select>
                        </div>
                        <Input label="Duración Estimada" placeholder="Ej: 45 min, 2 horas" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Input label="Precio ($)" type="number" placeholder="0.00" />
                        <Input label="Ciudad / Ubicación" placeholder="Ej: Madrid, Online" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Descripción Detallada</label>
                        <textarea
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgb(var(--border))',
                                fontFamily: 'inherit',
                                minHeight: '100px',
                                resize: 'vertical',
                                background: 'rgb(var(--background))'
                            }}
                            placeholder="Describe en qué consiste el servicio..."
                        />
                    </div>

                    {/* Checklists */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '1rem 0' }}>
                        <ChecklistSection
                            title="¿Qué incluye?"
                            placeholder="Ej: Grabación de la sesión"
                            items={includes}
                            onAdd={addInclude}
                            onRemove={removeInclude}
                            icon={Check}
                        />
                        <ChecklistSection
                            title="¿Qué NO incluye?"
                            placeholder="Ej: Compra de prendas"
                            items={notIncludes}
                            onAdd={addNotInclude}
                            onRemove={removeNotInclude}
                            icon={XCircle}
                        />
                    </div>

                    <div style={{ height: '1px', background: 'rgb(var(--border))', margin: '1rem 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Estado: Activo</span>
                        </div>
                        <Button style={{ gap: '0.5rem' }}>
                            <Save size={18} />
                            Guardar Servicio
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
