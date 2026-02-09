"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CreditCard, Calendar, Clock, ShieldCheck, ChevronLeft, CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { buildLocalDate } from '@/utils/timezone';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

// Helper to wrap useSearchParams in Suspense
function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [userTimezonePref, setUserTimezonePref] = useState<string | null>(null);

    // Toast notification state
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    // User Form State
    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '', // ReadOnly
        phone: '',
        notes: ''
    });

    const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'PSE' | 'NEQUI' | 'DAVIPLATA'>('PSE');
    const [daviplataDoc, setDaviplataDoc] = useState({ type: 'CC', number: '' });
    const [nequiPhone, setNequiPhone] = useState('');
    const [pseInfo, setPseInfo] = useState({ user_type: 0, user_phone: '', user_legal_id_type: 'CC', user_legal_id: '', financial_institution_code: '', payment_description: '' });
    const [pseBanks, setPseBanks] = useState<Array<{ code: string; name: string }>>([]);
    const [addons, setAddons] = useState<Array<{ id: string; name: string; price: number }>>([]);
    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);

    const [loadingUser, setLoadingUser] = useState(true);

    // Validated price from database (to prevent URL manipulation)
    const [validatedPrice, setValidatedPrice] = useState<number | null>(null);
    const [validatedCurrency, setValidatedCurrency] = useState<string | null>(null);
    const [priceValidationError, setPriceValidationError] = useState<string | null>(null);

    const [intent, setIntent] = useState<{ title?: string; price?: number; currency?: string; image?: string; serviceId?: string; expertId?: string; date?: string; time?: string } | null>(null);
    useEffect(() => {
        try {
            const raw = sessionStorage.getItem('checkout_intent');
            if (raw) setIntent(JSON.parse(raw));
        } catch {}
    }, []);

    const serviceTitle = (intent?.title ?? searchParams.get('title')) || 'Servicio Profesional';
    const expertName = searchParams.get('expert') || 'Experto Lookatfy';
    const price = intent?.price ?? parseFloat(searchParams.get('price') || '0');
    const date = (intent?.date ?? searchParams.get('date')) || '';
    const time = (intent?.time ?? searchParams.get('time')) || '';
    const currency = (intent?.currency ?? searchParams.get('currency')) || 'USD';
    const image = (intent?.image ?? searchParams.get('image')) || '';
    const serviceId = intent?.serviceId ?? searchParams.get('serviceId');
    const expertId = intent?.expertId ?? searchParams.get('expertId');

    const formatAmount = (cur: string, amount: number) => {
        if (cur === 'COP') {
            return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Math.round(amount));
        }
        if (cur === 'EUR') {
            return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
    };

    // Use validated price if available, otherwise fallback to URL price
    const displayPrice = validatedPrice !== null ? validatedPrice : price;
    const displayCurrency = validatedCurrency !== null ? validatedCurrency : currency;

    // Fetch User Info on Mount
    useEffect(() => {
        const fetchUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Try to fetch profile details
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setFormData(prev => ({
                    ...prev,
                    email: user.email || '',
                    name: profile?.first_name || profile?.full_name?.split(' ')[0] || '',
                    surname: profile?.last_name || profile?.full_name?.split(' ').slice(1).join(' ') || '',
                    phone: profile?.phone || ''
                }));
                setUserTimezonePref((profile as any)?.timezone || null);
                let targetCountry = profile?.country || '';
                try {
                    if (!targetCountry && expertId) {
                        const { data: expertRow } = await supabase.from('experts').select('country').eq('id', expertId).single();
                        targetCountry = String(expertRow?.country || '');
                    }
                } catch { }
                try {
                    const { data: svc } = await supabase.from('admin_services').select('id,name,price,country_code,active');
                    const list = (svc || []).filter((s: any) => !!s.active && (!s.country_code || s.country_code === targetCountry)).map((s: any) => ({ id: String(s.id), name: String(s.name), price: Number(s.price) }));
                    setAddons(list);
                } catch { }
            }
            setLoadingUser(false);
        };
        fetchUser();
    }, []);

    // Validate service price on mount (prevent URL manipulation)
    useEffect(() => {
        const validatePrice = async () => {
            if (!serviceId) {
                setPriceValidationError('ID de servicio no válido');
                return;
            }

            try {
                const supabase = createClient();
                const { data: serviceData, error: serviceError } = await supabase
                    .from('services')
                    .select('price, currency')
                    .eq('id', serviceId)
                    .single();

                if (serviceError || !serviceData) {
                    setPriceValidationError('No se pudo validar el precio del servicio');
                    return;
                }

                const dbPrice = Number(serviceData.price);
                const dbCurrency = String(serviceData.currency);

                // Check if URL price matches database price
                if (Math.abs(dbPrice - price) > 0.01 || dbCurrency !== currency) {
                    console.warn('Price mismatch detected:', {
                        urlPrice: price,
                        dbPrice,
                        urlCurrency: currency,
                        dbCurrency
                    });
                    setPriceValidationError('El precio del servicio no coincide. Mostrando precio correcto.');
                }

                // Always use database price
                setValidatedPrice(dbPrice);
                setValidatedCurrency(dbCurrency);
            } catch (error) {
                console.error('Error validating price:', error);
                setPriceValidationError('Error al validar el precio');
            }
        };

        validatePrice();
    }, [serviceId, price, currency]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPaymentMethod(e.target.value as any);
    };

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await fetch('/api/payments/wompi/pse', { cache: 'no-store' });
                const data = await res.json();
                const list = Array.isArray(data?.data) ? data.data : [];
                setPseBanks(list);
            } catch { }
        };
        fetchBanks();
    }, []);

    useEffect(() => {
        const refetchIfNeeded = async () => {
            if (paymentMethod === 'PSE' && pseBanks.length === 0) {
                try {
                    const res = await fetch('/api/payments/wompi/pse', { cache: 'no-store' });
                    const data = await res.json();
                    const list = Array.isArray(data?.data) ? data.data : [];
                    setPseBanks(list);
                } catch { }
            }
        };
        refetchIfNeeded();
    }, [paymentMethod]);

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!serviceId || !expertId || !date || !time) {
            showToast("Faltan datos de la reserva.", 'error');
            return;
        }

        setIsProcessing(true);

        try {
            const supabase = createClient();

            // 1. Get Current User (Again for safety)
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) {
                showToast("Debes iniciar sesión para reservar.", 'warning');
                router.push('/login?next=/checkout');
                return;
            }

            // 2. SECURITY: Validate service price from database
            const { data: serviceData, error: serviceError } = await supabase
                .from('services')
                .select('price, currency')
                .eq('id', serviceId)
                .single();

            if (serviceError || !serviceData) {
                showToast("Error al validar el servicio. Por favor intenta nuevamente.", 'error');
                setIsProcessing(false);
                return;
            }

            // Verify that the price from URL matches the database price
            const dbPrice = Number(serviceData.price);
            const dbCurrency = String(serviceData.currency);

            if (Math.abs(dbPrice - price) > 0.01 || dbCurrency !== currency) {
                console.error('Price manipulation detected:', {
                    urlPrice: price,
                    dbPrice,
                    urlCurrency: currency,
                    dbCurrency
                });
                showToast("Error: El precio del servicio no es válido. Por favor recarga la página.", 'error');
                setIsProcessing(false);
                return;
            }

            // 3. Insert Booking (status pending)
            // NOTE: NO creamos sala Daily.co aquí - se creará después del pago exitoso via webhook
            // Compute start_at UTC and tz metadata
            const userTz = userTimezonePref || (() => {
                try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
            })();
            let expertTz = 'UTC';
            try {
                const { data: expertRow } = await supabase.from('experts').select('timezone').eq('id', expertId).single();
                expertTz = String(expertRow?.timezone || 'UTC');
            } catch { }
            const [y, m, d] = date.split('-').map(n => Number(n));
            const hh = Number(time.slice(0, 2));
            const mm = Number(time.slice(3, 5));
            const startAtUTC = buildLocalDate(y, m, d, hh, mm, expertTz);

            // Establecer expiración para booking pending (20 minutos desde ahora)
            const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

            const { data: bookingRow, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    user_id: user.id,
                    expert_id: expertId,
                    service_id: serviceId,
                    date: date,
                    time: time,
                    start_at: startAtUTC.toISOString(),
                    expert_timezone: expertTz,
                    user_timezone: userTz,
                    status: 'pending',
                    price: dbPrice, // Store validated price from database
                    currency: currency,
                    meeting_url: null, // Will be set after payment confirmation
                    expires_at: expiresAt // Booking expires in 1 hour if not paid
                })
                .select('id')
                .single();

            if (bookingError) throw bookingError;
            const bookingId = String(bookingRow?.id || '');
            if (bookingId && selectedAddons.length) {
                const rows = addons.filter(a => selectedAddons.includes(a.id)).map(a => ({ booking_id: bookingId, admin_service_id: a.id, price: a.price }));
                if (rows.length) {
                    await supabase.from('booking_addons').insert(rows);
                }
            }

            // NOTE: NO enviamos emails ni notificaciones aquí
            // Se enviarán automáticamente vía webhook cuando el pago sea confirmado (APPROVED)

            const serviceFee = dbCurrency === 'COP' ? 2000 : 2;
            const addonsTotal = addons.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0);
            const total = dbPrice + serviceFee + addonsTotal;

            // Wompi solo acepta COP - validar o convertir
            const wompiCurrency = 'COP';
            let totalInCOP = total;

            if (dbCurrency !== 'COP') {
                // Obtener tasa de cambio actual
                try {
                    const rateRes = await fetch(`/api/payments/exchange-rate?from=${dbCurrency}`);
                    if (!rateRes.ok) {
                        throw new Error('Error obteniendo tasa de cambio');
                    }

                    const rateData = await rateRes.json();
                    const rate = rateData.rate;

                    if (!rate || rate <= 0) {
                        throw new Error(`Tasa de cambio inválida para ${dbCurrency}`);
                    }

                    totalInCOP = Math.round(total * rate);

                    // Informar al usuario de la conversión con toast
                    const conversionMessage = rateData.source === 'live'
                        ? `Monto convertido: ${formatAmount(dbCurrency, total)} → ${formatAmount('COP', totalInCOP)}`
                        : `Monto convertido (ref.): ${formatAmount(dbCurrency, total)} → ${formatAmount('COP', totalInCOP)}`;

                    showToast(conversionMessage, 'info');
                } catch (err) {
                    showToast(`Error obteniendo tasa de cambio para ${dbCurrency}. Por favor intenta nuevamente.`, 'error');
                    setIsProcessing(false);
                    return;
                }
            }
            const onlyDigits = (s: string) => String(s || '').replace(/\D/g, '');
            const normalizePhoneCOP = (s: string) => {
                const d = onlyDigits(s);
                if (d.startsWith('57')) return d;
                if (d.length === 10) return '57' + d;
                return d;
            };
            const payment_method_payload = (() => {
                if (paymentMethod === 'NEQUI') return { type: 'NEQUI', phone_number: normalizePhoneCOP(nequiPhone || formData.phone) };
                if (paymentMethod === 'DAVIPLATA') return { type: 'DAVIPLATA', phone_number: normalizePhoneCOP(formData.phone), user_legal_id_type: daviplataDoc.type, user_legal_id: onlyDigits(daviplataDoc.number) };
                if (paymentMethod === 'PSE') return {
                    type: 'PSE',
                    user_type: Number(pseInfo.user_type) || 0,
                    financial_institution_code: pseInfo.financial_institution_code,
                    payment_description: pseInfo.payment_description || `Reserva ${serviceTitle}`
                };
                return undefined;
            })();

            const customer_data_payload = paymentMethod === 'PSE' ? {
                phone_number: normalizePhoneCOP(pseInfo.user_phone || formData.phone),
                legal_id: onlyDigits(pseInfo.user_legal_id),
                legal_id_type: pseInfo.user_legal_id_type,
                full_name: formData.name || undefined
            } : undefined;

            if (paymentMethod === 'PSE') {
                if (!pseInfo.user_legal_id || !formData.email || !pseInfo.financial_institution_code || !(pseInfo.payment_description || serviceTitle)) {
                    showToast('Para PSE debes ingresar documento, email, banco y descripción.', 'warning');
                    setIsProcessing(false);
                    return;
                }
            }
            if (paymentMethod === 'NEQUI') {
                if (!(nequiPhone || formData.phone)) {
                    showToast('Para Nequi debes ingresar un teléfono válido.', 'warning');
                    setIsProcessing(false);
                    return;
                }
            }
            if (paymentMethod === 'DAVIPLATA') {
                if (!daviplataDoc.number || !formData.phone) {
                    showToast('Para Daviplata debes ingresar documento y teléfono.', 'warning');
                    setIsProcessing(false);
                    return;
                }
            }
            // Construir URL de retorno con el ID de la transacción
            const returnUrl = `${window.location.origin}/checkout/return?id=${bookingId}`;

            const createRes = await fetch('/api/payments/wompi/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount_in_cents: Math.round(totalInCOP * 100),
                    currency: wompiCurrency,
                    reference: bookingId,
                    customer_email: formData.email,
                    payment_method_type: paymentMethod,
                    payment_method_payload,
                    customer_data: customer_data_payload,
                    original_amount: dbCurrency !== 'COP' ? total : undefined,
                    original_currency: dbCurrency !== 'COP' ? dbCurrency : undefined,
                    redirect_url: returnUrl
                })
            });
            if (!createRes.ok) {
                let msg = 'Error creando transacción Wompi'
                try {
                    const err = await createRes.json()
                    msg = err?.error || msg
                } catch { }
                throw new Error(msg);
            }
            const { transaction } = await createRes.json();
            const redirectUrl: string | undefined = transaction?.redirect_url || transaction?.payment_link;
            if (redirectUrl) {
                router.push(redirectUrl);
                return;
            }

            // 5. Redirect to Success Page (fallback)
            let expertLabel = expertName;
            try {
                const { data: expertRow } = await supabase
                    .from('experts')
                    .select('profile:profiles(full_name)')
                    .eq('id', expertId)
                    .single();
                type Prof = { full_name?: string };
                const profileVal = (expertRow as { profile?: Prof | Prof[] } | null)?.profile;
                const prof: Prof | undefined = Array.isArray(profileVal) ? profileVal[0] : profileVal;
                if (prof?.full_name) {
                    expertLabel = prof.full_name;
                }
            } catch { }

            const successParams = new URLSearchParams({
                id: 'RES-' + Date.now().toString().slice(-6),
                title: serviceTitle,
                expert: expertLabel,
                date: date,
                time: time
            });
            router.push(`/checkout/success?${successParams.toString()}`);

        } catch (error) {
            console.error(error);
            showToast('Hubo un error al procesar la reserva. Por favor intenta de nuevo.', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container" style={{ padding: '2rem 1rem', maxWidth: '1200px' }}>
            <Link href="#" onClick={() => router.back()} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'rgb(var(--text-secondary))', textDecoration: 'none' }}>
                <ChevronLeft size={18} /> Volver al detalle
            </Link>

            <h1 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Finalizar Reserva</h1>

            {/* Removed security warning banner per request; validation remains silent */}

            <div className="checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                <style>{`
                    @media (min-width: 900px) {
                        .checkout-grid {
                            grid-template-columns: 1fr 400px !important;
                            gap: 4rem !important;
                        }
                    }
                `}</style>

                {/* Left Column: Customer Information */}
                <div>
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgb(var(--primary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>1</div>
                            Información del Cliente
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nombre</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Tu nombre"
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Apellidos</label>
                                <input
                                    type="text"
                                    name="surname"
                                    value={formData.surname}
                                    onChange={handleInputChange}
                                    placeholder="Tus apellidos"
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))' }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                readOnly
                                title="No puedes cambiar el email desde aquí"
                                placeholder="ejemplo@correo.com"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', cursor: 'not-allowed', color: 'rgb(var(--text-secondary))' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Teléfono</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="+34 600 000 000"
                                className="form-input"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))' }}
                            />
                        </div>

                        <p style={{ fontSize: '0.8rem', color: 'rgb(var(--text-muted))' }}>
                            * Confirmaremos tu reserva a tu correo electrónico.
                        </p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgb(var(--text-secondary))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>2</div>
                            Notas Adicionales
                        </h2>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleInputChange}
                            placeholder="¿Tienes alguna petición especial para el experto?"
                            rows={4}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface))', resize: 'vertical' }}
                        />
                    </div>
                </div>

                {/* Right Column: Summary & Payment */}
                <div>
                    <div style={{ background: 'rgb(var(--surface))', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid rgb(var(--border))', position: 'sticky', top: '2rem' }}>

                        {/* Summary Section */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem' }}>Resumen de Reserva</h3>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            {(() => {
                                const imageSrc = (image && image.trim()) ? image : 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80';
                                return <img src={imageSrc} alt={serviceTitle} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                            })()}
                            <div>
                                <div style={{ fontWeight: 600, lineHeight: '1.3', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{serviceTitle}</div>
                                <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>con {expertName}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Calendar size={16} color="rgb(var(--primary))" />
                                <span>{date || 'Fecha no seleccionada'}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Clock size={16} color="rgb(var(--primary))" />
                                <span>{time || 'Hora no seleccionada'}</span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid rgb(var(--border))', margin: '1rem 0' }} />

                        {/* Payment Section - Moved Here */}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CreditCard size={18} /> Método de Pago
                        </h3>

                        <form onSubmit={handlePayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Selecciona método</label>
                                <select
                                    value={paymentMethod}
                                    onChange={handlePaymentMethodChange}
                                    className="form-input"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', fontSize: '0.9rem' }}
                                >
                                    <option value="PSE">PSE</option>
                                    <option value="NEQUI">Nequi</option>
                                    <option value="DAVIPLATA">Daviplata</option>
                                    <option value="CARD" disabled>Tarjeta (próximamente)</option>
                                </select>
                            </div>
                            {paymentMethod === 'DAVIPLATA' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Tipo documento (CC, CE)"
                                        value={daviplataDoc.type}
                                        onChange={(e) => setDaviplataDoc(prev => ({ ...prev, type: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Número documento"
                                        value={daviplataDoc.number}
                                        onChange={(e) => setDaviplataDoc(prev => ({ ...prev, number: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', fontSize: '0.9rem' }}
                                    />
                                </div>
                            )}
                            {paymentMethod === 'NEQUI' && (
                                <div>
                                    <input
                                        type="tel"
                                        placeholder="Teléfono Nequi"
                                        value={nequiPhone}
                                        onChange={(e) => setNequiPhone(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', fontSize: '0.9rem' }}
                                    />
                                </div>
                            )}
                            {paymentMethod === 'PSE' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <input
                                        type="tel"
                                        placeholder="Teléfono"
                                        value={pseInfo.user_phone}
                                        onChange={(e) => setPseInfo(prev => ({ ...prev, user_phone: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', fontSize: '0.9rem' }}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Documento"
                                        value={pseInfo.user_legal_id}
                                        onChange={(e) => setPseInfo(prev => ({ ...prev, user_legal_id: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', fontSize: '0.9rem' }}
                                    />
                                    <select
                                        value={pseInfo.financial_institution_code}
                                        onChange={(e) => setPseInfo(prev => ({ ...prev, financial_institution_code: e.target.value }))}
                                        className="form-input"
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', fontSize: '0.9rem' }}
                                    >
                                        <option value="">{pseBanks.length ? 'Selecciona banco' : 'Cargando bancos...'}</option>
                                        {pseBanks.map(b => (
                                            <option key={b.code} value={b.code}>{b.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Descripción del pago"
                                        value={pseInfo.payment_description}
                                        onChange={(e) => setPseInfo(prev => ({ ...prev, payment_description: e.target.value }))}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))', fontSize: '0.9rem' }}
                                    />
                                </div>
                            )}

                            {addons.length > 0 && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Servicios opcionales</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {addons.map(a => (
                                            <label key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', border: '1px solid rgb(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.5rem 0.75rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input type="checkbox" checked={selectedAddons.includes(a.id)} onChange={(e) => {
                                                        setSelectedAddons(prev => e.target.checked ? [...prev, a.id] : prev.filter(id => id !== a.id));
                                                    }} />
                                                    <span>{a.name}</span>
                                                </div>
                                                <span>{formatAmount(currency, a.price)}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgb(var(--border))' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'rgb(var(--text-secondary))' }}>Subtotal</span>
                                    <span>{formatAmount(displayCurrency, displayPrice)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                    <span style={{ color: 'rgb(var(--text-secondary))' }}>Tarifa de Servicio</span>
                                    <span>{formatAmount(displayCurrency, displayCurrency === 'COP' ? 2000 : 2)}</span>
                                </div>
                                {selectedAddons.length > 0 && addons.filter(a => selectedAddons.includes(a.id)).map(a => (
                                    <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                        <span style={{ color: 'rgb(var(--text-secondary))' }}>{a.name}</span>
                                        <span>{formatAmount(displayCurrency, a.price)}</span>
                                    </div>
                                ))}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 700, fontSize: '1.1rem' }}>
                                    <span>Total</span>
                                    <span>{formatAmount(displayCurrency, displayPrice + (displayCurrency === 'COP' ? 2000 : 2) + addons.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0))}</span>
                                </div>
                            </div>

                            <Button fullWidth size="lg" disabled={isProcessing} type="submit" style={{ marginTop: '0.5rem' }}>
                                {isProcessing ? 'Procesando...' : `Pagar ${formatAmount(displayCurrency, displayPrice + (displayCurrency === 'COP' ? 2000 : 2) + addons.filter(a => selectedAddons.includes(a.id)).reduce((sum, a) => sum + a.price, 0))}`}
                            </Button>

                            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'rgb(var(--text-muted))', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                <ShieldCheck size={12} /> Pagos seguros con Wompi
                            </div>
                        </form>
                    </div>
                </div>

            </div>

            {/* Toast Notifications */}
            {toasts.length > 0 && (
                <div style={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxWidth: '400px'
                }}>
                    {toasts.map(toast => (
                        <div
                            key={toast.id}
                            style={{
                                background: 'rgb(var(--surface))',
                                border: '1px solid rgb(var(--border))',
                                borderLeft: `4px solid ${toast.type === 'success' ? 'rgb(var(--success))' :
                                    toast.type === 'error' ? 'rgb(var(--error))' :
                                        toast.type === 'warning' ? 'rgb(var(--warning))' :
                                            'rgb(var(--primary))'
                                    }`,
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                borderRadius: '8px',
                                padding: '0.875rem 1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                animation: 'toastSlideIn 0.3s ease-out'
                            }}
                        >
                            {toast.type === 'success' ? (
                                <CheckCircle size={20} style={{ color: 'rgb(var(--success))', flexShrink: 0 }} />
                            ) : toast.type === 'error' ? (
                                <XCircle size={20} style={{ color: 'rgb(var(--error))', flexShrink: 0 }} />
                            ) : (
                                <AlertCircle size={20} style={{ color: toast.type === 'warning' ? 'rgb(var(--warning))' : 'rgb(var(--primary))', flexShrink: 0 }} />
                            )}
                            <span style={{ flex: 1, fontSize: '0.9rem', color: 'rgb(var(--text-main))' }}>
                                {toast.message}
                            </span>
                            <button
                                onClick={() => removeToast(toast.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    color: 'rgb(var(--text-secondary))',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                @keyframes toastSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
export default function CheckoutPage() {
    return (
        <Suspense fallback={<div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Cargando checkout...</div>}>
            <CheckoutContent />
        </Suspense>
    );
}

