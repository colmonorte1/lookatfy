'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Save, User, MapPin, Upload, Globe } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast/Toast';

// Common timezones for Latin America, Spain, and USA
const TIMEZONES = [
    { value: '', label: 'Detectar automáticamente' },
    { value: 'America/Bogota', label: 'Colombia (Bogotá) UTC-5' },
    { value: 'America/Mexico_City', label: 'México (Ciudad de México) UTC-6' },
    { value: 'America/Lima', label: 'Perú (Lima) UTC-5' },
    { value: 'America/Santiago', label: 'Chile (Santiago) UTC-3' },
    { value: 'America/Buenos_Aires', label: 'Argentina (Buenos Aires) UTC-3' },
    { value: 'America/Caracas', label: 'Venezuela (Caracas) UTC-4' },
    { value: 'America/Guayaquil', label: 'Ecuador (Guayaquil) UTC-5' },
    { value: 'America/Panama', label: 'Panamá UTC-5' },
    { value: 'America/Costa_Rica', label: 'Costa Rica UTC-6' },
    { value: 'America/Guatemala', label: 'Guatemala UTC-6' },
    { value: 'America/El_Salvador', label: 'El Salvador UTC-6' },
    { value: 'America/Tegucigalpa', label: 'Honduras UTC-6' },
    { value: 'America/Managua', label: 'Nicaragua UTC-6' },
    { value: 'America/Santo_Domingo', label: 'Rep. Dominicana UTC-4' },
    { value: 'America/Havana', label: 'Cuba (La Habana) UTC-5' },
    { value: 'America/Puerto_Rico', label: 'Puerto Rico UTC-4' },
    { value: 'Europe/Madrid', label: 'España (Madrid) UTC+1' },
    { value: 'America/New_York', label: 'USA - Este (New York) UTC-5' },
    { value: 'America/Chicago', label: 'USA - Central (Chicago) UTC-6' },
    { value: 'America/Denver', label: 'USA - Montaña (Denver) UTC-7' },
    { value: 'America/Los_Angeles', label: 'USA - Pacífico (Los Angeles) UTC-8' },
    { value: 'UTC', label: 'UTC (Coordinado Universal)' },
];

interface UserProfile {
    id: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    city?: string;
    country?: string;
    email?: string;
    avatar_url?: string;
    timezone?: string;
}

interface UserProfileFormProps {
    user: UserProfile;
}

export default function UserProfileForm({ user }: UserProfileFormProps) {
    const router = useRouter();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
    const [uploading, setUploading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPwd, setChangingPwd] = useState(false);
    const [detectedTimezone, setDetectedTimezone] = useState<string>('');

    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        phone: user?.phone || '',
        city: user?.city || '',
        country: user?.country || '',
        email: user?.email || '',
        timezone: user?.timezone || '',
    });

    // Detect user's timezone on mount
    useEffect(() => {
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setDetectedTimezone(tz);
        } catch {
            setDetectedTimezone('UTC');
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDetectTimezone = () => {
        if (detectedTimezone) {
            setFormData(prev => ({ ...prev, timezone: detectedTimezone }));
            toast.info(`Zona horaria detectada: ${detectedTimezone}`);
        }
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const supabase = createClient();

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw new Error("No se pudo subir la imagen.");
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setAvatarUrl(data.publicUrl);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: data.publicUrl })
                .eq('id', user.id);

            if (updateError) throw updateError;

            toast.success('Foto de perfil actualizada');
            router.refresh();

        } catch (error: unknown) {
            console.error('Error uploading avatar:', error);
            const msg = (error as { message?: string }).message || 'Error subiendo imagen';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const supabase = createClient();
            const fullName = `${formData.first_name} ${formData.last_name}`.trim();

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    phone: formData.phone,
                    city: formData.city,
                    country: formData.country,
                    timezone: formData.timezone || null,
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Perfil actualizado correctamente');
            router.refresh();

        } catch (error: unknown) {
            console.error('Error updating profile:', error);
            const msg = (error as { message?: string }).message || 'No se pudo actualizar el perfil';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) {
            toast.error('No se encontró tu email para validar la contraseña.');
            return;
        }
        if (newPassword.length < 8) {
            toast.error('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (!/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
            toast.error('La nueva contraseña debe incluir al menos un número y un símbolo.');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('La confirmación no coincide con la nueva contraseña.');
            return;
        }
        try {
            setChangingPwd(true);
            const supabase = createClient();
            const { error: signErr } = await supabase.auth.signInWithPassword({ email: String(user.email), password: currentPassword });
            if (signErr) {
                toast.error('La contraseña anterior es incorrecta.');
                return;
            }
            const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
            if (updErr) {
                toast.error(`No se pudo actualizar la contraseña: ${updErr.message}`);
                return;
            }
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Contraseña actualizada correctamente');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            toast.error(msg);
        } finally {
            setChangingPwd(false);
        }
    };

    return (
        <div style={{
            background: 'rgb(var(--surface))',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgb(var(--border))',
            maxWidth: '800px',
            margin: '0 auto'
        }}>
            <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>

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
                            Sube una foto para personalizar tu experiencia.
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nombre</label>
                            <Input
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Tu nombre"
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Apellidos</label>
                            <Input
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Tus apellidos"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Teléfono</label>
                            <Input
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="+1 234 567 890"
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>País</label>
                            <Input
                                name="country"
                                value={formData.country}
                                onChange={handleChange}
                                placeholder="Ej. Colombia"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Ciudad</label>
                            <Input
                                name="city"
                                icon={<MapPin size={16} />}
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Ej. Bogotá"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Globe size={16} /> Tu Zona Horaria
                        </label>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <select
                                value={formData.timezone}
                                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                                style={{
                                    flex: 1,
                                    padding: '0.625rem 0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))',
                                    background: 'rgb(var(--background))',
                                    fontSize: '0.9rem'
                                }}
                                aria-label="Zona horaria del usuario"
                            >
                                {TIMEZONES.map(tz => (
                                    <option key={tz.value} value={tz.value}>
                                        {tz.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={handleDetectTimezone}
                                style={{
                                    padding: '0.625rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgb(var(--border))',
                                    background: 'rgb(var(--surface-hover))',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Detectar
                            </button>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                            {detectedTimezone && `Tu navegador detectó: ${detectedTimezone}`}
                        </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
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
        </div>
    );
}
