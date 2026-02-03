'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Save, AlertCircle, Loader2 } from 'lucide-react';
import { updateUser } from '../../actions';

interface EditUserFormProps {
    user: {
        id: string;
        full_name?: string | null;
        email?: string | null;
        role?: string | null;
        city?: string | null;
        country?: string | null;
    };
}

export default function EditUserForm({ user }: EditUserFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        email: user.email || '',
        role: (user.role || 'client') as 'client' | 'expert' | 'admin',
        city: user.city || '',
        country: user.country || ''
    });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        // Client-side validation
        if (!formData.full_name.trim()) {
            setError('El nombre completo es obligatorio');
            setIsSubmitting(false);
            return;
        }

        if (!formData.email.trim()) {
            setError('El email es obligatorio');
            setIsSubmitting(false);
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Email inválido');
            setIsSubmitting(false);
            return;
        }

        try {
            const formDataObj = new FormData();
            formDataObj.append('full_name', formData.full_name);
            formDataObj.append('email', formData.email);
            formDataObj.append('role', formData.role);
            formDataObj.append('city', formData.city);
            formDataObj.append('country', formData.country);

            const result = await updateUser(user.id, formDataObj);

            if (!result.success) {
                setError(result.error || 'Error al actualizar el usuario');
                setIsSubmitting(false);
                return;
            }

            // Success - redirect to user detail page
            router.push(`/admin/users/${user.id}`);
        } catch (err) {
            console.error('Error updating user:', err);
            setError('Error inesperado al actualizar el usuario');
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {error && (
                <div style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(var(--error), 0.1)',
                    border: '1px solid rgb(var(--error))',
                    color: 'rgb(var(--error))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <AlertCircle size={18} />
                    <span>{error}</span>
                </div>
            )}

            <Input
                label="Nombre completo"
                placeholder="Juan Pérez"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                disabled={isSubmitting}
                required
            />

            <Input
                label="Correo electrónico"
                type="email"
                placeholder="usuario@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={isSubmitting}
                required
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <Input
                    label="Ciudad"
                    placeholder="Bogotá"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    disabled={isSubmitting}
                />

                <Input
                    label="País"
                    placeholder="Colombia"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    disabled={isSubmitting}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                    Rol <span style={{ color: 'rgb(var(--error))' }}>*</span>
                </label>
                <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'client' | 'expert' | 'admin' })}
                    disabled={isSubmitting}
                    required
                    style={{
                        padding: '0.625rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid rgb(var(--border))',
                        fontFamily: 'inherit',
                        background: 'rgb(var(--surface))',
                        fontSize: '0.875rem'
                    }}
                >
                    <option value="client">Cliente</option>
                    <option value="expert">Experto</option>
                    <option value="admin">Administrador</option>
                </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/admin/users/${user.id}`)}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} style={{ gap: '0.5rem' }}>
                    {isSubmitting ? (
                        <>
                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Guardar Cambios
                        </>
                    )}
                </Button>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </form>
    );
}
