"use client";

import { Button } from '@/components/ui/Button/Button';
import { Calendar, Clock, Video, Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function UserDashboard() {
    return (
        <div>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem' }}>Hola, Ana 👋</h1>
                <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>
                    Bienvenida de nuevo. Tienes 1 sesión programada.
                </p>
            </div>

            {/* Next Appointment Card - Hero like */}
            <section style={{
                background: 'linear-gradient(135deg, rgb(var(--primary)) 0%, #ff6b6b 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '2rem',
                color: 'white',
                marginBottom: '3rem',
                boxShadow: '0 10px 30px rgba(var(--primary), 0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                        background: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem',
                        borderRadius: '2rem', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem'
                    }}>
                        <Calendar size={16} /> Próxima Sesión
                    </div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Asesoría de Estilo Virtual</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', fontSize: '1.1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={20} /> Hoy, 18:00 PM
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Con <strong>Laura García</strong>
                        </span>
                    </div>
                    <Link href="/user/bookings">
                        <Button style={{
                            background: 'white', color: 'rgb(var(--primary))', border: 'none',
                            fontWeight: 600, padding: '0.75rem 2rem', fontSize: '1rem'
                        }}>
                            <Video size={20} style={{ marginRight: '0.5rem' }} /> Ir a la Videollamada
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* Find Expert */}
                <div style={{
                    background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))', transition: 'all 0.2s', cursor: 'pointer'
                }}>
                    <div style={{
                        width: '50px', height: '50px', borderRadius: '50%',
                        background: 'rgba(var(--secondary), 0.1)', color: 'rgb(var(--secondary))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'
                    }}>
                        <Search size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Explorar Expertos</h3>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Encuentra profesionales en moda, tecnología, hogar y más.
                    </p>
                    <Link href="/experts">
                        <Button variant="outline" style={{ width: '100%', justifyContent: 'space-between' }}>
                            Ver Catálogo <ChevronRight size={16} />
                        </Button>
                    </Link>
                </div>

                {/* Previous Bookings */}
                <div style={{
                    background: 'rgb(var(--surface))', padding: '2rem', borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))'
                }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Historial Reciente</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2].map((_, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                paddingBottom: '1rem', borderBottom: i === 0 ? '1px solid rgb(var(--border))' : 'none'
                            }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '8px',
                                    background: 'rgb(var(--surface-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Calendar size={18} />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Consulta Personal Shopper</div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>12 Ene • Completado</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
