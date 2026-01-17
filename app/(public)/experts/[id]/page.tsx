import { EXPERTS } from '@/lib/data/experts';
import { Button } from '@/components/ui/Button/Button';
import Image from 'next/image';
import { Star, Clock, MapPin, ShieldCheck, Video, ChevronRight, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';
import Link from 'next/link';
import { ReviewsList } from '@/components/ui/Reviews/ReviewsList';

export async function generateStaticParams() {
    return EXPERTS.map((expert) => ({
        id: expert.id,
    }));
}

export default async function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const expert = EXPERTS.find((e) => e.id === id);

    if (!expert) {
        notFound();
    }

    // Mock Services Data tailored for this view
    const SERVICES = [
        {
            id: '1',
            title: 'Sesión de Consultoría 1:1',
            price: 50,
            duration: '60 min',
            category: 'Consultoría',
            description: 'Resuelvo tus dudas específicas sobre tu negocio o carrera profesional en una videollamada privada.',
            image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=300&h=200'
        },
        {
            id: '2',
            title: 'Revisión de Portafolio',
            price: 80,
            duration: '90 min',
            category: 'Auditoría',
            description: 'Análisis detallado de tu trabajo con feedback constructivo y plan de mejora.',
            image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=300&h=200'
        },
        {
            id: '3',
            title: 'Mentoria Mensual (4 Sesiones)',
            price: 180,
            duration: '4 x 60 min',
            category: 'Mentoría',
            description: 'Acompañamiento continuo para lograr tus objetivos a mediano plazo.',
            image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=300&h=200'
        },
        {
            id: '4',
            title: 'Auditoría Técnica Express',
            price: 120,
            duration: '45 min',
            category: 'Auditoría',
            description: 'Diagnóstico rápido de tu código o arquitectura de sistemas.',
            image: 'https://images.unsplash.com/photo-1504384308090-c54be385329d?auto=format&fit=crop&q=80&w=300&h=200'
        }
    ];

    // Extract unique categories
    const categories = Array.from(new Set(SERVICES.map(s => s.category)));

    return (
        <main className="container" style={{ padding: '3rem 1rem 6rem' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 350px',
                gap: '4rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>

                {/* Left Column: Info & Services */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                    {/* Header Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h1 style={{ fontSize: '2.5rem' }}>{expert.name}</h1>
                            {expert.isOnline && (
                                <span style={{
                                    background: 'rgb(var(--success))',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '1rem',
                                    fontWeight: 600
                                }}>
                                    Online
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '1.25rem', color: 'rgb(var(--text-secondary))' }}>{expert.title}</p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                <Star size={20} fill="rgb(var(--warning))" stroke="none" />
                                <span>{expert.rating}</span>
                                <span style={{ color: 'rgb(var(--text-muted))', fontWeight: 400 }}>({expert.reviews} reseñas)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgb(var(--text-secondary))' }}>
                                <MapPin size={18} />
                                <span>Madrid, España</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'rgb(var(--border))' }} />

                    {/* Services Section */}
                    <section>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Mis Servicios</h2>

                        <Tabs defaultValue={categories[0]} className="w-full">
                            <TabsList>
                                {categories.map(cat => (
                                    <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                                ))}
                            </TabsList>

                            {categories.map(cat => (
                                <TabsContent key={cat} value={cat}>
                                    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>
                                        {SERVICES.filter(s => s.category === cat).map(service => (
                                            <div key={service.id} style={{
                                                display: 'flex',
                                                gap: '1.5rem',
                                                padding: '1.5rem',
                                                border: '1px solid rgb(var(--border))',
                                                borderRadius: 'var(--radius-lg)',
                                                background: 'rgb(var(--surface))',
                                                transition: 'transform 0.2s',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ width: '120px', height: '80px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
                                                    <Image
                                                        src={service.image}
                                                        alt={service.title}
                                                        width={120}
                                                        height={80}
                                                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{service.title}</h3>
                                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'rgb(var(--primary))' }}>${service.price}</div>
                                                    </div>
                                                    <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                                                        {service.description}
                                                    </p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Clock size={14} /> {service.duration}
                                                        </span>
                                                        <Link href={`/services/${service.id}`}>
                                                            <Button variant="outline" size="sm" style={{ gap: '0.5rem' }}>
                                                                Ver Detalles <ArrowRight size={16} />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </section>

                    <div style={{ width: '100%', height: '1px', background: 'rgb(var(--border))' }} />

                    {/* About */}
                    <section>
                        <h2 style={{ marginBottom: '1rem' }}>Sobre mí</h2>
                        <p style={{ lineHeight: '1.6', color: 'rgb(var(--text-secondary))', fontSize: '1.05rem' }}>
                            {expert.bio}
                        </p>
                        <br />
                        <p style={{ lineHeight: '1.6', color: 'rgb(var(--text-secondary))', fontSize: '1.05rem' }}>
                            Soy un profesional apasionado por ayudar a las personas a tomar mejores decisiones.
                            Tengo más de 5 años de experiencia en el rubro y me especializo en brindar consejos prácticos y accionables.
                            ¡Hablemos y solucionemos tu duda en minutos!
                        </p>
                    </section>

                    {/* Skills */}
                    <section>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Especialidades</h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {expert.tags.map(tag => (
                                <span key={tag} style={{
                                    background: 'rgb(var(--surface-hover))',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    color: 'rgb(var(--text-main))'
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </section>

                    <div style={{ width: '100%', height: '1px', background: 'rgb(var(--border))' }} />

                    {/* Reviews */}
                    <section>
                        <ReviewsList reviews={[
                            { id: '101', author: 'Carlos M.', rating: 5, date: 'Hace 2 días', comment: 'Increíble sesión, María me ayudó a aclarar mi estrategia de ventas.', serviceName: 'Consultoría 1:1' },
                            { id: '102', author: 'Laura G.', rating: 4.5, date: 'Hace 1 semana', comment: 'Muy profesional y directa. Recomendada.', serviceName: 'Revisión de Portafolio' },
                            { id: '103', author: 'Pedro S.', rating: 5, date: 'Hace 3 semanas', comment: 'La mejor inversión que he hecho este año para mi negocio.', serviceName: 'Auditoría Técnica' }
                        ]} title="Opiniones de Clientes" />
                    </section>
                </div>

                {/* Right Column: Profile Summary (No Booking) */}
                <div style={{ position: 'relative' }}>
                    <div style={{
                        position: 'sticky',
                        top: '100px',
                        background: 'rgb(var(--surface))',
                        padding: '2rem',
                        borderRadius: '1.5rem',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid rgb(var(--border))',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: '140px',
                            height: '140px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            margin: '0 auto 1.5rem',
                            border: '4px solid white',
                            boxShadow: 'var(--shadow-md)'
                        }}>
                            <Image
                                src={expert.image}
                                alt={expert.name}
                                width={140}
                                height={140}
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                        </div>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{expert.name}</h3>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem' }}>{expert.title}</p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{expert.reviews}</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>Reseñas</div>
                            </div>
                            <div style={{ width: '1px', height: '30px', background: 'rgb(var(--border))' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{expert.rating}</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>Rating</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', justifyContent: 'center' }}>
                                <ShieldCheck size={18} color="rgb(var(--success))" />
                                <span>Identidad Verificada</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', justifyContent: 'center' }}>
                                <Clock size={18} color="rgb(var(--primary))" />
                                <span>Responde rápido</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}

