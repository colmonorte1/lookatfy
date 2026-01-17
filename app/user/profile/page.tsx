"use client";

import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Save, User as UserIcon, Mail, Phone, MapPin } from 'lucide-react';

export default function UserProfilePage() {
    return (
        <div style={{ maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Mi Perfil</h1>

            <div style={{
                background: 'rgb(var(--surface))',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgb(var(--border))'
            }}>
                {/* Avatar Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '100px', height: '100px', borderRadius: '50%',
                        background: 'rgb(var(--surface-hover))', border: '1px solid rgb(var(--border))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <UserIcon size={40} color="rgb(var(--text-secondary))" />
                    </div>
                    <div>
                        <Button variant="outline" size="sm">Cambiar Foto</Button>
                    </div>
                </div>

                <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', borderBottom: '1px solid rgb(var(--border))', paddingBottom: '0.5rem' }}>Información Personal</h3>
                    </div>

                    <Input label="Nombre Completo" placeholder="Ana Lopez" />
                    <Input label="Teléfono" placeholder="+34 600 000 000" />
                    <Input label="Email" type="email" placeholder="ana@example.com" disabled />
                    <Input label="Ciudad" placeholder="Madrid, España" />

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
                        <Button style={{ gap: '0.5rem' }}>
                            <Save size={18} />
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
