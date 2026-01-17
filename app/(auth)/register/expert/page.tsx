"use client";

import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { Mail, Lock, User, Briefcase, ArrowLeft, Tag } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ExpertRegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simular registro y redirección
        setTimeout(() => {
            setIsLoading(false);
            router.push('/expert/profile'); // Redirigir a completar perfil
        }, 1500);
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

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Input
                        label="Nombre"
                        placeholder="Tu nombre"
                        icon={<User size={18} />}
                        required
                    />
                    <Input
                        label="Apellidos"
                        placeholder="Tus apellidos"
                        required
                    />
                </div>

                <Input
                    label="Título Profesional"
                    placeholder="ej. Abogado Penalista, Consultor SEO"
                    icon={<Briefcase size={18} />}
                    required
                />

                <Input
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    icon={<Mail size={18} />}
                    required
                />

                <Input
                    label="Contraseña"
                    type="password"
                    placeholder="Crea una contraseña segura"
                    icon={<Lock size={18} />}
                    required
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
