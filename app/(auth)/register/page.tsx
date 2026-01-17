import Link from 'next/link';
import { User, Briefcase, ChevronRight } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Únete a Lookatfy</h1>
            <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2.5rem' }}>
                Selecciona cómo quieres usar la plataforma
            </p>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Client Card */}
                <Link href="/register/client" style={{ textDecoration: 'none' }}>
                    <div className="card-hover" style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        transition: 'var(--transition-all)',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}>
                        <div style={{
                            width: '50px', height: '50px',
                            background: 'rgba(var(--primary), 0.1)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgb(var(--primary))'
                        }}>
                            <User size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgb(var(--text-main))', marginBottom: '0.25rem' }}>Soy Cliente</h3>
                            <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>Quiero buscar expertos y reservar asesorías.</p>
                        </div>
                        <ChevronRight size={20} color="rgb(var(--text-muted))" />
                    </div>
                </Link>

                {/* Expert Card */}
                <Link href="/register/expert" style={{ textDecoration: 'none' }}>
                    <div className="card-hover" style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.5rem',
                        transition: 'var(--transition-all)',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}>
                        <div style={{
                            width: '50px', height: '50px',
                            background: 'rgba(var(--secondary), 0.1)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'rgb(var(--secondary))'
                        }}>
                            <Briefcase size={24} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'rgb(var(--text-main))', marginBottom: '0.25rem' }}>Soy Experto</h3>
                            <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>Quiero ofrecer mis servicios y ganar dinero.</p>
                        </div>
                        <ChevronRight size={20} color="rgb(var(--text-muted))" />
                    </div>
                </Link>
            </div>

            <p style={{ marginTop: '2.5rem', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>
                ¿Ya tienes una cuenta? <Link href="/login" style={{ color: 'rgb(var(--primary))', fontWeight: 600 }}>Inicia Sesión</Link>
            </p>
        </div>
    );
}
