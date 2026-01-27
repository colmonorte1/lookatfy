"use client";

import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';

export default function NewUserPage() {
    return (
        <div style={{ maxWidth: '600px' }}>
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/admin/users" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    color: 'rgb(var(--text-secondary))', marginBottom: '1rem', fontSize: '0.9rem'
                }}>
                    <ArrowLeft size={16} />
                    Volver al listado
                </Link>
                <h1 style={{ fontSize: '2rem' }}>Crear Nuevo Usuario</h1>
            </div>

            <div style={{
                background: 'rgb(var(--surface))',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))'
            }}>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <Input label="Nombre" placeholder="Juan Pérez" />
                        <Input label="Apellido" placeholder="Pérez" />
                    </div>

                    <Input label="Correo electrónico" type="email" placeholder="usuario@email.com" />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Rol</label>
                        <select style={{
                            padding: '0.625rem 1rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid rgb(var(--border))',
                            fontFamily: 'inherit'
                        }}>
                            <option value="user">Usuario</option>
                            <option value="expert">Experto</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <Button type="submit" style={{ gap: '0.5rem' }}>
                            <Save size={18} />
                            Guardar Usuario
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
