"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, MapPin, Tag, Star } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import Image from 'next/image';

interface Service {
    id: string;
    title: string;
    price: number;
    currency: string; // We might need to default this if not in DB yet, schema said EUR default.
    category: string;
    image_url?: string;
    country?: string;
    rating_avg?: number;
    reviews_count_service?: number;
    expert: {
        id: string;
        title: string;
        rating: number;
        reviews_count: number;
        city?: string;
        country?: string;
        profile: {
            full_name: string;
            avatar_url: string;
        }
    }
}

interface ServicesGridProps {
    services: Service[];
    categories?: string[];
    countries?: string[];
}

export default function ServicesGrid({ services, categories = [], countries = [] }: ServicesGridProps) {
    const sp = useSearchParams();
    const initialSearch = sp.get('q') ?? '';
    const initialCategory = (() => {
        const c = sp.get('category');
        return c && categories.includes(c) ? c : 'Todas';
    })();
    const initialCountry = (() => {
        const c = sp.get('country');
        return c && countries.includes(c) ? c : 'Todos';
    })();
    const [searchTerm, setSearchTerm] = useState(() => initialSearch);
    const [categoryFilter, setCategoryFilter] = useState(() => initialCategory);
    const [countryFilter, setCountryFilter] = useState(() => initialCountry);
    const router = useRouter();

    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

    const filteredServices = services.filter(service => {
        const expertName = service.expert?.profile?.full_name || '';
        const serviceCategory = service.category || 'Otros';
        const serviceCountry = service.country || service.expert?.country || 'Desconocido';

        const matchesTerm = normalize(service.title).includes(normalize(searchTerm)) ||
            normalize(expertName).includes(normalize(searchTerm));

        const matchesCategory = categoryFilter === 'Todas' || normalize(serviceCategory) === normalize(categoryFilter);
        const matchesCountry = countryFilter === 'Todos' || (serviceCountry && normalize(serviceCountry).includes(normalize(countryFilter)));

        return matchesTerm && matchesCategory && matchesCountry;
    });

    return (
        <>
            {/* Search Bar Section - Moved inside here to control state */}
            <section style={{
                background: 'linear-gradient(135deg, rgb(var(--surface)) 0%, rgba(var(--primary), 0.1) 100%)',
                padding: '6rem 1rem 4rem',
                textAlign: 'center',
                borderBottom: '1px solid rgb(var(--border))'
            }}>
                <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <h1 style={{
                        fontSize: '3.5rem',
                        marginBottom: '1rem',
                        lineHeight: 1.1,
                        background: 'linear-gradient(to right, rgb(var(--primary)), rgb(var(--secondary)))',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-1px'
                    }}>
                        Encuentra Expertos en Tiempo Real
                    </h1>
                    <p style={{
                        color: 'rgb(var(--text-secondary))',
                        fontSize: '1.25rem',
                        marginBottom: '3rem'
                    }}>
                        Conecta por video al instante para recibir asesoría, resolver dudas o aprender nuevas habilidades.
                    </p>

                    <div style={{
                        background: 'white',
                        padding: '1rem',
                        borderRadius: 'var(--radius-full)',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid rgb(var(--border))'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, paddingLeft: '1rem', minWidth: '200px' }}>
                            <Search size={20} color="rgb(var(--text-muted))" />
                            <input
                                type="text"
                                placeholder="¿Qué servicio buscas? (ej. Yoga, Abogado...)"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '1rem',
                                    width: '100%',
                                    color: 'rgb(var(--text-main))'
                                }}
                            />
                        </div>

                        <div style={{ height: '30px', width: '1px', background: 'rgb(var(--border))', display: 'none' }} className="desktop-only" />

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    background: 'rgb(var(--surface-hover))',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    color: 'rgb(var(--text-secondary))',
                                    cursor: 'pointer'
                                }}
                            >
                                {['Todas', ...categories].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>

                            <select
                                value={countryFilter}
                                onChange={(e) => setCountryFilter(e.target.value)}
                                style={{
                                    padding: '0.5rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'none',
                                    background: 'rgb(var(--surface-hover))',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    color: 'rgb(var(--text-secondary))',
                                    cursor: 'pointer'
                                }}
                            >
                                {['Todos', ...countries].map(country => <option key={country} value={country}>{country}</option>)}
                            </select>

                            <Button onClick={() => {
                                const params = new URLSearchParams();
                                if (searchTerm.trim()) params.set('q', searchTerm.trim());
                                if (categoryFilter && categoryFilter !== 'Todas') params.set('category', categoryFilter);
                                if (countryFilter && countryFilter !== 'Todos') params.set('country', countryFilter);
                                const qs = params.toString();
                                router.push(qs ? `/services/search?${qs}` : '/services/search');
                            }}>
                                Buscar
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Results Section */}
            <section style={{ padding: '4rem 1rem', background: 'rgb(var(--background))' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 600 }}>Explora Servicios Destacados</h2>
                        <span style={{ color: 'rgb(var(--text-secondary))' }}>{filteredServices.length} resultados encontrados</span>
                    </div>

                    {filteredServices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgb(var(--text-secondary))' }}>
                            No se encontraron servicios que coincidan con tu búsqueda.
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                            gap: '2rem'
                        }}>
                            {filteredServices.map(service => {
                                const expertName = service.expert?.profile?.full_name || 'Experto';
                                const expertAvatar = service.expert?.profile?.avatar_url || 'https://i.pravatar.cc/150?u=expert';
                                const serviceRating = service.rating_avg ?? 5.0;
                                const serviceReviews = service.reviews_count_service ?? 0;
                                const country = service.country || service.expert?.country || 'Global';
                                const priceLabel = new Intl.NumberFormat('es-ES', {
                                    style: 'currency',
                                    currency: service.currency || 'USD'
                                }).format(Number(service.price) || 0);

                                return (
                                    <Link href={`/services/${service.id}`} key={service.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div style={{
                                            background: 'rgb(var(--surface))',
                                            borderRadius: 'var(--radius-lg)',
                                            border: '1px solid rgb(var(--border))',
                                            overflow: 'hidden',
                                            transition: 'transform 0.2s, box-shadow 0.2s',
                                            cursor: 'pointer',
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            {/* Image */}
                                            <div style={{ height: '200px', width: '100%', position: 'relative', overflow: 'hidden', background: '#f0f0f0' }}>
                                                {service.image_url ? (
                                                    <Image
                                                        src={service.image_url}
                                                        alt={service.title}
                                                        fill
                                                        style={{ objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                                                        Sin Imagen
                                                    </div>
                                                )}

                                                <div style={{
                                                    position: 'absolute',
                                                    top: '1rem',
                                                    left: '1rem',
                                                    background: 'rgba(255,255,255,0.9)',
                                                    padding: '0.25rem 0.75rem',
                                                    borderRadius: 'var(--radius-full)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}>
                                                    <Tag size={12} /> {service.category || 'General'}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                                        <MapPin size={14} /> {country}
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--warning))' }}>
                                                        <Star size={14} fill="currentColor" /> {serviceRating} ({serviceReviews})
                                                    </div>
                                                </div>

                                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.4, flex: 1 }}>
                                                    {service.title}
                                                </h3>

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                                    <Image
                                                        src={expertAvatar}
                                                        alt={expertName}
                                                        width={32}
                                                        height={32}
                                                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                                                    />
                                                    <span style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>Por {expertName}</span>
                                                </div>

                                                <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                                                        {priceLabel}
                                                    </span>
                                                    <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>/ sesión</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
