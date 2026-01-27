"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Save, User, MapPin, Upload } from 'lucide-react';
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                return; // User cancelled or no file
            }

            if (!user) {
                alert('No autenticado');
                setUploading(false);
                return;
            }

            const file = event.target.files[0];
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

            router.refresh();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Error uploading avatar:', message);
            alert(`Error: ${message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const supabase = createClient();
            if (!user) { throw new Error('No autenticado'); }
            const fullName = `${formData.first_name} ${formData.last_name}`.trim();

            // 1. Update Profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    // Avatar updated separately
                })
                .eq('id', user.id);

            if (profileError) throw profileError as unknown;

            // 2. Update Expert Details (UPSERT)
            const { error: expertError } = await supabase
                .from('experts')
                .upsert({
                    id: user.id, // Required for upsert
                    title: formData.title,
                    bio: formData.bio,
                    city: formData.city,
                    country: formData.country,
                    phone: formData.phone,
                    languages,
                    skills,
                    timezone: formData.timezone || null
                });

            if (expertError) throw expertError as unknown;

            alert('Perfil actualizado correctamente');
            router.refresh();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Error updating profile:', message);
            alert(`Error al actualizar el perfil: ${message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email) {
            alert('No se encontró tu email para validar la contraseña.');
            return;
        }
        if (newPassword.length < 8) {
            alert('La nueva contraseña debe tener al menos 8 caracteres.');
            return;
        }
        if (!/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
            alert('La nueva contraseña debe incluir al menos un número y un símbolo.');
            return;
        }
        if (newPassword !== confirmPassword) {
            alert('La confirmación no coincide con la nueva contraseña.');
            return;
        }
        try {
            setChangingPwd(true);
            const supabase = createClient();
            const { error: signErr } = await supabase.auth.signInWithPassword({ email: String(user.email), password: currentPassword });
            if (signErr) {
                alert('La contraseña anterior es incorrecta.');
                return;
            }
            const { error: updErr } = await supabase.auth.updateUser({ password: newPassword });
            if (updErr) {
                alert(`No se pudo actualizar la contraseña: ${updErr.message}`);
                return;
            }
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            alert('Contraseña actualizada correctamente.');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            alert(`Error: ${msg}`);
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nombres</label>
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
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Profesión / Título</label>
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
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Biografía</label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            placeholder="Describe tu experiencia y servicios..."
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

                    <div style={{ height: '1px', background: 'rgb(var(--border))', width: '100%' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Idiomas</h3>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Agrega los idiomas que dominas y tu nivel.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Input
                                name="language_name"
                                value={newLanguage.name}
                                onChange={(e) => setNewLanguage({ ...newLanguage, name: e.target.value })}
                                placeholder="Ej. Inglés"
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
                                if (!n) return;
                                setLanguages((prev) => [...prev, { name: n, level: newLanguage.level }]);
                                setNewLanguage({ name: '', level: 'B1' });
                            }}>Añadir</Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {languages.length === 0 && (
                                <span style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Sin idiomas añadidos.</span>
                            )}
                            {languages.map((lang, idx) => (
                                <div key={`${lang.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                                    <span>{lang.name} • {lang.level}</span>
                                    <Button type="button" onClick={() => {
                                        setLanguages((prev) => prev.filter((_, i) => i !== idx));
                                    }}>Eliminar</Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ height: '1px', background: 'rgb(var(--border))', width: '100%' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Skills</h3>
                        <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Agrega tus habilidades y nivel.</p>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <Input
                                name="skill_name"
                                value={newSkill.name}
                                onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                                placeholder="Ej. Litigación"
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
                                if (!n) return;
                                setSkills((prev) => [...prev, { name: n, level: newSkill.level }]);
                                setNewSkill({ name: '', level: 'Intermediate' });
                            }}>Añadir</Button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {skills.length === 0 && (
                                <span style={{ fontSize: '0.875rem', color: 'rgb(var(--text-secondary))' }}>Sin skills añadidos.</span>
                            )}
                            {skills.map((sk, idx) => (
                                <div key={`${sk.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                                    <span>{sk.name} • {sk.level}</span>
                                    <Button type="button" onClick={() => {
                                        setSkills((prev) => prev.filter((_, i) => i !== idx));
                                    }}>Eliminar</Button>
                                </div>
                            ))}
                        </div>
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
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Zona Horaria</label>
                            <select
                                value={formData.timezone}
                                onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
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
