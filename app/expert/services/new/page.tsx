"use client";

import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ArrowLeft, Save, Plus, X, Check, XCircle, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, type ComponentType } from 'react';
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

// (ChecklistSection component logic here)

export default function NewServicePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState('');
    const [price, setPrice] = useState('');
    const [country, setCountry] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('Virtual');
    const [category, setCategory] = useState('');
    const [categoryOptions, setCategoryOptions] = useState<string[]>(['General']);
    const [currency, setCurrency] = useState('USD');
    const [currencyOptions, setCurrencyOptions] = useState<string[]>(['USD', 'EUR', 'MXN']);
    const [serviceTypeOptions, setServiceTypeOptions] = useState<string[]>([]);
    const normalizeServiceType = (val: string): 'Virtual' | 'Presencial' | null => {
        const t = val.toLowerCase().trim();
        if (t.startsWith('virt') || t.includes('video')) return 'Virtual';
        if (t.startsWith('prese') || t.includes('acompa') || t.includes('in person')) return 'Presencial';
        if (t === 'virtual') return 'Virtual';
        if (t === 'presencial') return 'Presencial';
        return null;
    };

    // Image State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [includes, setIncludes] = useState<string[]>([]);
    const [notIncludes, setNotIncludes] = useState<string[]>([]);
    const [requirementsList, setRequirementsList] = useState<string[]>([]);
    const [benefitsList, setBenefitsList] = useState<string[]>([]);
    const [priceError, setPriceError] = useState('');
    const [durationError, setDurationError] = useState('');
    const [currencyMeta, setCurrencyMeta] = useState<Record<string, number>>({});
    const [countryOptions, setCountryOptions] = useState<string[]>([]);

    const addInclude = (item: string) => setIncludes([...includes, item]);
    const removeInclude = (idx: number) => setIncludes(includes.filter((_, i) => i !== idx));


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    // Fetch categories from master table (fallback to distinct from services)
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
                if (settings?.currency) setCurrency(settings.currency);
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

    // Fetch active countries for dropdown
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

    // Fetch service types for "Tipo de Servicio" (normalized to allowed enum)
    useEffect(() => {
        (async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase.from('service_types').select('name').order('name');
                type TRow = { name: string | null };
                const rawNames = Array.from(new Set(((data || []) as TRow[]).map((t) => t.name).filter((n): n is string => !!n)));
                const options = rawNames.length ? rawNames : ['Virtual', 'Presencial'];
                setServiceTypeOptions(options);
                if (options.length) setType(prev => prev || options[0]);
            } catch {
                setServiceTypeOptions(['Virtual', 'Presencial']);
            }
        })();
    }, []);

    // Real-time validation for price and duration
    useEffect(() => {
        const p = parseFloat(price);
        const d = parseInt(duration);
        setPriceError(isNaN(p) || p < 5 ? 'Precio mínimo 5' : '');
        setDurationError(isNaN(d) || d < 15 ? 'Duración mínima 15 minutos' : '');
    }, [price, duration]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (priceError || durationError) {
            alert('Corrige los campos de precio y duración');
            setIsLoading(false);
            return;
        }

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

            // 4. Validate title length & category
            if (title.trim().length === 0) throw new Error('El nombre del servicio es requerido');
            if (title.trim().length > 60) throw new Error('El nombre del servicio no puede exceder 60 caracteres');
            if (!category) throw new Error('Debes seleccionar una categoría');

            const requirementsText = [
                benefitsList.length ? `Beneficios: ${benefitsList.join('; ')}` : '',
                requirementsList.length ? `Requisitos: ${requirementsList.join('; ')}` : ''
            ].filter(Boolean).join(' | ');

            const typeCanonical = (type === 'Virtual' || type === 'Presencial') ? type : normalizeServiceType(type) || null;
            if (!typeCanonical) throw new Error('Selecciona un tipo de servicio válido');

            const basePayload = {
                expert_id: expert.id,
                title,
                description,
                price: parseFloat(price) || 0,
                duration: parseInt(duration) || 60,
                category,
                includes: includes,
                not_includes: notIncludes,
                image_url: imageUrl,
                type: typeCanonical,
                requirements: requirementsText
            };
            const payloadWithRegion = { ...basePayload, country, currency };

            const payloadWithArrays = { ...basePayload, country, currency, benefits: benefitsList, client_requirements: requirementsList };
            const { error: insertErrArrays } = await supabase
                .from('services')
                .insert(payloadWithArrays);
            if (insertErrArrays) {
                if (insertErrArrays.code === '42703') {
                    const { error: insertErrLegacy } = await supabase
                        .from('services')
                        .insert(payloadWithRegion);
                    if (insertErrLegacy) throw insertErrLegacy;
                } else {
                    throw insertErrArrays;
                }
            }

            // 7. Redirect
            router.push('/expert/services');
            router.refresh();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error creating service:", message);
            alert(`Error creating service: ${message}`);
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
                        onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                        required
                    />
                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>{title.length}/60</div>

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
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Bloques de sesión</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {[15, 30, 60].map((d) => (
                                    <button
                                        key={d}
                                        type="button"
                                        onClick={() => setDuration(String(d))}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            borderRadius: 'var(--radius-md)',
                                            border: '1px solid rgb(var(--border))',
                                            background: duration === String(d) ? 'rgba(var(--primary), 0.1)' : 'rgb(var(--surface))',
                                            color: 'rgb(var(--text-secondary))',
                                            cursor: 'pointer'
                                        }}
                                    >{d} min</button>
                                ))}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>
                                Son los espacios de tiempo entre una sesión y otra. Elige la duración que usarás para agendar tus citas.
                            </div>
                        </div>
                    </div>

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

                    {/* Checklists */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '1rem 0' }}>
                        <ChecklistSection
                            title="Qué incluye"
                            placeholder="Ej: Grabación de la sesión"
                            items={includes}
                            onAdd={addInclude}
                            onRemove={removeInclude}
                            icon={Check}
                        />
                        <ChecklistSection
                            title="Qué NO incluye"
                            placeholder="Ej: Compra de prendas"
                            items={notIncludes}
                            onAdd={(item) => setNotIncludes([...notIncludes, item])}
                            onRemove={(idx) => setNotIncludes(notIncludes.filter((_, i) => i !== idx))}
                            icon={XCircle}
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
