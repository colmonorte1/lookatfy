"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Clock, MapPin, CheckCircle, Calendar, CreditCard, ChevronLeft, ChevronRight, ShieldCheck, Video, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { ReviewsList } from '@/components/ui/Reviews/ReviewsList';
import { BookingCalendar } from '@/components/ui/Calendar/BookingCalendar';

interface ServiceDetailProps {
    service: any; // Type should ideally be stricter
    expert: any;
    reviews?: any[];
}

export default function ServiceDetailClient({ service, expert, reviews = [] }: ServiceDetailProps) {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const router = useRouter();

    const formattedReviews = reviews.map(r => ({
        id: r.id,
        author: r.reviewer?.full_name || 'Usuario',
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString(),
        comment: r.comment
    }));
    // ... (skip to render part)
    // ...


    const handleBooking = () => {
        if (!selectedDate || !selectedTime) return;

        const dateObj = new Date();
        if (selectedDate) dateObj.setDate(selectedDate);
        const formattedDate = dateObj.toISOString().split('T')[0];

        const params = new URLSearchParams({
            title: service.title,
            expert: expert.name || 'Experto',
            price: service.price.toString(),
            date: formattedDate,
            time: selectedTime,
            currency: service.currency || 'USD',
            image: service.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80', // Fallback image if none
            serviceId: service.id,
            expertId: service.expert_id
        });

        router.push(`/checkout?${params.toString()}`);
    };

    const handleDateSelect = (dateStr: string, time: string) => {
        const d = new Date(dateStr);
        setSelectedDate(d.getDate());
        setSelectedTime(time);
        setIsCalendarOpen(false); // Close calendar after selection ? or keep open. Let's close it.
    };

    // Fallback/Default values if data is missing
    const serviceImage = service.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80';
    const expertAvatar = expert.avatar_url || 'https://i.pravatar.cc/150?u=expert';
    const expertName = expert.full_name || 'Experto Lookatfy';
    const expertTitle = expert.title || 'Asesor de Imagen';

    return (
        <main style={{ paddingBottom: '4rem', background: 'rgb(var(--background))', minHeight: '100vh' }}>
            {/* Header Image */}
            <div style={{ height: '400px', width: '100%', position: 'relative', overflow: 'hidden' }}>
                <img
                    src={serviceImage}
                    alt={service.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
                <div className="container" style={{ position: 'absolute', bottom: '2rem', left: '0', right: '0', color: 'white' }}>
                    <Link href="/" style={{ color: 'white', display: 'inline-flex', alignItems: 'center', marginBottom: '1rem', textDecoration: 'none', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                        <ChevronLeft size={16} /> Volver
                    </Link>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ background: 'rgb(var(--primary))', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{service.category || 'General'}</span>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Video size={14} /> {service.type}
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'white' }}>{service.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Star fill="currentColor" color="rgb(var(--warning))" size={18} /> {expert.rating || '5.0'} ({expert.reviews_count || '0'} reseñas)</span>
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
                            src={expertAvatar}
                            alt={expertName}
                            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {expertName}
                                {expert.verified && <ShieldCheck size={18} color="rgb(var(--success))" />}
                            </h3>
                            <div style={{ color: 'rgb(var(--primary))', fontWeight: 500, marginBottom: '0.5rem' }}>{expertTitle}</div>
                            <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-secondary))', lineHeight: '1.5' }}>
                                "{expert.bio || 'Experto verificado en Lookatfy.'}"
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
                                    {service.includes && service.includes.length > 0 ? service.includes.map((item: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', color: 'rgb(var(--text-secondary))', fontSize: '0.95rem' }}>
                                            <CheckCircle size={18} color="rgb(var(--success))" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                            <span>{item}</span>
                                        </div>
                                    )) : <span style={{ color: 'rgb(var(--text-muted))' }}>No especificado</span>}
                                </div>
                            </div>

                            {service.not_includes && service.not_includes.length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'rgb(var(--text-muted))' }}>
                                        Lo que NO incluye
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {service.not_includes.map((item: string, i: number) => (
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
                        <p style={{ fontSize: '0.9rem', color: 'rgb(var(--text-secondary))' }}>{service.requirements || 'No se requieren requisitos previos especiales.'}</p>
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'rgb(var(--border))', margin: '2rem 0' }} />

                    {/* Service Reviews */}
                    <section>
                        {formattedReviews.length > 0 ? (
                            <ReviewsList reviews={formattedReviews} title={`Reseñas (${formattedReviews.length})`} />
                        ) : (
                            <div style={{ marginTop: '2rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>Reseñas</h3>
                                <p style={{ color: 'rgb(var(--text-secondary))', fontStyle: 'italic' }}>Este experto aún no tiene reseñas.</p>
                            </div>
                        )}
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
                expertId={service.expert_id}
                serviceDuration={service.duration}
            />
        </main>
    );
}
