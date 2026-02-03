"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Save, User, MapPin, Upload, X, Eye, HelpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface Profile {
    id: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string;
}

interface Expert {
    id?: string;
    title?: string;
    bio?: string;
    consultation_price?: number;
    city?: string;
    country?: string;
    phone?: string;
    languages?: Array<{ name: string; level: string }>;
    skills?: Array<{ name: string; level: string }>;
    timezone?: string;
}

interface ProfileFormProps {
    user: Profile | null;
    expert: Expert | null;
}

export default function ProfileForm({ user, expert }: ProfileFormProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [uploading, setUploading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPwd, setChangingPwd] = useState(false);

    // Toast notification state
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

    // Track unsaved changes
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Preview modal state
    const [showPreview, setShowPreview] = useState(false);

    interface FormDataState {
        first_name: string;
        last_name: string;
        title: string;
        bio: string;
        city: string;
        country: string;
        phone: string;
        email: string;
        timezone: string;
    }

    const [formData, setFormData] = useState<FormDataState>({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        title: expert?.title || '',
        bio: expert?.bio || '',
        city: expert?.city || '',
        country: expert?.country || '',
        phone: expert?.phone || '',
        email: user?.email || '',
        timezone: expert?.timezone || '',
    });

    type BudgetItem = { name: string; level: string };
    const [languages, setLanguages] = useState<BudgetItem[]>(Array.isArray(expert?.languages) ? expert!.languages! : []);
    const [skills, setSkills] = useState<BudgetItem[]>(Array.isArray(expert?.skills) ? expert!.skills! : []);
    const [newLanguage, setNewLanguage] = useState<BudgetItem>({ name: '', level: 'B1' });
    const [newSkill, setNewSkill] = useState<BudgetItem>({ name: '', level: 'Intermediate' });

    // Toast notification function
    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    // Calculate profile completeness
    const calculateProgress = () => {
        const fields = [
            { label: 'Avatar', completed: !!avatarUrl },
            { label: 'Nombres', completed: !!formData.first_name.trim() },
            { label: 'Apellidos', completed: !!formData.last_name.trim() },
            { label: 'Profesión/Título', completed: !!formData.title.trim() },
            { label: 'Biografía', completed: !!formData.bio.trim() && formData.bio.length >= 100 },
            { label: 'Teléfono', completed: !!formData.phone.trim() },
            { label: 'País', completed: !!formData.country.trim() },
            { label: 'Ciudad', completed: !!formData.city.trim() },
            { label: 'Zona Horaria', completed: !!formData.timezone },
            { label: 'Idiomas (min 1)', completed: languages.length >= 1 },
            { label: 'Skills (min 1)', completed: skills.length >= 1 },
        ];

        const completed = fields.filter(f => f.completed).length;
        const total = fields.length;
        const percentage = (completed / total) * 100;

        return { fields, completed, total, percentage };
    };

    const progress = calculateProgress();

    // Profile quality suggestions
    const getQualitySuggestions = () => {
        const suggestions: string[] = [];

        if (!avatarUrl) suggestions.push('Agrega una foto de perfil profesional');
        if (formData.bio.length < 100) suggestions.push('Escribe una biografía más detallada (mínimo 100 caracteres)');
        if (formData.bio.length < 200) suggestions.push('Amplía tu biografía para destacar más (recomendado 200+ caracteres)');
        if (languages.length === 0) suggestions.push('Agrega al menos 1 idioma que dominas');
        if (languages.length < 2) suggestions.push('Agrega más idiomas para atraer clientes internacionales');
        if (skills.length === 0) suggestions.push('Agrega al menos 1 habilidad profesional');
        if (skills.length < 3) suggestions.push('Agrega más habilidades para destacar tu experiencia');
        if (!formData.phone.trim()) suggestions.push('Agrega un número de teléfono de contacto');
        if (!formData.country.trim() || !formData.city.trim()) suggestions.push('Completa tu ubicación (país y ciudad)');

        return suggestions;
    };

    const qualitySuggestions = getQualitySuggestions();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setHasUnsavedChanges(true);
    };

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

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                return; // User cancelled or no file
            }

            if (!user) {
                showToast('No autenticado', 'error');
                setUploading(false);
                return;
            }

            const file = event.target.files[0];

            // Validate file size (2MB max)
            const maxSize = 2 * 1024 * 1024; // 2MB in bytes
            if (file.size > maxSize) {
                showToast('La imagen es demasiado grande. El tamaño máximo es 2MB.', 'error');
                event.target.value = ''; // Clear the input
                setUploading(false);
                return;
            }

            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showToast('Formato de imagen no válido. Usa JPG, PNG o WebP.', 'error');
                event.target.value = ''; // Clear the input
                setUploading(false);
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const supabase = createClient();

            // Upload to 'avatars' bucket
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Supabase Storage Error:", uploadError);
                throw new Error("No se pudo subir la imagen. Verifica que el bucket 'avatars' exista.");
            }

            // Get Public URL
            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            if (!data.publicUrl) {
                throw new Error("No se pudo obtener la URL pública de la imagen.");
            }

            setAvatarUrl(data.publicUrl);

            // Update profile immediately with new avatar
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: data.publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            showToast('Foto de perfil actualizada correctamente', 'success');
            router.refresh();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Error uploading avatar:', message);
            showToast(`Error: ${message}`, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation before async operations
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
            showToast('Nombres y apellidos son requeridos', 'error');
            return;
        }

        if (!formData.title.trim()) {
            showToast('El título/profesión es requerido', 'error');
            return;
        }

        if (formData.bio.length > 500) {
            showToast('La biografía no puede exceder 500 caracteres', 'error');
            return;
        }

        if (!formData.timezone) {
            showToast('Debes seleccionar una zona horaria', 'error');
            return;
        }

        setIsLoading(true);

        try {
            const supabase = createClient();
            if (!user) { throw new Error('No autenticado'); }
            const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`.trim();

            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    first_name: formData.first_name.trim(),
                    last_name: formData.last_name.trim(),
                    // Avatar updated separately
                })
                .eq('id', user.id);

            if (profileError) throw profileError as unknown;

            // 2. Update Expert Details (UPSERT)
            const { error: expertError } = await supabase
                .from('experts')
                .upsert({
                    id: user.id, // Required for upsert
                    title: formData.title.trim(),
                    bio: formData.bio.trim(),
                    city: formData.city.trim(),
                    country: formData.country.trim(),
                    phone: formData.phone.trim(),
                    languages,
                    skills,
                    timezone: formData.timezone || null
                });

            if (expertError) throw expertError as unknown;

            setHasUnsavedChanges(false);
            showToast('Perfil actualizado correctamente', 'success');
            router.refresh();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Error updating profile:', message);
            showToast(`Error al actualizar el perfil: ${message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) {
            showToast('No se encontró tu email para validar la contraseña.', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('La nueva contraseña debe tener al menos 8 caracteres.', 'warning');
            return;
        }
        if (!/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
            showToast('La nueva contraseña debe incluir al menos un número y un símbolo.', 'warning');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('La confirmación no coincide con la nueva contraseña.', 'error');
            return;
        }
        try {
            setChangingPwd(true);
            const supabase = createClient();
            const { error: signErr } = await supabase.auth.signInWithPassword({ email: String(user.email), password: currentPassword });
            if (signErr) {
                showToast('La contraseña anterior es incorrecta.', 'error');
                return;
            }
            const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
            if (updErr) {
                showToast(`No se pudo actualizar la contraseña: ${updErr.message}`, 'error');
                return;
            }
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showToast('Contraseña actualizada correctamente.', 'success');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            showToast(`Error: ${msg}`, 'error');
        } finally {
            setChangingPwd(false);
        }
    };

    return (
        <div style={{
            background: 'rgb(var(--surface))',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgb(var(--border))'
        }}>
            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>

                {/* Profile Completeness Progress */}
                <div style={{
                    background: 'rgba(var(--primary), 0.05)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(var(--primary), 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                Completitud del Perfil
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
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

                {/* Quality Suggestions */}
                {qualitySuggestions.length > 0 && (
                    <div style={{
                        background: 'rgba(var(--warning), 0.08)',
                        border: '1px solid rgba(var(--warning), 0.3)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        gap: '0.75rem'
                    }}>
                        <AlertCircle size={20} style={{ color: 'rgb(var(--warning))', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                Sugerencias para mejorar tu perfil:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                {qualitySuggestions.slice(0, 3).map((suggestion, idx) => (
                                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{suggestion}</li>
                                ))}
                            </ul>
                            {qualitySuggestions.length > 3 && (
                                <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))', marginTop: '0.5rem' }}>
                                    +{qualitySuggestions.length - 3} sugerencia{qualitySuggestions.length - 3 !== 1 ? 's' : ''} más
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Avatar Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%', overflow: 'hidden',
                        background: 'rgb(var(--surface-hover))', border: '1px solid rgb(var(--border))',
                        position: 'relative'
                    }}>
                        {avatarUrl ? (
                            <Image
                                src={avatarUrl}
                                alt="Avatar"
                                width={100} height={100}
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                        ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <User size={40} color="rgb(var(--text-secondary))" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.25rem' }}>Foto de Perfil</h3>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))', marginBottom: '0.75rem' }}>
                            Sube tu foto para generar confianza.
                        </p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <label htmlFor="avatar-upload">
                                <span className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)' }}>
                                    <Upload size={16} /> {uploading ? 'Subiendo...' : 'Cambiar Foto'}
                                </span>
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarUpload}
                                style={{ display: 'none' }}
                                disabled={uploading}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ height: '1px', background: 'rgb(var(--border))', width: '100%' }} />

                {/* Form Fields */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Section: Personal Information */}
                    <div>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid rgb(var(--primary))',
                            color: 'rgb(var(--text-main))'
                        }}>
                            Información Personal
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nombres <span style={{ color: 'rgb(var(--error))' }}>*</span></label>
                            <Input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Tu nombre"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Apellidos <span style={{ color: 'rgb(var(--error))' }}>*</span></label>
                            <Input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Tus apellidos"
                                required
                            />
                        </div>
                    </div>

                    {/* Section: Professional Information */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid rgb(var(--primary))',
                            color: 'rgb(var(--text-main))'
                        }}>
                            Información Profesional
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Profesión / Título <span style={{ color: 'rgb(var(--error))' }}>*</span></label>
                            <Input
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Ej. Abogado Civil"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Correo Electrónico</label>
                            <Input
                                name="email"
                                value={formData.email}
                                disabled
                                style={{ opacity: 0.7, cursor: 'not-allowed' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Biografía
                            <span title="Escribe una descripción clara y profesional de tu experiencia, especialización y qué hace único tu servicio. Mínimo 100 caracteres recomendado." style={{ cursor: 'help', color: 'rgb(var(--text-muted))' }}>
                                <HelpCircle size={14} />
                            </span>
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={(e) => {
                                if (e.target.value.length <= 500) {
                                    handleChange(e);
                                }
                            }}
                            placeholder="Describe tu experiencia y servicios..."
                            maxLength={500}
                            style={{
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid rgb(var(--border))',
                                fontFamily: 'inherit',
                                minHeight: '120px',
                                resize: 'vertical',
                                background: 'rgb(var(--background))',
                                color: 'rgb(var(--text-main))'
                            }}
                        />
                        <div style={{ fontSize: '0.8rem', color: formData.bio.length > 450 ? 'rgb(var(--warning))' : 'rgb(var(--text-muted))', textAlign: 'right' }}>
                            {formData.bio.length}/500 caracteres
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Teléfono</label>
                            <Input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+123 456 789"
                            />
                        </div>
                    </div>

                    {/* Section: Languages & Skills */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid rgb(var(--primary))',
                            color: 'rgb(var(--text-main))'
                        }}>
                            Idiomas y Habilidades
                        </h3>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Idiomas <span style={{ color: 'rgb(var(--error))' }}>*</span>
                            <span title="Los idiomas que hablas expanden tu alcance a clientes internacionales. Usa los niveles estándar: A1-A2 (Básico), B1-B2 (Intermedio), C1-C2 (Avanzado)." style={{ cursor: 'help', color: 'rgb(var(--text-muted))' }}>
                                <HelpCircle size={14} />
                            </span>
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Agrega los idiomas que dominas y tu nivel (máximo 8).</p>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Input
                                name="language_name"
                                value={newLanguage.name}
                                onChange={(e) => {
                                    if (e.target.value.length <= 50) {
                                        setNewLanguage({ ...newLanguage, name: e.target.value });
                                    }
                                }}
                                placeholder="Ej. Inglés"
                                maxLength={50}
                            />
                            <select
                                value={newLanguage.level}
                                onChange={(e) => setNewLanguage({ ...newLanguage, level: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))' }}
                                aria-label="Nivel de idioma"
                            >
                                <option value="A1">A1</option>
                                <option value="A2">A2</option>
                                <option value="B1">B1</option>
                                <option value="B2">B2</option>
                                <option value="C1">C1</option>
                                <option value="C2">C2</option>
                            </select>
                            <Button type="button" onClick={() => {
                                const n = newLanguage.name.trim();
                                if (!n) {
                                    showToast('Ingresa el nombre del idioma', 'warning');
                                    return;
                                }
                                if (languages.length >= 8) {
                                    showToast('Máximo 8 idiomas permitidos', 'warning');
                                    return;
                                }
                                setLanguages((prev) => [...prev, { name: n, level: newLanguage.level }]);
                                setNewLanguage({ name: '', level: 'B1' });
                                setHasUnsavedChanges(true);
                            }}>Añadir</Button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))' }}>
                            {languages.length}/8 idiomas
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {languages.length === 0 && (
                                <span style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Sin idiomas añadidos.</span>
                            )}
                            {languages.map((lang, idx) => (
                                <div key={`${lang.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                                    <span>{lang.name} • {lang.level}</span>
                                    <Button type="button" variant="ghost" onClick={() => {
                                        if (confirm(`¿Eliminar "${lang.name}"?`)) {
                                            setLanguages((prev) => prev.filter((_, i) => i !== idx));
                                            setHasUnsavedChanges(true);
                                        }
                                    }} style={{ color: 'rgb(var(--error))', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <X size={14} /> Eliminar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Skills <span style={{ color: 'rgb(var(--error))' }}>*</span>
                            <span title="Destaca tus habilidades profesionales específicas (ej: Litigación, Contratos, Negociación). Esto ayuda a los clientes a encontrarte y confiar en tu experiencia." style={{ cursor: 'help', color: 'rgb(var(--text-muted))' }}>
                                <HelpCircle size={14} />
                            </span>
                        </h4>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Agrega tus habilidades y nivel (máximo 8).</p>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Input
                                name="skill_name"
                                value={newSkill.name}
                                onChange={(e) => {
                                    if (e.target.value.length <= 50) {
                                        setNewSkill({ ...newSkill, name: e.target.value });
                                    }
                                }}
                                placeholder="Ej. Litigación"
                                maxLength={50}
                            />
                            <select
                                value={newSkill.level}
                                onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))' }}
                                aria-label="Nivel de habilidad"
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                            </select>
                            <Button type="button" onClick={() => {
                                const n = newSkill.name.trim();
                                if (!n) {
                                    showToast('Ingresa el nombre de la habilidad', 'warning');
                                    return;
                                }
                                if (skills.length >= 8) {
                                    showToast('Máximo 8 habilidades permitidas', 'warning');
                                    return;
                                }
                                setSkills((prev) => [...prev, { name: n, level: newSkill.level }]);
                                setNewSkill({ name: '', level: 'Intermediate' });
                                setHasUnsavedChanges(true);
                            }}>Añadir</Button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'rgb(var(--text-muted))' }}>
                            {skills.length}/8 habilidades
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {skills.length === 0 && (
                                <span style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Sin skills añadidos.</span>
                            )}
                            {skills.map((sk, idx) => (
                                <div key={`${sk.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                                    <span>{sk.name} • {sk.level}</span>
                                    <Button type="button" variant="ghost" onClick={() => {
                                        if (confirm(`¿Eliminar "${sk.name}"?`)) {
                                            setSkills((prev) => prev.filter((_, i) => i !== idx));
                                            setHasUnsavedChanges(true);
                                        }
                                    }} style={{ color: 'rgb(var(--error))', padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <X size={14} /> Eliminar
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section: Location & Timezone */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <h3 style={{
                            fontSize: '1.125rem',
                            fontWeight: 600,
                            marginBottom: '1rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid rgb(var(--primary))',
                            color: 'rgb(var(--text-main))'
                        }}>
                            Ubicación y Zona Horaria
                        </h3>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>País</label>
                            <Input
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                placeholder="Ej. España"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Ciudad</label>
                            <Input
                                name="city"
                                icon={<MapPin size={16} />}
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Ej. Madrid"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Zona Horaria <span style={{ color: 'rgb(var(--error))' }}>*</span></label>
                            <select
                                value={formData.timezone}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, timezone: e.target.value }));
                                    setHasUnsavedChanges(true);
                                }}
                                required
                                style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))' }}
                                aria-label="Zona horaria"
                            >
                                <option value="" disabled>Selecciona tu zona</option>
                                <option value="America/Bogota">Colombia (America/Bogota)</option>
                                <option value="America/New_York">USA - Este (America/New_York)</option>
                                <option value="America/Los_Angeles">USA - Pacífico (America/Los_Angeles)</option>
                                <option value="UTC">UTC</option>
                            </select>
                            <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                Usamos zonas IANA. Ampliaremos la lista más adelante.
                            </span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowPreview(true)}
                            style={{ gap: '0.5rem' }}
                            disabled={!formData.first_name.trim() || !formData.last_name.trim()}
                        >
                            <Eye size={18} />
                            Vista Previa
                        </Button>
                        <Button type="submit" disabled={isLoading} style={{ gap: '0.5rem' }}>
                            <Save size={18} />
                            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </div>
                </form>

                <div style={{ height: '1px', background: 'rgb(var(--border))', width: '100%' }} />

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} aria-label="Cambiar contraseña">
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Seguridad</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Input
                            label="Contraseña anterior"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                        <Input
                            label="Nueva contraseña"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>
                    {(function(){
                        const p = newPassword;
                        let s = 0; if (p.length >= 8) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++;
                        const label = s <= 1 ? 'Débil' : s === 2 ? 'Media' : s === 3 ? 'Buena' : 'Alta';
                        const color = s <= 1 ? 'rgb(var(--error))' : s === 2 ? 'rgb(var(--warning))' : s === 3 ? 'rgb(var(--primary))' : 'rgb(var(--success))';
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ height: '8px', background: 'rgb(var(--border))', borderRadius: '999px', width: '160px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${(s/4)*100}%`, background: color }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>Fortaleza: {label}</span>
                            </div>
                        );
                    })()}
                    <Input
                        label="Confirmar nueva contraseña"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button type="submit" variant="primary" isLoading={changingPwd}>Actualizar contraseña</Button>
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
                            maxWidth: '700px',
                            width: '100%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            maxHeight: '90vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>Vista Previa del Perfil</h2>
                                <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-muted))' }}>
                                    Así es como los clientes verán tu perfil público
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

                        {/* Profile Card Preview */}
                        <div style={{
                            background: 'rgb(var(--surface))',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgb(var(--border))',
                            overflow: 'hidden'
                        }}>
                            {/* Header with Avatar */}
                            <div style={{
                                background: 'linear-gradient(135deg, rgb(var(--primary)) 0%, rgba(var(--primary), 0.7) 100%)',
                                padding: '2rem',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        overflow: 'hidden',
                                        background: 'white',
                                        border: '4px solid white',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                    }}>
                                        {avatarUrl ? (
                                            <Image
                                                src={avatarUrl}
                                                alt="Avatar"
                                                width={100}
                                                height={100}
                                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                            />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgb(var(--surface-hover))' }}>
                                                <User size={40} color="rgb(var(--text-secondary))" />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ flex: 1, color: 'white' }}>
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                            {formData.first_name.trim() || 'Tu Nombre'} {formData.last_name.trim() || 'Apellido'}
                                        </h3>
                                        <p style={{ fontSize: '1rem', opacity: 0.95, marginBottom: '0.5rem' }}>
                                            {formData.title.trim() || 'Tu Profesión/Título'}
                                        </p>
                                        {(formData.city.trim() || formData.country.trim()) && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', opacity: 0.9 }}>
                                                <MapPin size={14} />
                                                <span>{[formData.city.trim(), formData.country.trim()].filter(Boolean).join(', ')}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: '1.5rem' }}>
                                {/* Bio */}
                                {formData.bio.trim() && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'rgb(var(--text-secondary))' }}>
                                            SOBRE MÍ
                                        </h4>
                                        <p style={{ lineHeight: 1.6, color: 'rgb(var(--text-main))' }}>
                                            {formData.bio.trim() || 'Tu biografía aparecerá aquí...'}
                                        </p>
                                    </div>
                                )}

                                {/* Languages */}
                                {languages.length > 0 && (
                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'rgb(var(--text-secondary))' }}>
                                            IDIOMAS
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {languages.map((lang, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        background: 'rgba(var(--primary), 0.1)',
                                                        color: 'rgb(var(--primary))',
                                                        padding: '0.375rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {lang.name} • {lang.level}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Skills */}
                                {skills.length > 0 && (
                                    <div>
                                        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', color: 'rgb(var(--text-secondary))' }}>
                                            HABILIDADES
                                        </h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {skills.map((skill, idx) => (
                                                <span
                                                    key={idx}
                                                    style={{
                                                        background: 'rgb(var(--background))',
                                                        border: '1px solid rgb(var(--border))',
                                                        padding: '0.375rem 0.75rem',
                                                        borderRadius: '1rem',
                                                        fontSize: '0.85rem',
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {skill.name} • {skill.level}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'rgba(var(--primary), 0.1)',
                            border: '1px solid rgba(var(--primary), 0.2)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '0.85rem',
                            color: 'rgb(var(--text-secondary))'
                        }}>
                            <strong>Nota:</strong> Esta es una vista previa de cómo los clientes verán tu perfil. Guarda los cambios para actualizar tu perfil público.
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '1.5rem',
                    right: '1.5rem',
                    background: toast.type === 'success' ? 'rgb(var(--success))' : toast.type === 'warning' ? 'rgb(var(--warning))' : 'rgb(var(--error))',
                    color: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 9999,
                    maxWidth: '400px',
                    fontWeight: 500,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
