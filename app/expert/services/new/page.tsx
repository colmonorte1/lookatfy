"use client";

import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ArrowLeft, Save, Plus, X, Check, XCircle, Upload, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

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

// (ChecklistSection component logic here)

export default function NewServicePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [price, setPrice] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Virtual');

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [includes, setIncludes] = useState<string[]>([]);
    const [notIncludes, setNotIncludes] = useState<string[]>([]);

    const addInclude = (item: string) => setIncludes([...includes, item]);
    const removeInclude = (idx: number) => setIncludes(includes.filter((_, i) => i !== idx));

    const addNotInclude = (item: string) => setNotIncludes([...notIncludes, item]);
    const removeNotInclude = (idx: number) => setNotIncludes(notIncludes.filter((_, i) => i !== idx));

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const supabase = createClient();

            // 1. Get Current User
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("No user found");

            // 2. Get Expert ID
            const { data: expert, error: expertError } = await supabase
                .from('experts')
                .select('id')
                .eq('id', user.id)
                .single();

            if (expertError) throw new Error("Expert profile not found");

            // 3. Upload Image (if selected)
            let imageUrl = null;
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `service-${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('service-images')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('service-images').getPublicUrl(filePath);
                imageUrl = data.publicUrl;
            }

            // 4. Insert Service
            const { error: insertError } = await supabase
                .from('services')
                .insert({
                    expert_id: expert.id,
                    title,
                    description,
                    price: parseFloat(price) || 0,
                    duration: parseInt(duration) || 60,
                    category: 'General',
                    includes: includes,
                    not_includes: notIncludes,
                    image_url: imageUrl, // Add image url
                    type: type // Add type enum
                });

            if (insertError) throw insertError;

            // 5. Redirect
            router.push('/expert/services');
            router.refresh();

        } catch (error: any) {
            console.error("Error creating service:", error);
            alert(`Error creating service: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

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
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Image Upload Section */}
                    <div>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', display: 'block' }}>Portada del Servicio</label>
                        <div style={{
                            border: '2px dashed rgb(var(--border))',
                            borderRadius: 'var(--radius-md)',
                            padding: '1.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            background: previewUrl ? 'black' : 'transparent',
                            minHeight: '200px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {previewUrl ? (
                                <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                                    <Image
                                        src={previewUrl}
                                        alt="Preview"
                                        fill
                                        style={{ objectFit: 'contain' }}
                                    />
                                    <div style={{
                                        position: 'absolute', inset: 0,
                                        background: 'rgba(0,0,0,0.5)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: 0, transition: 'opacity 0.2s'
                                    }}
                                        className="hover:opacity-100"
                                    >
                                        <p style={{ color: 'white', fontWeight: 500 }}>Cambiar imagen</p>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: 'rgb(var(--text-muted))' }}>
                                    <ImageIcon size={40} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                    <p>Haz clic para subir una imagen</p>
                                    <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>(JPG, PNG - Max 2MB)</p>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                            />
                        </div>
                    </div>

                    <Input
                        label="Nombre del Servicio"
                        placeholder="Ej: Acompañamiento de Compras"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Tipo de Servicio</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                style={{
                                    padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))', fontFamily: 'inherit',
                                    background: 'rgb(var(--background))'
                                }}
                            >
                                <option value="Virtual">Virtual (Videollamada)</option>
                                <option value="Presencial">Presencial (Acompañamiento)</option>
                            </select>
                        </div>
                        <Input
                            label="Duración (minutos)"
                            type="number"
                            placeholder="Ej: 60"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Input
                            label="Precio ($)"
                            type="number"
                            placeholder="0.00"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            required
                        />
                        <Input
                            label="Ciudad / Ubicación (Opcional)"
                            placeholder="Ej: Madrid, Online"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
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
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
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
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Estado: Se creará como Activo</span>
                        </div>
                        <Button type="submit" disabled={isLoading} style={{ gap: '0.5rem' }}>
                            <Save size={18} />
                            {isLoading ? 'Guardando...' : 'Guardar Servicio'}
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
