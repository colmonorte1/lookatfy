"use client";

import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { ArrowLeft, Save, Plus, X, Check, XCircle, Image as ImageIcon, HelpCircle, Eye, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, type ComponentType } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import ServiceCard from '@/components/expert/ServiceCard';

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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    // Phase 2 states
    const [showPreview, setShowPreview] = useState(false);
    const [priceSuggestion, setPriceSuggestion] = useState<{ min: number; max: number; avg: number } | null>(null);

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

    const addInclude = (item: string) => {
        if (includes.length >= 8) {
            showToast('Máximo 8 items permitidos', 'warning');
            return;
        }
        if (item.length > 100) {
            showToast('Cada item debe tener máximo 100 caracteres', 'warning');
            return;
        }
        setIncludes([...includes, item]);
        setHasUnsavedChanges(true);
    };
    const removeInclude = (idx: number) => {
        setIncludes(includes.filter((_, i) => i !== idx));
        setHasUnsavedChanges(true);
    };

    // Toast notification function
    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Remove image preview
    const handleRemoveImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
        setHasUnsavedChanges(true);
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size (2MB max)
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (file.size > maxSize) {
                showToast('La imagen es demasiado grande. El tamaño máximo es 2MB.', 'error');
                e.target.value = ''; // Clear the input
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showToast('Formato de imagen no válido. Usa JPG, PNG o WebP.', 'error');
                e.target.value = ''; // Clear the input
                return;
            }

            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setHasUnsavedChanges(true);
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

    // Warn before leaving with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedChanges]);

    // Track form changes
    useEffect(() => {
        if (title || description || price || duration || category || imageFile || includes.length > 0) {
            setHasUnsavedChanges(true);
        }
    }, [title, description, price, duration, category, imageFile, includes]);

    // Load draft from localStorage on mount
    useEffect(() => {
        const draft = localStorage.getItem('service-draft');
        if (draft) {
            try {
                const parsed = JSON.parse(draft);
                if (confirm('Se encontró un borrador guardado. ¿Deseas restaurarlo?')) {
                    setTitle(parsed.title || '');
                    setDescription(parsed.description || '');
                    setPrice(parsed.price || '');
                    setDuration(parsed.duration || '');
                    setCategory(parsed.category || '');
                    setType(parsed.type || 'Virtual');
                    setCountry(parsed.country || '');
                    setCurrency(parsed.currency || 'USD');
                    setIncludes(parsed.includes || []);
                    setNotIncludes(parsed.notIncludes || []);
                    setBenefitsList(parsed.benefitsList || []);
                    setRequirementsList(parsed.requirementsList || []);
                    showToast('Borrador restaurado exitosamente', 'success');
                } else {
                    localStorage.removeItem('service-draft');
                }
            } catch (error) {
                console.error('Error loading draft:', error);
            }
        }
    }, []);

    // Auto-save draft to localStorage every 30 seconds
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const interval = setInterval(() => {
            const draft = {
                title,
                description,
                price,
                duration,
                category,
                type,
                country,
                currency,
                includes,
                notIncludes,
                benefitsList,
                requirementsList,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem('service-draft', JSON.stringify(draft));
            console.log('Draft auto-saved');
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [hasUnsavedChanges, title, description, price, duration, category, type, country, currency, includes, notIncludes, benefitsList, requirementsList]);

    // Fetch price suggestions when category changes
    useEffect(() => {
        if (!category) {
            setPriceSuggestion(null);
            return;
        }

        const fetchPriceSuggestions = async () => {
            try {
                const supabase = createClient();
                const { data } = await supabase
                    .from('services')
                    .select('price')
                    .eq('category', category)
                    .eq('status', 'active')
                    .not('price', 'is', null);

                if (data && data.length > 0) {
                    const prices = data.map(s => s.price);
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    const avg = prices.reduce((sum, p) => sum + p, 0) / prices.length;
                    setPriceSuggestion({ min, max, avg });
                }
            } catch (error) {
                console.error('Error fetching price suggestions:', error);
            }
        };

        fetchPriceSuggestions();
    }, [category]);

    // Calculate form progress
    const calculateProgress = () => {
        const fields = [
            { completed: !!title.trim(), label: 'Nombre' },
            { completed: !!category, label: 'Categoría' },
            { completed: !!duration && parseInt(duration) >= 15, label: 'Duración' },
            { completed: !!price && parseFloat(price) >= 5, label: 'Precio' },
            { completed: !!description.trim(), label: 'Descripción' },
            { completed: includes.length > 0, label: 'Qué incluye' },
            { completed: !!imageFile || !!previewUrl, label: 'Imagen' },
            { completed: type === 'Virtual' || !!country, label: 'Ubicación' }
        ];
        const completed = fields.filter(f => f.completed).length;
        const total = fields.length;
        const percentage = (completed / total) * 100;
        return { completed, total, percentage, fields };
    };

    const progress = calculateProgress();

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

        // Comprehensive validation before starting
        if (priceError || durationError) {
            showToast('Corrige los campos de precio y duración', 'error');
            return;
        }

        if (!title.trim()) {
            showToast('El nombre del servicio es requerido', 'error');
            return;
        }

        if (title.trim().length > 60) {
            showToast('El nombre del servicio no puede exceder 60 caracteres', 'error');
            return;
        }

        if (!category) {
            showToast('Debes seleccionar una categoría', 'error');
            return;
        }

        if (description.length > 500) {
            showToast('La descripción no puede exceder 500 caracteres', 'error');
            return;
        }

        if (includes.length === 0) {
            showToast('Debes agregar al menos 1 item en "Qué incluye"', 'warning');
            return;
        }

        // Validate location for in-person services
        if (type === 'Presencial' && !country) {
            showToast('Los servicios presenciales requieren seleccionar un país', 'error');
            return;
        }

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

            // 4. Trim all text inputs before saving
            const trimmedTitle = title.trim();
            const trimmedDescription = description.trim();

            const requirementsText = [
                benefitsList.length ? `Beneficios: ${benefitsList.join('; ')}` : '',
                requirementsList.length ? `Requisitos: ${requirementsList.join('; ')}` : ''
            ].filter(Boolean).join(' | ');

            const typeCanonical = (type === 'Virtual' || type === 'Presencial') ? type : normalizeServiceType(type) || null;
            if (!typeCanonical) throw new Error('Selecciona un tipo de servicio válido');

            const basePayload = {
                expert_id: expert.id,
                title: trimmedTitle,
                description: trimmedDescription,
                price: parseFloat(price) || 0,
                duration: parseInt(duration) || 60,
                category,
                includes: includes.map(i => i.trim()),
                not_includes: notIncludes.map(i => i.trim()),
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

            // 7. Clear unsaved changes flag, remove draft, and redirect
            setHasUnsavedChanges(false);
            localStorage.removeItem('service-draft');
            showToast('Servicio creado exitosamente', 'success');

            // Wait briefly to show success message
            setTimeout(() => {
                router.push('/expert/services');
                router.refresh();
            }, 500);

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error creating service:", message);
            showToast(`Error al crear servicio: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        if (hasUnsavedChanges) {
                            if (confirm('¿Estás seguro? Perderás todos los cambios no guardados.')) {
                                router.push('/expert/services');
                            }
                        } else {
                            router.push('/expert/services');
                        }
                    }}
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        color: 'rgb(var(--text-secondary))', fontSize: '0.9rem',
                        fontWeight: 500, marginBottom: '1rem',
                        background: 'none', border: 'none', cursor: 'pointer', padding: 0
                    }}
                >
                    <ArrowLeft size={16} />
                    Volver a Servicios
                </button>
                <h1 style={{ fontSize: '2rem' }}>Nuevo Servicio</h1>
            </div>

            {/* Progress Indicator */}
            <div style={{
                background: 'rgb(var(--surface))',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))',
                marginBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                            Progreso del formulario
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>
                            {progress.completed} de {progress.total} campos completados
                        </div>
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'rgb(var(--primary))' }}>
                        {Math.round(progress.percentage)}%
                    </div>
                </div>

                {/* Progress Bar */}
                <div style={{
                    width: '100%',
                    height: '8px',
                    background: 'rgb(var(--background))',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginBottom: '1rem'
                }}>
                    <div style={{
                        width: `${progress.percentage}%`,
                        height: '100%',
                        background: progress.percentage === 100 ? 'rgb(var(--success))' : 'rgb(var(--primary))',
                        transition: 'width 0.3s ease, background 0.3s ease'
                    }} />
                </div>

                {/* Field Checklist */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                    {progress.fields.map((field, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }}>
                            {field.completed ? (
                                <CheckCircle2 size={16} style={{ color: 'rgb(var(--success))', flexShrink: 0 }} />
                            ) : (
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    border: '2px solid rgb(var(--border))',
                                    flexShrink: 0
                                }} />
                            )}
                            <span style={{ color: field.completed ? 'rgb(var(--text-primary))' : 'rgb(var(--text-muted))' }}>
                                {field.label}
                            </span>
                        </div>
                    ))}
                </div>
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
                                    {/* Remove image button */}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveImage();
                                        }}
                                        style={{
                                            position: 'absolute', top: '0.5rem', right: '0.5rem',
                                            background: 'rgba(var(--error), 0.9)', color: 'white',
                                            border: 'none', borderRadius: '50%',
                                            width: '32px', height: '32px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', zIndex: 10
                                        }}
                                        title="Eliminar imagen"
                                    >
                                        <X size={18} />
                                    </button>
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                            Nombre del Servicio <span style={{ color: 'rgb(var(--error))' }}>*</span>
                        </label>
                        <Input
                            placeholder="Ej: Acompañamiento de Compras"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value.slice(0, 60));
                                setHasUnsavedChanges(true);
                            }}
                            required
                        />
                        <div style={{ fontSize: '0.8rem', color: title.length > 50 ? 'rgb(var(--warning))' : 'rgb(var(--text-muted))', textAlign: 'right' }}>
                            {title.length}/60 caracteres
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                Categoría <span style={{ color: 'rgb(var(--error))' }}>*</span>
                            </label>
                            <select
                                value={category}
                                onChange={(e) => {
                                    setCategory(e.target.value);
                                    setHasUnsavedChanges(true);
                                }}
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
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Duración de Sesión (Rápido)</label>
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
                                Selección rápida de duración. Define cuánto tiempo durará cada sesión con el cliente.
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Tipo de Servicio
                                <span title="Virtual: El servicio se realiza por videollamada (Zoom, Meet, etc.). Presencial: Requiere estar físicamente presente con el cliente." style={{ cursor: 'help', color: 'rgb(var(--text-muted))' }}>
                                    <HelpCircle size={14} />
                                </span>
                            </label>
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
                            {priceSuggestion && (
                                <div style={{
                                    marginTop: '0.5rem',
                                    padding: '0.75rem',
                                    background: 'rgba(var(--primary), 0.05)',
                                    border: '1px solid rgba(var(--primary), 0.2)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.8rem'
                                }}>
                                    <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'rgb(var(--primary))' }}>
                                        💡 Sugerencias de precio para {category}:
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem', color: 'rgb(var(--text-secondary))' }}>
                                        <span>Mín: <strong>${priceSuggestion.min.toFixed(decimals)}</strong></span>
                                        <span>Prom: <strong>${priceSuggestion.avg.toFixed(decimals)}</strong></span>
                                        <span>Máx: <strong>${priceSuggestion.max.toFixed(decimals)}</strong></span>
                                    </div>
                                </div>
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
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Descripción Detallada
                            <span title="Describe claramente qué ofreces, para quién es ideal, y qué puede esperar el cliente. Sé específico sobre los beneficios y resultados." style={{ cursor: 'help', color: 'rgb(var(--text-muted))' }}>
                                <HelpCircle size={14} />
                            </span>
                        </label>
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
                            onChange={(e) => {
                                if (e.target.value.length <= 500) {
                                    setDescription(e.target.value);
                                    setHasUnsavedChanges(true);
                                }
                            }}
                            maxLength={500}
                        />
                        <div style={{ fontSize: '0.8rem', color: description.length > 450 ? 'rgb(var(--warning))' : 'rgb(var(--text-muted))', textAlign: 'right' }}>
                            {description.length}/500 caracteres
                        </div>
                    </div>

                    {/* Checklists */}
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(var(--primary), 0.05)',
                        border: '1px solid rgba(var(--primary), 0.15)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.85rem',
                        color: 'rgb(var(--text-secondary))',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '0.75rem'
                    }}>
                        <HelpCircle size={18} style={{ flexShrink: 0, marginTop: '2px', color: 'rgb(var(--primary))' }} />
                        <div>
                            <strong>Tip:</strong> Los items de "Qué incluye" son muy importantes - ayudan a los clientes a entender exactamente qué obtendrán. Sé específico y claro. Incluye al menos 3-4 beneficios clave.
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '1rem 0' }}>
                        <div>
                            <ChecklistSection
                                title="Qué incluye *"
                                placeholder="Ej: Grabación de la sesión"
                                items={includes}
                                onAdd={addInclude}
                                onRemove={removeInclude}
                                icon={Check}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.5rem' }}>
                                {includes.length}/8 items (Máximo 100 caracteres por item)
                            </div>
                        </div>
                        <div>
                            <ChecklistSection
                                title="Qué NO incluye"
                                placeholder="Ej: Compra de prendas"
                                items={notIncludes}
                                onAdd={(item) => {
                                    if (notIncludes.length >= 8) {
                                        showToast('Máximo 8 items permitidos', 'warning');
                                        return;
                                    }
                                    if (item.length > 100) {
                                        showToast('Cada item debe tener máximo 100 caracteres', 'warning');
                                        return;
                                    }
                                    setNotIncludes([...notIncludes, item.trim()]);
                                    setHasUnsavedChanges(true);
                                }}
                                onRemove={(idx) => {
                                    setNotIncludes(notIncludes.filter((_, i) => i !== idx));
                                    setHasUnsavedChanges(true);
                                }}
                                icon={XCircle}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.5rem' }}>
                                {notIncludes.length}/8 items (Máximo 100 caracteres por item)
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', margin: '0 0 1rem 0' }}>
                        <div>
                            <ChecklistSection
                                title="Qué obtienes"
                                placeholder="Ej: Comparación en vivo, Recomendación personalizada"
                                items={benefitsList}
                                onAdd={(item) => {
                                    if (benefitsList.length >= 8) {
                                        showToast('Máximo 8 items permitidos', 'warning');
                                        return;
                                    }
                                    if (item.length > 100) {
                                        showToast('Cada item debe tener máximo 100 caracteres', 'warning');
                                        return;
                                    }
                                    setBenefitsList([...benefitsList, item.trim()]);
                                    setHasUnsavedChanges(true);
                                }}
                                onRemove={(idx) => {
                                    setBenefitsList(benefitsList.filter((_, i) => i !== idx));
                                    setHasUnsavedChanges(true);
                                }}
                                icon={Check}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.5rem' }}>
                                {benefitsList.length}/8 items (Máximo 100 caracteres por item)
                            </div>
                        </div>
                        <div>
                            <ChecklistSection
                                title="Requisitos para el cliente"
                                placeholder="Ej: Presupuesto aproximado, Tipo de uso"
                                items={requirementsList}
                                onAdd={(item) => {
                                    if (requirementsList.length >= 8) {
                                        showToast('Máximo 8 items permitidos', 'warning');
                                        return;
                                    }
                                    if (item.length > 100) {
                                        showToast('Cada item debe tener máximo 100 caracteres', 'warning');
                                        return;
                                    }
                                    setRequirementsList([...requirementsList, item.trim()]);
                                    setHasUnsavedChanges(true);
                                }}
                                onRemove={(idx) => {
                                    setRequirementsList(requirementsList.filter((_, i) => i !== idx));
                                    setHasUnsavedChanges(true);
                                }}
                                icon={XCircle}
                            />
                            <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.5rem' }}>
                                {requirementsList.length}/8 items (Máximo 100 caracteres por item)
                            </div>
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgb(var(--border))', margin: '1rem 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Estado: Se creará como Activo</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowPreview(true)}
                                style={{ gap: '0.5rem' }}
                                disabled={!title.trim()}
                            >
                                <Eye size={18} />
                                Vista Previa
                            </Button>
                            <Button type="submit" disabled={isLoading} style={{ gap: '0.5rem' }}>
                                <Save size={18} />
                                {isLoading ? 'Guardando...' : 'Guardar Servicio'}
                            </Button>
                        </div>
                    </div>

                </form>
            </div>

            {/* Preview Modal */}
            {showPreview && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 50,
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '1rem',
                        overflowY: 'auto'
                    }}
                    onClick={() => setShowPreview(false)}
                >
                    <div
                        style={{
                            background: 'rgb(var(--background))',
                            padding: '2rem',
                            borderRadius: 'var(--radius-lg)',
                            maxWidth: '900px',
                            width: '100%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>Vista Previa del Servicio</h2>
                                <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-muted))' }}>
                                    Así es como se verá tu servicio para los clientes
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'rgb(var(--text-secondary))',
                                    padding: '0.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 'var(--radius-md)'
                                }}
                                title="Cerrar vista previa"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
                            <ServiceCard
                                service={{
                                    id: 'preview',
                                    title: title || 'Nombre del servicio',
                                    price: parseFloat(price) || 0,
                                    currency: currency,
                                    duration: parseInt(duration) || 0,
                                    location: country || undefined,
                                    description: description || 'Descripción del servicio...',
                                    image_url: previewUrl || undefined,
                                    type: type,
                                    includes: includes.length > 0 ? includes : ['Ejemplo de beneficio incluido'],
                                    not_includes: notIncludes,
                                    status: 'active'
                                }}
                            />
                        </div>

                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'rgba(var(--warning), 0.1)',
                            border: '1px solid rgba(var(--warning), 0.3)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            color: 'rgb(var(--text-secondary))'
                        }}>
                            <strong>Nota:</strong> Esta es una vista previa. El servicio aún no ha sido guardado. Haz clic en "Guardar Servicio" para publicarlo.
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    zIndex: 1000,
                    background: toast.type === 'success' ? 'rgba(var(--success), 0.95)' :
                                toast.type === 'warning' ? 'rgba(var(--warning), 0.95)' :
                                'rgba(var(--error), 0.95)',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    minWidth: '300px',
                    maxWidth: '500px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <div style={{ fontSize: '1.5rem' }}>
                        {toast.type === 'success' ? '✓' : toast.type === 'warning' ? '⚠' : '✕'}
                    </div>
                    <div style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
                        {toast.message}
                    </div>
                    <button
                        onClick={() => setToast(null)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex'
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* Toast Animation */}
            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
