"use client";

import { useState, use, useEffect, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ArrowLeft, Save, Trash2, Plus, Check, X, XCircle, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

// --- Local Component: Checklist Input (Copied from NewServicePage) ---
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
    icon: ComponentType<{ size?: number }>;
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

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    // Form inputs
    const [title, setTitle] = useState('');
    const [type, setType] = useState('Virtual');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [includes, setIncludes] = useState<string[]>([]);
    const [notIncludes, setNotIncludes] = useState<string[]>([]);
    const [category, setCategory] = useState('');
    const [currency, setCurrency] = useState('USD');
    const [country, setCountry] = useState('');
    const [requirements, setRequirements] = useState('');
    const [requirementsList, setRequirementsList] = useState<string[]>([]);
    const [benefitsList, setBenefitsList] = useState<string[]>([]);

    // Dropdown data
    const [currencyOptions, setCurrencyOptions] = useState<string[]>(['USD', 'EUR', 'MXN']);
    const [currencyMeta, setCurrencyMeta] = useState<Record<string, number>>({});
    const [countryOptions, setCountryOptions] = useState<string[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<string[]>(['General']);
    const [serviceTypeOptions, setServiceTypeOptions] = useState<string[]>([]);

    const normalizeServiceType = (val: string): 'Virtual' | 'Presencial' | null => {
        const t = val.toLowerCase().trim();
        if (t.startsWith('virt') || t.includes('video')) return 'Virtual';
        if (t.startsWith('prese') || t.includes('acompa') || t.includes('in person')) return 'Presencial';
        if (t === 'virtual') return 'Virtual';
        if (t === 'presencial') return 'Presencial';
        return null;
    };

    // Field validation
    const [priceError, setPriceError] = useState('');
    const [durationError, setDurationError] = useState('');

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

    useEffect(() => {
        const fetchService = async () => {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                console.error("Error fetching service:", error);
                return;
            }

            if (data) {
                setTitle(data.title);
                setType(data.type || 'Virtual');
                setPrice(data.price?.toString() || '');
                setDuration(data.duration?.toString() || '');
                setDescription(data.description || '');
                setIncludes(data.includes || []);
                setNotIncludes(data.not_includes || []);
                setCategory(data.category || '');
                setCountry(data.country || '');
                setCurrency(data.currency || 'USD');
                setRequirements(data.requirements || '');
                const reqText = data.requirements || '';
                const parts = reqText.split(' | ');
                const b = parts.find((p: string) => p.startsWith('Beneficios:')) || '';
                const r = parts.find((p: string) => p.startsWith('Requisitos:')) || '';
                const bItems = b.replace('Beneficios:', '').split(';').map((s: string) => s.trim()).filter(Boolean);
                const rItems = r.replace('Requisitos:', '').split(';').map((s: string) => s.trim()).filter(Boolean);
                if (bItems.length) setBenefitsList(bItems);
                if (rItems.length) setRequirementsList(rItems);
                if (data.image_url) {
                    setOriginalImageUrl(data.image_url);
                    setPreviewUrl(data.image_url);
                }
            }
            setIsFetching(false);
        };

        fetchService();
    }, [id]);

    // Fetch categories
    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const { data: catData } = await supabase
                    .from('service_categories')
                    .select('name')
                    .order('name');
                type CatRow = { name: string | null };
                const names = Array.from(new Set(((catData || []) as CatRow[]).map((d) => d.name).filter((c): c is string => !!c)));
                if (names.length) {
                    setCategoryOptions(names);
                    return;
                }
            } catch {}

            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from('services')
                    .select('category')
                    .not('category', 'is', null);
                type CategoryRow = { category: string | null };
                const cats = Array.from(new Set(((data || []) as CategoryRow[]).map((d) => d.category).filter((c): c is string => !!c)));
                setCategoryOptions(cats.length ? cats : ['General', 'Moda', 'Tecnología', 'Salud', 'Legal', 'Turismo', 'Otros']);
            } catch {
                setCategoryOptions(['General', 'Moda', 'Tecnología', 'Salud', 'Legal', 'Turismo', 'Otros']);
            }
        })();
    }, []);

    // Fetch platform currency and active currencies
    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const [{ data: settings }, { data: currs }] = await Promise.all([
                    supabase.from('platform_settings').select('currency').single(),
                    supabase.from('active_currencies').select('code, decimals').order('name')
                ]);
                type Row = { code: string | null; decimals?: number | null };
                const codes = Array.from(new Set(((currs || []) as Row[]).map((c) => c.code).filter((c): c is string => !!c)));
                if (codes.length) setCurrencyOptions(codes);
                if (settings?.currency) setCurrency((prev) => prev || settings.currency);
                const map: Record<string, number> = {};
                ((currs || []) as Row[]).forEach(r => {
                    if (r.code) map[r.code] = typeof r.decimals === 'number' ? r.decimals : 2;
                });
                setCurrencyMeta(map);
            } catch {
                setCurrencyOptions(['USD', 'EUR', 'MXN']);
            }
        })();
    }, []);

    // Fetch active countries
    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase.from('active_countries').select('name').order('name');
                type CRow = { name: string | null };
                const names = Array.from(new Set(((data || []) as CRow[]).map((c) => c.name).filter((n): n is string => !!n)));
                setCountryOptions(names);
            } catch {
                setCountryOptions(['España', 'México', 'Colombia', 'Argentina', 'USA']);
            }
        })();
    }, []);

    // Fetch service types for "Tipo de Servicio"
    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase.from('service_types').select('name').order('name');
                type TRow = { name: string | null };
                const names = Array.from(new Set(((data || []) as TRow[]).map((t) => t.name).filter((n): n is string => !!n)));
                // Ensure current type is present to avoid losing selection
                const merged = Array.from(new Set([type, ...names].filter((n): n is string => !!n)));
                setServiceTypeOptions(merged);
            } catch {
                setServiceTypeOptions(['Virtual', 'Presencial']);
            }
        })();
    }, [type]);

    const getCurrencyDecimals = (code: string) => {
        if (currencyMeta[code] !== undefined) return currencyMeta[code];
        switch (code) {
            case 'JPY':
            case 'CLP':
                return 0;
            default:
                return 2;
        }
    };
    const decimals = getCurrencyDecimals(currency);
    const step = decimals === 0 ? '1' : `0.${'0'.repeat(decimals - 1)}1`;
    const handlePriceBlur = () => {
        const n = Number(price);
        if (!isNaN(n)) {
            setPrice(n.toFixed(decimals));
        }
    };

    const addInclude = (item: string) => setIncludes([...includes, item]);
    const removeInclude = (idx: number) => setIncludes(includes.filter((_, i) => i !== idx));

    const addNotInclude = (item: string) => setNotIncludes([...notIncludes, item]);
    const removeNotInclude = (idx: number) => setNotIncludes(notIncludes.filter((_, i) => i !== idx));

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size (2MB max)
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (file.size > maxSize) {
                alert('La imagen es demasiado grande. El tamaño máximo es 2MB.');
                e.target.value = ''; // Clear the input
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                alert('Formato de imagen no válido. Usa JPG, PNG o WebP.');
                e.target.value = ''; // Clear the input
                return;
            }

            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // VALIDATION FIRST - Before starting any async operations
        const p = parseFloat(price);
        const d = parseInt(duration);
        setPriceError(isNaN(p) || p < 5 ? 'Precio mínimo 5' : '');
        setDurationError(isNaN(d) || d < 15 ? 'Duración mínima 15 minutos' : '');

        if (isNaN(p) || p < 5 || isNaN(d) || d < 15) {
            alert('Por favor corrige los errores de validación antes de guardar');
            return;
        }

        if (title.trim().length === 0) {
            alert('El nombre del servicio es requerido');
            return;
        }

        if (!category) {
            alert('Debes seleccionar una categoría');
            return;
        }

        setIsLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error("No authenticated user");

            // Upload new image if selected
            let finalImageUrl = originalImageUrl;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `service-${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('service-images')
                    .upload(filePath, imageFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('service-images').getPublicUrl(filePath);
                finalImageUrl = data.publicUrl;
            }

            const typeCanonical = (type === 'Virtual' || type === 'Presencial') ? type : normalizeServiceType(type) || null;
            if (!typeCanonical) throw new Error('Selecciona un tipo de servicio válido');

            const basePayload = {
                title,
                type: typeCanonical,
                price: p,
                duration: d,
                description,
                includes,
                not_includes: notIncludes,
                image_url: finalImageUrl,
                category,
                requirements: [
                    requirements,
                    benefitsList.length ? `Beneficios: ${benefitsList.join('; ')}` : '',
                    requirementsList.length ? `Requisitos: ${requirementsList.join('; ')}` : ''
                ].filter(Boolean).join(' | ')
            } as Record<string, unknown>;

            const payloadWithRegion = { ...basePayload, country, currency };

            const payloadWithArrays = { ...basePayload, country, currency, benefits: benefitsList, client_requirements: requirementsList };
            const { error: updArrays } = await supabase
                .from('services')
                .update(payloadWithArrays)
                .eq('id', id);
            if (updArrays) {
                if (updArrays.code === '42703') {
                    const { error: updLegacy } = await supabase
                        .from('services')
                        .update(payloadWithRegion)
                        .eq('id', id);
                    if (updLegacy) throw updLegacy;
                } else {
                    throw updArrays;
                }
            }

            router.push('/expert/services');
            router.refresh();

        } catch (error: unknown) {
            let message = 'Error desconocido';
            if (error instanceof Error) {
                message = error.message;
            } else if (error && typeof error === 'object') {
                const errObj = error as Record<string, unknown>;
                if (typeof errObj.message === 'string') {
                    message = errObj.message;
                } else {
                    try { message = JSON.stringify(errObj); } catch {}
                }
            } else {
                message = String(error);
            }
            console.error("Error updating service:", message);
            alert(`Error al actualizar: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar este servicio? El servicio dejará de ser visible para los clientes.")) return;
        setIsLoading(true);

        try {
            const supabase = createClient();
            // Soft delete: update status to 'deleted' instead of hard delete
            const { error } = await supabase
                .from('services')
                .update({ status: 'deleted' })
                .eq('id', id);

            if (error) throw error;

            router.push('/expert/services');
            router.refresh();
        } catch (error) {
            console.error("Error deleting service:", error);
            alert("No se pudo eliminar el servicio.");
        } finally {
            setIsLoading(false);
        }
    }

    if (isFetching) {
        return <div style={{ padding: '2rem' }}>Cargando servicio...</div>;
    }

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <Link href="/expert/services" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgb(var(--text-secondary))', textDecoration: 'none' }}>
                <ArrowLeft size={18} /> Volver a mis servicios
            </Link>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Editar Servicio</h1>
                <Button
                    variant="ghost"
                    onClick={handleDelete}
                    style={{ color: 'rgb(var(--error))', gap: '0.5rem' }}
                >
                    <Trash2 size={18} /> Eliminar
                </Button>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))'
            }}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

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
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Categoría</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                required
                                style={{
                                    padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))', fontFamily: 'inherit',
                                    background: 'rgb(var(--background))'
                                }}
                            >
                                <option value="">Selecciona una categoría</option>
                                {categoryOptions.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
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
                                {serviceTypeOptions.length === 0 ? (
                                    <>
                                        <option value="Virtual">Virtual (Videollamada)</option>
                                        <option value="Presencial">Presencial (Acompañamiento)</option>
                                    </>
                                ) : (
                                    serviceTypeOptions.map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))
                                )}
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Duración (minutos)</label>
                            <Input
                                type="number"
                                placeholder="Ej: 60"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                required
                            />
                            {durationError && (
                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--error))' }}>{durationError}</div>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Precio</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value)}
                                    style={{
                                        padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgb(var(--border))', fontFamily: 'inherit',
                                        background: 'rgb(var(--background))', maxWidth: '140px'
                                    }}
                                >
                                    {currencyOptions.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    onBlur={handlePriceBlur}
                                    step={step}
                                    required
                                />
                            </div>
                            {priceError && (
                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--error))' }}>{priceError}</div>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>País</label>
                            <select
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                style={{
                                    padding: '0.75rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))', fontFamily: 'inherit',
                                    background: 'rgb(var(--background))'
                                }}
                            >
                                <option value="">Selecciona un país</option>
                                {countryOptions.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
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
                    <div style={{ background: 'rgba(var(--primary), 0.05)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Requisitos previos</label>
                        <textarea
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgb(var(--border))',
                                fontFamily: 'inherit',
                                minHeight: '80px',
                                resize: 'vertical',
                                background: 'rgb(var(--background))'
                            }}
                            placeholder="Ej: Presupuesto aproximado, Tipo de uso..."
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '0 0 1rem 0' }}>
                        <ChecklistSection
                            title="Qué obtienes"
                            placeholder="Ej: Comparación en vivo, Recomendación personalizada"
                            items={benefitsList}
                            onAdd={(item) => setBenefitsList([...benefitsList, item])}
                            onRemove={(idx) => setBenefitsList(benefitsList.filter((_, i) => i !== idx))}
                            icon={Check}
                        />
                        <ChecklistSection
                            title="Requisitos para el cliente"
                            placeholder="Ej: Presupuesto aproximado, Tipo de uso"
                            items={requirementsList}
                            onAdd={(item) => setRequirementsList([...requirementsList, item])}
                            onRemove={(idx) => setRequirementsList(requirementsList.filter((_, i) => i !== idx))}
                            icon={XCircle}
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

                    <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                        <Button type="button" variant="outline" onClick={() => router.back()}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading} style={{ gap: '0.5rem' }}>
                            <Save size={18} />
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
