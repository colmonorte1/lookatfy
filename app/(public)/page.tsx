"use client";

import { useState } from 'react';
import { Search, MapPin, Tag, Star, Clock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';

// Mock Data for Services
const SERVICES_MOCK = [
  {
    id: '1',
    title: 'Asesoría de Estilo Personal',
    expert: 'María López',
    category: 'Moda',
    country: 'España',
    price: 50,
    currency: 'EUR',
    rating: 4.8,
    reviews: 120,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80',
    avatar: 'https://i.pravatar.cc/150?u=maria'
  },
  {
    id: '2',
    title: 'Revisión Técnica de Código',
    expert: 'Carlos Dev',
    category: 'Tecnología',
    country: 'México',
    price: 80,
    currency: 'USD',
    rating: 5.0,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    avatar: 'https://i.pravatar.cc/150?u=carlos'
  },
  {
    id: '3',
    title: 'Clase de Yoga Avanzada',
    expert: 'Ana Vida',
    category: 'Salud',
    country: 'Colombia',
    price: 30,
    currency: 'USD',
    rating: 4.9,
    reviews: 200,
    image: 'https://images.unsplash.com/photo-1544367563-12123d8975bd?w=800&q=80',
    avatar: 'https://i.pravatar.cc/150?u=ana'
  },
  {
    id: '4',
    title: 'Consultoría Legal Startup',
    expert: 'Dr. John Law',
    category: 'Legal',
    country: 'USA',
    price: 150,
    currency: 'USD',
    rating: 4.7,
    reviews: 30,
    image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&q=80',
    avatar: 'https://i.pravatar.cc/150?u=john'
  },
  {
    id: '5',
    title: 'Tour Virtual por Madrid',
    expert: 'Sofia Guide',
    category: 'Turismo',
    country: 'España',
    price: 40,
    currency: 'EUR',
    rating: 4.6,
    reviews: 85,
    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&q=80',
    avatar: 'https://i.pravatar.cc/150?u=sofia'
  },
  {
    id: '6',
    title: 'Nutrición y Dieta Keto',
    expert: 'NutriFit',
    category: 'Salud',
    country: 'Argentina',
    price: 45,
    currency: 'USD',
    rating: 4.9,
    reviews: 150,
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80',
    avatar: 'https://i.pravatar.cc/150?u=nutri'
  }
];

const CATEGORIES = ['Todas', 'Moda', 'Tecnología', 'Salud', 'Legal', 'Turismo'];
const COUNTRIES = ['Todos', 'España', 'México', 'Colombia', 'Argentina', 'USA'];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [countryFilter, setCountryFilter] = useState('Todos');

  const filteredServices = SERVICES_MOCK.filter(service => {
    const matchesTerm = service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.expert.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || service.category === categoryFilter;
    const matchesCountry = countryFilter === 'Todos' || service.country === countryFilter;
    return matchesTerm && matchesCategory && matchesCountry;
  });

  return (
    <main>
      {/* Hero Section */}
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

          {/* Search Bar */}
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
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
                {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
              </select>

              <Button onClick={() => window.scrollTo({ top: 600, behavior: 'smooth' })}>
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

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {filteredServices.map(service => (
              <Link href={`/services/${service.id}`} key={service.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  background: 'rgb(var(--surface))',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgb(var(--border))',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
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
                  <div style={{ height: '200px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                    <img
                      src={service.image}
                      alt={service.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
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
                      <Tag size={12} /> {service.category}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                        <MapPin size={14} /> {service.country}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--warning))' }}>
                        <Star size={14} fill="currentColor" /> {service.rating} ({service.reviews})
                      </div>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.4 }}>
                      {service.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <img
                        src={service.avatar}
                        alt={service.expert}
                        style={{ width: '32px', height: '32px', borderRadius: '50%' }}
                      />
                      <span style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>Por {service.expert}</span>
                    </div>

                    <div style={{ borderTop: '1px solid rgb(var(--border))', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                        {service.currency === 'USD' ? '$' : '€'}{service.price}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>/ sesión</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
