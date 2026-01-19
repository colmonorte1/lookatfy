"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { Mail, Lock, User, Briefcase, ArrowLeft, Tag } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ExpertRegisterPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [title, setTitle] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient();
            const fullName = `${firstName} ${lastName}`.trim();

            // 1. Sign Up
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: 'expert',
                        title: title // Backup in metadata
                    }
                }
            });

            if (signUpError) throw signUpError;

            // 2. If we have a session (auto-confirm enabled), create Expert record
            if (data.session) {
                const { error: expertError } = await supabase
                    .from('experts')
                    .insert({
                        id: data.user?.id,
                        title: title,
                        bio: '', // Empty for now
                        consultation_price: 0
                    });

                if (expertError) {
                    console.error('Error creating expert record:', expertError);
                    // Continue anyway, user can fix in profile
                }
            }

            router.push('/expert/profile');

        } catch (err: any) {
            setError(err.message || 'Error al registrarse');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgb(var(--text-secondary))', textDecoration: 'none', fontSize: '0.9rem' }}>
                <ArrowLeft size={16} /> Volver
            </Link>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Aplicar como Experto</h1>
                <p style={{ color: 'rgb(var(--text-secondary))' }}>Comparte tu conocimiento y monetiza tu tiempo</p>
            </div>

            {error && (
                <div style={{
                    background: 'rgba(var(--error), 0.1)',
                    color: 'rgb(var(--error))',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="Nombre"
                        placeholder="Tu nombre"
                        icon={<User size={18} />}
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                    />
                    <Input
                        label="Apellidos"
                        placeholder="Tus apellidos"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                    />
                </div>

                <Input
                    label="Título Profesional"
                    placeholder="ej. Abogado Penalista, Consultor SEO"
                    icon={<Briefcase size={18} />}
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />

                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    icon={<Mail size={18} />}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                    label="Contraseña"
                    type="password"
                    placeholder="Crea una contraseña segura"
                    icon={<Lock size={18} />}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <Button
                    type="submit"
                    style={{ width: '100%', marginTop: '0.5rem' }}
                    isLoading={isLoading}
                    size="lg"
                >
                    Continuar Aplicación
                </Button>

                <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))', textAlign: 'center', lineHeight: '1.5' }}>
                    Al registrarte, aceptas nuestros <Link href="#" style={{ color: 'rgb(var(--primary))' }}>Términos de Servicio para Expertos</Link>.
                </p>
            </form>
        </div>
    );
}
