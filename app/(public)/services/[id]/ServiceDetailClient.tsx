"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Clock, MapPin, CheckCircle, Calendar, CreditCard, ChevronLeft, ChevronRight, ShieldCheck, Video, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import styles from './ServiceDetailClient.module.css';
import Link from 'next/link';
import { ReviewsList } from '@/components/ui/Reviews/ReviewsList';
import { BookingCalendar } from '@/components/ui/Calendar/BookingCalendar';

interface ServiceDetailProps {
    service: {
        id: string;
        category?: string | null;
        title?: string;
        price?: number | string;
        currency?: string;
        country?: string | null;
        image_url?: string | null;
        expert_id?: string;
        description?: string | null;
        includes?: string[] | null;
        not_includes?: string[] | null;
        benefits?: string[] | null;
        client_requirements?: string[] | null;
        requirements?: string | null;
        type?: string | null;
        duration?: number | null;
    };
    expert: {
        full_name?: string | null;
        avatar_url?: string | null;
        title?: string | null;
        rating_avg?: number | null;
        reviews_total?: number | null;
        bio?: string | null;
        verified?: boolean | null;
        country?: string | null;
        name?: string | null;
        languages?: Array<{ name: string; level: string }>;
        skills?: Array<{ name: string; level: string }>;
        timezone?: string | null;
    };
    reviews?: {
        id: string;
        rating: number;
        comment?: string | null;
        created_at: string;
        reviewer?: { full_name?: string | null; avatar_url?: string | null } | null;
    }[];
}

