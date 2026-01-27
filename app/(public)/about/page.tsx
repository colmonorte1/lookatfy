"use client";

import { Search, Calendar, Video, ShieldCheck, Award, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import styles from './About.module.css';

export default function AboutPage() {
    return (
        <main>
            {/* Hero Section */}
            <section className={styles.hero}>
                <h1 className={styles.title}>
                    Conecta con Expertos<br />en Minutos
                </h1>
                <p className={styles.subtitle}>
                    Lookatfy elimina las barreras. Accede a consultoría de alto nivel con profesionales verificados, sin burocracia y al instante.
                </p>
            </section>

            {/* Steps Section */}
            <section className={styles.stepsSection}>
                <div className={styles.stepsGrid}>
                    {/* Step 1 */}
                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>1</div>
                        <div className={styles.stepContent}>
                            <div className={styles.stepIcon}>
                                <Search size={32} />
                            </div>
                            <h3 className={styles.stepTitle}>Busca tu Experto</h3>
                            <p className={styles.stepDescription}>
                                Explora entre cientos de profesionales verificados por categoría, precio o especialidad. Encuentra al mentor ideal para tu necesidad.
                            </p>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>2</div>
                        <div className={styles.stepContent}>
                            <div className={styles.stepIcon}>
                                <Calendar size={32} />
                            </div>
                            <h3 className={styles.stepTitle}>Reserva tu Sesión</h3>
                            <p className={styles.stepDescription}>
                                Elige el servicio (1:1, auditoría, mentoría) y selecciona el horario que mejor te convenga. Pago seguro y transparente.
                            </p>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className={styles.stepCard}>
                        <div className={styles.stepNumber}>3</div>
                        <div className={styles.stepContent}>
                            <div className={styles.stepIcon}>
                                <Video size={32} />
                            </div>
                            <h3 className={styles.stepTitle}>Conéctate y Aprende</h3>
                            <p className={styles.stepDescription}>
                                Recibe un enlace único para tu video consulta. Habla cara a cara, comparte pantalla y resuelve tus dudas al instante.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className={styles.trustSection}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>Tu tranquilidad es nuestra prioridad</h2>
                <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '4rem' }}>Garantizamos una experiencia segura y de calidad en cada interacción.</p>

                <div className={styles.featuresGrid}>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>
                            <ShieldCheck size={24} />
                        </div>
                        <h4 className={styles.featureTitle}>Expertos Verificados</h4>
                        <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Validamos la identidad y credenciales de cada profesional en la plataforma.
                        </p>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>
                            <Award size={24} />
                        </div>
                        <h4 className={styles.featureTitle}>Satisfacción Garantizada</h4>
                        <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Si la sesión no cumple con lo prometido, revisamos tu caso para un reembolso.
                        </p>
                    </div>
                    <div className={styles.feature}>
                        <div className={styles.featureIcon}>
                            <Zap size={24} />
                        </div>
                        <h4 className={styles.featureTitle}>Tecnología de Punta</h4>
                        <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', lineHeight: '1.5' }}>
                            Video de alta definición y baja latencia para que la conversación fluya.
                        </p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>¿Listo para avanzar?</h2>
                <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                    Deja de dar vueltas y obtén las respuestas que necesitas hoy mismo.
                </p>
                <Link href="/services/search">
                    <Button variant="primary" size="lg" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem', borderRadius: '2rem', gap: '0.5rem' }}>
                        Ver Expertos Disponibles <ArrowRight size={20} />
                    </Button>
                </Link>
            </section>
        </main>
    );
}
