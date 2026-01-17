"use client";

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Clock, MapPin, CheckCircle, Calendar, CreditCard, ChevronLeft, ChevronRight, ShieldCheck, Video, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { ReviewsList } from '@/components/ui/Reviews/ReviewsList';
import { BookingCalendar } from '@/components/ui/Calendar/BookingCalendar';

// Mock Data (Matches Landing Page IDs where possible)
const SERVICE_DETAILS_MOCK: any = {
    '1': {
        id: '1',
        title: 'Asesoría de Estilo Personal',
        description: 'Transforma tu imagen con una sesión personalizada de 45 minutos. Analizaremos tu tipo de cuerpo, estilo de vida y objetivos para crear un guardarropa que te haga sentir seguro y auténtico. Incluye revisión de 5 prendas actuales y sugerencias de compra.',
        expert: {
            name: 'María López',
            title: 'Fashion Stylist & Image Consultant',
            rating: 4.8,
            reviews: 120,
            avatar: 'https://i.pravatar.cc/150?u=maria',
            bio: 'Con más de 10 años en la industria de la moda, he ayudado a cientos de personas a encontrar su propio estilo. Mi enfoque es práctico, empático y adaptado a tu presupuesto.',
            verified: true
        },
        category: 'Moda',
        price: 50,
        currency: 'EUR',
        duration: 45, // minutes
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80',
        includes: [
            'Análisis de tipo de cuerpo',
            'Definición de paleta de colores',
            'Revisión de 5 prendas de tu armario',
            'Lista de compras sugerida'
        ],
        notIncludes: [
            'Compra de prendas (presupuesto aparte)',
            'Organización física de armario',
            'Maquillaje o peluquería'
        ],
        requirements: 'Tener a mano las prendas que quieras revisar y buena iluminación.'
    }
    // Fallback for other IDs handled in component
};

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use() for Next.js 15+ compatibility
    const { id } = use(params);
    const service = SERVICE_DETAILS_MOCK[id] || SERVICE_DETAILS_MOCK['1']; // Fallback to ID 1 for demo

    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Legacy dates array removed in favor of BookingCalendar


    const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    const router = useRouter();

    const handleBooking = () => {
        if (!selectedDate || !selectedTime) return;

        const dateObj = new Date();
        if (selectedDate) dateObj.setDate(selectedDate);
        const formattedDate = dateObj.toISOString().split('T')[0];

        const params = new URLSearchParams({
            title: service.title,
            expert: service.expert.name,
            price: service.price.toString(),
            date: formattedDate,
            time: selectedTime,
            currency: service.currency,
            image: service.image
        });

        router.push(`/checkout?${params.toString()}`);
    };

    const handleDateSelect = (dateStr: string, time: string) => {
        const d = new Date(dateStr);
        setSelectedDate(d.getDate());
        setSelectedTime(time);

        // Auto-scroll to confirm button or provide feedback
        // For now, simpler is better
    };

    return (
        <main style={{ paddingBottom: '4rem', background: 'rgb(var(--background))', minHeight: '100vh' }}>
            {/* Header Image */}
            <div style={{ height: '400px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                <img
                    src={service.image}
                    alt={service.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
                <div className="container" style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', color: 'white' }}>
                    <Link href="/" style={{ color: 'white', display: 'inline-flex', alignItems: 'center', marginBottom: '1rem', textDecoration: 'none', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                        <ChevronLeft size={16} /> Volver
                    </Link>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ background: 'rgb(var(--primary))', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{service.category}</span>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Video size={14} /> Video-llamada
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{service.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Star fill="currentColor" color="rgb(var(--warning))" size={18} /> {service.expert.rating} ({service.expert.reviews} reseñas)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={18} /> {service.duration} mins</span>
                    </div>
                </div>
            </div>

            <div className="container" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '3rem' }}>

                {/* Left Column: Details */}
                <div>
                    {/* Expert Profile Card */}
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        marginBottom: '2rem',
                        display: 'flex',
                        gap: '1.5rem',
                        alignItems: 'start'
                    }}>
                        <img
                            src={service.expert.avatar}
                            alt={service.expert.name}
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {service.expert.name}
                                {service.expert.verified && <ShieldCheck size={18} color="rgb(var(--success))" />}
                            </h3>
                            <div style={{ color: 'rgb(var(--primary))', fontWeight: 500, marginBottom: '0.5rem' }}>{service.expert.title}</div>
                            <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-secondary))', lineHeight: '1.5' }}>
                                "{service.expert.bio}"
                            </p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Sobre este servicio</h2>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'rgb(var(--text-secondary))' }}>
                            {service.description}
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'rgb(var(--text-main))' }}>
                                    Lo que incluye
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {service.includes.map((item: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', color: 'rgb(var(--text-secondary))', fontSize: '0.95rem' }}>
                                            <CheckCircle size={18} color="rgb(var(--success))" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {service.notIncludes && (
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'rgb(var(--text-muted))' }}>
                                        Lo que NO incluye
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {service.notIncludes.map((item: string, i: number) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', color: 'rgb(var(--text-muted))', fontSize: '0.95rem' }}>
                                                <XCircle size={18} color="rgb(var(--text-muted))" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                                <span style={{ fontStyle: 'italic' }}>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(var(--primary), 0.05)', padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>Requisitos previos</h3>
                        <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>{service.requirements}</p>
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'rgb(var(--border))', margin: '2rem 0' }} />

                    {/* Service Reviews */}
                    <section>
                        <ReviewsList reviews={[
                            { id: '201', author: 'Ana R.', rating: 5, date: 'Hace 3 días', comment: 'Me encantó la dinámica, aprendí muchísimo en solo 45 mins.' },
                            { id: '202', author: 'Diego F.', rating: 4, date: 'Hace 2 semanas', comment: 'Muy buen contenido, aunque me hubiera gustado profundizar más en el análisis de color.' },
                            { id: '203', author: 'Sofia L.', rating: 5, date: 'Hace 1 mes', comment: 'Excelente servicio, María es una experta total.' }
                        ]} title="Reseñas del Servicio" />
                    </section>
                </div>

                {/* Right Column: Booking Widget */}
                <div>
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.5rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        position: 'sticky',
                        top: '2rem',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))' }}>
                            <div>
                                <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                    {service.currency === 'USD' ? '$' : '€'}{service.price}
                                </span>
                                <span style={{ color: 'rgb(var(--text-secondary))' }}> / sesión</span>
                            </div>
                            <div style={{ display: 'inline-flex', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'rgb(var(--surface-hover))', fontSize: '0.8rem' }}>
                                <Clock size={14} /> {service.duration} mins
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <Button
                                fullWidth
                                variant="outline"
                                onClick={() => setIsCalendarOpen(true)}
                                style={{ justifyContent: 'space-between', padding: '1rem', height: 'auto' }}
                            >
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                                        <Calendar size={18} />
                                        {selectedDate ? `Día ${selectedDate}` : 'Ver disponibilidad'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))' }}>
                                        {selectedTime ? selectedTime : 'Selecciona fecha y hora'}
                                    </div>
                                </div>
                                <ChevronRight size={16} />
                            </Button>
                        </div>

                        <Button
                            fullWidth
                            size="lg"
                            disabled={!selectedDate || !selectedTime}
                            onClick={handleBooking}
                            style={{ marginTop: '1rem', fontSize: '1rem' }}
                        >
                            {selectedDate && selectedTime ? 'Confirmar Reserva' : 'Selecciona fecha y hora'}
                        </Button>

                        <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <ShieldCheck size={14} /> Garantía de satisfacción Lookatfy
                        </div>
                    </div>
                </div>

            </div>
            <BookingCalendar
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                onSelectDate={handleDateSelect}
            />
        </main>
    );
}

// Add keyframe animation style
const styles = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