export default function ServiceDetailClient({ service, expert, reviews = [] }: ServiceDetailProps) {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const router = useRouter();
    const formatAmount = (cur: string, amount: number) => {
        if (cur === 'COP') {
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(amount));
        }
        if (cur === 'EUR') {
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };
    const priceLabel = formatAmount(service.currency || 'USD', Number(service.price) || 0);
    const country = service.country || expert.country || 'Global';

    const formattedReviews = (reviews || []).map((r) => ({
        id: r.id,
        author: r.reviewer?.full_name || 'Usuario',
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString(),
        comment: r.comment ? String(r.comment) : ''
    }));
    const serviceAvg = formattedReviews.length ? Number((formattedReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / formattedReviews.length).toFixed(1)) : 5.0;
    const reqText = service.requirements || '';
    const parts = reqText.split(' | ');
    const bPart = parts.find((p: string) => p.startsWith('Beneficios:')) || '';
    const rPart = parts.find((p: string) => p.startsWith('Requisitos:')) || '';
    const benefitsList = Array.isArray(service.benefits) ? service.benefits : bPart.replace('Beneficios:', '').split(';').map((s: string) => s.trim()).filter(Boolean);
    const clientReqsList = Array.isArray(service.client_requirements) ? service.client_requirements : rPart.replace('Requisitos:', '').split(';').map((s: string) => s.trim()).filter(Boolean);
    // ... (skip to render part)
    // ...


    const handleBooking = () => {
        if (!selectedDate || !selectedTime) return;

        const formattedDate = selectedDateStr || (() => {
            const y = new Date().getFullYear();
            const m = String(new Date().getMonth() + 1).padStart(2, '0');
            const d = String(selectedDate).padStart(2, '0');
            return `${y}-${m}-${d}`;
        })();

        const params = new URLSearchParams();
        params.set('title', service.title || '');
        params.set('expert', expert.name || expert.full_name || 'Experto');
        params.set('price', String(service.price ?? ''));
        params.set('date', formattedDate);
        params.set('time', selectedTime);
        params.set('currency', service.currency || 'USD');
        params.set('image', service.image_url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80');
        params.set('serviceId', String(service.id));
        params.set('expertId', String(service.expert_id ?? ''));

        router.push(`/checkout?${params.toString()}`);
    };

    const handleDateSelect = (dateStr: string, time: string) => {
        const d = new Date(dateStr);
        setSelectedDate(d.getDate());
        setSelectedDateStr(dateStr);
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
            <div className={styles.hero}>
                <img
                    src={serviceImage}
                    alt={service.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div className={styles.heroOverlay} />
                <div className={`container ${styles.heroContent}`}>
                    <Link href="/" style={{ color: 'white', display: 'inline-flex', alignItems: 'center', marginBottom: '1rem', textDecoration: 'none', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-full)' }}>
                        <ChevronLeft size={16} /> Volver
                    </Link>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ background: 'rgb(var(--primary))', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>{service.category || 'General'}</span>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Video size={14} /> {service.type}
                        </span>
                    </div>
                    <h1 className={styles.heroTitle}>{service.title}</h1>
                    <div className={styles.heroMeta}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Star fill="currentColor" color="rgb(var(--warning))" size={18} /> {serviceAvg} ({formattedReviews.length} reseñas del servicio)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Clock size={18} /> {service.duration} mins</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={18} /> {country}</span>
                    </div>
                </div>
            </div>

            <div className={`container ${styles.mainGrid}`}>

                {/* Left Column: Details */}
                <div>
                    {/* Expert Profile Card */}
                    <div className={styles.expertCard}>
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                                <Star size={16} fill="rgb(var(--warning))" stroke="none" /> {expert.rating_avg ?? 5.0} ({expert.reviews_total ?? 0})
                            </div>
                            <p style={{ fontSize: '0.95rem', color: 'rgb(var(--text-secondary))', lineHeight: '1.5' }}>
                                "{expert.bio || 'Experto verificado en Lookatfy.'}"
                            </p>
                            {Array.isArray(expert.languages) && expert.languages.length > 0 && (
                                <div style={{ marginTop: '0.75rem' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>Idiomas</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} aria-label="Idiomas">
                                        {expert.languages.map((l, idx) => (
                                            <span key={`${l.name}-${idx}`} style={{ background: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-secondary))', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem' }}>{l.name} · {l.level}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {Array.isArray(expert.skills) && expert.skills.length > 0 && (
                                <div style={{ marginTop: '0.5rem' }}>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.25rem' }}>Skills</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }} aria-label="Skills">
                                        {expert.skills.map((s, idx) => (
                                            <span key={`${s.name}-${idx}`} style={{ background: 'rgb(var(--surface-hover))', color: 'rgb(var(--text-secondary))', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem' }}>{s.name} · {s.level}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Sobre este servicio</h2>
                        <p style={{ fontSize: '1rem', lineHeight: '1.6', color: 'rgb(var(--text-secondary))' }}>
                            {service.description}
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div className={styles.twoCol}>
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

                    <div style={{ marginBottom: '2rem' }}>
                        <div className={styles.twoCol}>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'rgb(var(--text-main))' }}>
                                    Qué obtienes
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {benefitsList && benefitsList.length > 0 ? benefitsList.map((item: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', color: 'rgb(var(--text-secondary))', fontSize: '0.95rem' }}>
                                            <CheckCircle size={18} color="rgb(var(--success))" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                            <span>{item}</span>
                                        </div>
                                    )) : <span style={{ color: 'rgb(var(--text-muted))' }}>No especificado</span>}
                                </div>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'rgb(var(--text-main))' }}>
                                    Requisitos para el cliente
                                </h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {clientReqsList && clientReqsList.length > 0 ? clientReqsList.map((item: string, i: number) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', color: 'rgb(var(--text-secondary))', fontSize: '0.95rem' }}>
                                            <CheckCircle size={18} color="rgb(var(--primary))" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                            <span>{item}</span>
                                        </div>
                                    )) : <span style={{ color: 'rgb(var(--text-muted))' }}>No especificado</span>}
                                </div>
                            </div>
                        </div>
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
                    <div className={styles.stickyCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid rgb(var(--border))' }}>
                            <div>
                                <span style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                                    {priceLabel}
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
                expertId={String(service.expert_id || '')}
                serviceDuration={Number(service.duration ?? 60)}
                expertTimezone={expert.timezone || undefined}
            />
        </main>
    );
}
