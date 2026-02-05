import { Button } from '@/components/ui/Button/Button';
import Image from 'next/image';
import { Star, Clock, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { notFound } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs/Tabs';
import Link from 'next/link';
import { ReviewsList } from '@/components/ui/Reviews/ReviewsList';
import styles from './ExpertDetail.module.css';
import { createClient } from '@/utils/supabase/server';

type ServiceRow = {
    id: string;
    category?: string | null;
    status?: string | null;
    title?: string | null;
    description?: string | null;
    image_url?: string | null;
    price?: number | string | null;
    duration?: number | null;
};

export default async function ExpertProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch expert (no JOINs to avoid RLS issues)
    const { data: expertRaw } = await supabase
        .from('experts')
        .select('*')
        .eq('id', id)
        .single();

    if (!expertRaw) {
        notFound();
    }

    // 2. Fetch profile separately (expert.id = profile.id)
    const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, city, country')
        .eq('id', id)
        .single();

    // 3. Fetch services separately
    const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('expert_id', id);

    // 4. Build expert row with merged data
    const expertRow = {
        ...expertRaw,
        profile: profileData || null,
        services: servicesData || []
    };

    const expertName = profileData?.full_name || 'Experto';
    const expertAvatar = profileData?.avatar_url || 'https://i.pravatar.cc/200?u=expert';
    const expertTitle = expertRow.title || 'Asesoría';
    let rating = 5.0;
    let reviewsCount = 0;
    try {
        const { data: ratingsData } = await supabase
            .from('reviews')
            .select('rating')
            .eq('subject_id', id);
        type ReviewRatingRow = { rating?: number | string | null };
        const nums = (ratingsData || []).map((r: ReviewRatingRow) => Number(r.rating)).filter((n) => !isNaN(n));
        reviewsCount = nums.length;
        rating = nums.length ? Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1)) : 5.0;
    } catch {}
    const city = expertRow.profile?.city || '';
    const country = expertRow.profile?.country || '';
    type LangSkill = { name: string; level: string };
    const rawLanguages = (expertRow as { languages?: unknown }).languages;
    const rawSkills = (expertRow as { skills?: unknown }).skills;
    const languages: LangSkill[] = Array.isArray(rawLanguages) ? (rawLanguages as LangSkill[]) : [];
    const skills: LangSkill[] = Array.isArray(rawSkills) ? (rawSkills as LangSkill[]) : [];
    const services: ServiceRow[] = Array.isArray(expertRow.services)
        ? (expertRow.services as ServiceRow[]).filter((s) => s.status !== 'deleted')
        : [];
    const categories: string[] = Array.from(
        new Set(
            services
                .map((s) => s.category)
                .filter((v): v is string => typeof v === 'string')
        )
    );

    // Compute per-service rating averages for this expert's services
    const serviceRatingMap: Record<string, { avg: number; count: number }> = {};
    if (services.length) {
        const serviceIds = services.map((s) => s.id);
        const { data: bookings } = await supabase
            .from('bookings')
            .select('id, service_id')
            .in('service_id', serviceIds);

        const bookingsData = bookings || [];
        const bookingIds = bookingsData.map((b: any) => b.id);

        if (bookingIds.length) {
            // Fetch reviews without JOINs
            const { data: reviewsRows } = await supabase
                .from('reviews')
                .select('rating, booking_id')
                .in('booking_id', bookingIds);

            // Create booking -> service_id map
            const bookingServiceMap: Record<string, string> = {};
            bookingsData.forEach((b: any) => {
                bookingServiceMap[b.id] = b.service_id;
            });

            const agg: Record<string, number[]> = {};
            (reviewsRows || []).forEach((r: any) => {
                const sid = bookingServiceMap[r.booking_id];
                const val = Number(r.rating);
                if (sid && !isNaN(val)) {
                    if (!agg[sid]) agg[sid] = [];
                    agg[sid].push(val);
                }
            });
            Object.entries(agg).forEach(([sid, arr]) => {
                const count = arr.length;
                const avg = count ? arr.reduce((a, b) => a + b, 0) / count : 0;
                serviceRatingMap[sid] = { avg: Number(avg.toFixed(1)), count };
            });
        }
    }

    // Fetch reviews without JOINs
    const { data: reviewsRaw } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, reviewer_id')
        .eq('subject_id', id)
        .order('created_at', { ascending: false })
        .limit(6);

    const reviewsDataRaw = reviewsRaw || [];

    // Fetch reviewer profiles
    const reviewerIds = [...new Set(reviewsDataRaw.map((r: any) => r.reviewer_id).filter(Boolean))];
    let reviewersMap: Record<string, { full_name?: string; avatar_url?: string }> = {};

    if (reviewerIds.length > 0) {
        const { data: reviewerProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', reviewerIds);

        (reviewerProfiles || []).forEach((p: any) => {
            reviewersMap[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        });
    }

    const reviews = reviewsDataRaw.map((r: any) => {
        const reviewer = reviewersMap[r.reviewer_id];
        return {
            id: r.id,
            author: reviewer?.full_name || 'Usuario',
            avatar: reviewer?.avatar_url || undefined,
            rating: Number(r.rating) || 5,
            date: new Date(r.created_at).toLocaleDateString(),
            comment: r.comment || ''
        };
    });

    return (
        <main className="container" style={{ padding: '3rem 1rem 6rem' }}>
            <div className={styles.mainGrid}>

                {/* Left Column: Info & Services */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>

                    {/* Header Section */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <h1 className={styles.title}>{expertName}</h1>
                        </div>
                        <p style={{ fontSize: '1.25rem', color: 'rgb(var(--text-secondary))' }}>{expertTitle}</p>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}>
                                <Star size={20} fill="rgb(var(--warning))" stroke="none" />
                                <span>{rating}</span>
                                <span style={{ color: 'rgb(var(--text-muted))', fontWeight: 400 }}>({reviewsCount} reseñas)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'rgb(var(--text-secondary))' }}>
                                <MapPin size={18} />
                                <span>{[city, country].filter(Boolean).join(', ') || 'Global'}</span>
                            </div>
                        </div>
                    </div>

                    

                    <div style={{ width: '100%', height: '1px', background: 'rgb(var(--border))' }} />

                    {/* Services Section */}
                    <section>
                        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Mis Servicios</h2>

                        <Tabs defaultValue={categories[0] ?? ''} className="w-full">
                            <TabsList>
                                {categories.map(cat => (
                                    <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                                ))}
                            </TabsList>

                            {categories.map(cat => (
                                <TabsContent key={cat} value={cat}>
                                    <div className={styles.servicesList}>
                                        {services.filter(s => s.category === cat).map(service => (
                                            <div key={service.id} className={styles.serviceItem}>
                                                <div className={styles.serviceThumb}>
                                                    <Image
                                                        src={service.image_url || 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=300&h=200'}
                                                        alt={service.title || ''}
                                                        width={120}
                                                        height={80}
                                                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                    />
                                                </div>
                                                <div className={styles.serviceInfo}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>{service.title}</h3>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'rgb(var(--primary))' }}>${Number(service.price) || 0}</div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600, color: 'rgb(var(--warning))' }}>
                                                                <Star size={14} fill="currentColor" stroke="none" /> {serviceRatingMap[service.id]?.avg ?? 5.0} ({serviceRatingMap[service.id]?.count ?? 0})
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                                                        {service.description || ''}
                                                    </p>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.85rem', color: 'rgb(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                            <Clock size={14} /> {service.duration ? `${service.duration} min` : ''}
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
                            {expertRow.bio || ''}
                        </p>
                        <br />
                        <p style={{ lineHeight: '1.6', color: 'rgb(var(--text-secondary))', fontSize: '1.05rem' }}>
                            Soy un profesional apasionado por ayudar a las personas a tomar mejores decisiones.
                            Tengo más de 5 años de experiencia en el rubro y me especializo en brindar consejos prácticos y accionables.
                            ¡Hablemos y solucionemos tu duda en minutos!
                        </p>
                    </section>

                    {(languages.length > 0 || skills.length > 0) && (
                        <section>
                            {languages.length > 0 && (
                                <div style={{
                                    background: 'rgb(var(--surface))',
                                    border: '1px solid rgb(var(--border))',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1rem 1.25rem',
                                    boxShadow: 'var(--shadow-md)',
                                    marginBottom: '1rem'
                                }}>
                                    <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>Idiomas</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }} aria-label="Idiomas">
                                        {languages.map((l, idx) => (
                                            <div key={`${l.name}-${idx}`} style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'rgb(var(--surface-hover))',
                                                border: '1px solid rgb(var(--border))',
                                                borderRadius: '2rem',
                                                padding: '0.5rem 0.75rem'
                                            }}>
                                                <span style={{ fontWeight: 600 }}>{l.name}</span>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    background: 'rgb(var(--surface))',
                                                    border: '1px solid rgb(var(--border))',
                                                    borderRadius: '1rem',
                                                    padding: '0.2rem 0.5rem',
                                                    color: 'rgb(var(--text-secondary))'
                                                }}>{l.level}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {skills.length > 0 && (
                                <div style={{
                                    background: 'rgb(var(--surface))',
                                    border: '1px solid rgb(var(--border))',
                                    borderRadius: 'var(--radius-lg)',
                                    padding: '1rem 1.25rem',
                                    boxShadow: 'var(--shadow-md)'
                                }}>
                                    <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>Skills</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }} aria-label="Skills">
                                        {skills.map((s, idx) => (
                                            <div key={`${s.name}-${idx}`} style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'rgb(var(--surface-hover))',
                                                border: '1px solid rgb(var(--border))',
                                                borderRadius: '2rem',
                                                padding: '0.5rem 0.75rem'
                                            }}>
                                                <span style={{ fontWeight: 600 }}>{s.name}</span>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    background: 'rgb(var(--surface))',
                                                    border: '1px solid rgb(var(--border))',
                                                    borderRadius: '1rem',
                                                    padding: '0.2rem 0.5rem',
                                                    color: 'rgb(var(--text-secondary))'
                                                }}>{s.level}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}

                    {/* Especialidades budgets */}
                    {categories.length > 0 && (
                        <section>
                            <div style={{
                                background: 'rgb(var(--surface))',
                                border: '1px solid rgb(var(--border))',
                                borderRadius: 'var(--radius-lg)',
                                padding: '1rem 1.25rem',
                                boxShadow: 'var(--shadow-md)'
                            }}>
                                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.25rem', fontWeight: 700 }}>Especialidades</h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }} aria-label="Especialidades">
                                    {categories.map(tag => (
                                        <div key={tag} style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            background: 'rgb(var(--surface-hover))',
                                            border: '1px solid rgb(var(--border))',
                                            borderRadius: '2rem',
                                            padding: '0.5rem 0.75rem'
                                        }}>
                                            <span style={{ fontWeight: 600 }}>{tag}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    <div style={{ width: '100%', height: '1px', background: 'rgb(var(--border))' }} />

                    {/* Reviews */}
                    <section>
                        <ReviewsList reviews={reviews} title="Opiniones de Clientes" />
                    </section>
                </div>

                {/* Right Column: Profile Summary (No Booking) */}
                <div style={{ position: 'relative' }}>
                    <div className={styles.stickyCard}>
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
                                src={expertAvatar}
                                alt={expertName}
                                width={140}
                                height={140}
                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                            />
                        </div>

                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{expertName}</h3>
                        <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem' }}>{expertTitle}</p>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{reviewsCount}</div>
                                <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>Reseñas</div>
                            </div>
                            <div style={{ width: '1px', height: '30px', background: 'rgb(var(--border))' }}></div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{rating}</div>
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

