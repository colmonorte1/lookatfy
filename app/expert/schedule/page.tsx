"use client";

import { Button } from '@/components/ui/Button/Button';
import { Plus, Trash2, CalendarOff, Save, Loader2, AlertCircle, Copy, Zap, Clock, Calendar, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type TimeSlot = { start: string; end: string };
type DaySchedule = { id: string; label: string; active: boolean; slots: TimeSlot[]; dbId?: string };

// Initial skeleton
const DAYS_MAP = [
    { id: 'mon', label: 'Lunes', index: 1 },
    { id: 'tue', label: 'Martes', index: 2 },
    { id: 'wed', label: 'Miércoles', index: 3 },
    { id: 'thu', label: 'Jueves', index: 4 },
    { id: 'fri', label: 'Viernes', index: 5 },
    { id: 'sat', label: 'Sábado', index: 6 },
    { id: 'sun', label: 'Domingo', index: 0 },
];

export default function ExpertSchedulePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [expertTimezone, setExpertTimezone] = useState<string | null>(null);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    // State
    const [days, setDays] = useState<DaySchedule[]>(DAYS_MAP.map(d => ({
        id: d.id,
        label: d.label,
        active: false,
        slots: [{ start: '09:00', end: '17:00' }] // Default slot if enabled
    })));

    const [exceptions, setExceptions] = useState<{ id?: string, date: string }[]>([]);
    const [showCopyDialog, setShowCopyDialog] = useState<string | null>(null); // dayId being copied
    const [copyToDays, setCopyToDays] = useState<string[]>([]);
    const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
    const [showDateRangeDialog, setShowDateRangeDialog] = useState(false);
    const [dateRangeStart, setDateRangeStart] = useState('');
    const [dateRangeEnd, setDateRangeEnd] = useState('');

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch expert timezone
            const { data: expertRow, error: expertErr } = await supabase
                .from('experts')
                .select('timezone')
                .eq('id', user.id)
                .single();
            if (!expertErr && expertRow) {
                setExpertTimezone(expertRow.timezone ?? null);
            }

            // 1. Fetch Weekly Availability
            const { data: availability, error: availError } = await supabase
                .from('expert_availability')
                .select('*')
                .eq('expert_id', user.id);

            if (availError) throw availError;

            // Map DB data to UI state
            if (availability && availability.length > 0) {
                const newDays = DAYS_MAP.map(dayMap => {
                    // Find all slots for this day index
                    const daySlots = availability.filter((a: { day_of_week: number }) => a.day_of_week === dayMap.index);

                    if (daySlots.length > 0) {
                        // Currently simplified to support multiple slots visually, but DB schema I designed 
                        // allows multiple rows per day. My implementation plan said "one block per day initially" 
                        // but schema allows multiple. Let's map all rows as slots.
                        // However, 'is_active' is per row. Providing any row exists and is_active=true means day is active.

                        const activeSlots = daySlots.filter((s: { is_active: boolean }) => s.is_active);
                        const isDayActive = activeSlots.length > 0;

                        return {
                            id: dayMap.id,
                            label: dayMap.label,
                            active: isDayActive, // If any slot is active, day is active
                            // Map slots. If no active slots but records exist (all inactive?), show default.
                            // Actually, let's just show active slots.
                            slots: isDayActive
                                ? activeSlots.map((s: { start_time: string; end_time: string }) => ({
                                    start: s.start_time.slice(0, 5),
                                    end: s.end_time.slice(0, 5)
                                }))
                                : [{ start: '09:00', end: '17:00' }] // Default if re-enabled
                        };
                    } else {
                        return { id: dayMap.id, label: dayMap.label, active: false, slots: [{ start: '09:00', end: '17:00' }] };
                    }
                });
                setDays(newDays);
            }

            // 2. Fetch Exceptions
            const { data: excepts, error: exceptError } = await supabase
                .from('expert_exceptions')
                .select('*')
                .eq('expert_id', user.id);

            if (exceptError) throw exceptError;

            if (excepts) {
                setExceptions(excepts.map((e: { id?: string; date: string }) => ({ id: e.id, date: e.date })));
            }

        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Validation functions
    const validateSchedule = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        // 1. Validate time slots
        days.forEach(day => {
            if (!day.active) return;

            day.slots.forEach((slot, idx) => {
                // Validate start < end
                if (slot.start >= slot.end) {
                    errors.push(`${day.label}: La hora de inicio (${slot.start}) debe ser anterior a la hora de fin (${slot.end})`);
                }

                // Validate slot duration (at least 15 minutes)
                const startMinutes = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
                const endMinutes = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
                if (endMinutes - startMinutes < 15) {
                    errors.push(`${day.label}: Las franjas horarias deben tener al menos 15 minutos de duración`);
                }

                // Check overlaps with other slots on same day
                day.slots.forEach((otherSlot, otherIdx) => {
                    if (idx >= otherIdx) return; // Only check once per pair

                    const slot1Start = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
                    const slot1End = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
                    const slot2Start = parseInt(otherSlot.start.split(':')[0]) * 60 + parseInt(otherSlot.start.split(':')[1]);
                    const slot2End = parseInt(otherSlot.end.split(':')[0]) * 60 + parseInt(otherSlot.end.split(':')[1]);

                    // Check if slots overlap
                    if ((slot1Start < slot2End && slot1End > slot2Start)) {
                        errors.push(`${day.label}: Las franjas ${slot.start}-${slot.end} y ${otherSlot.start}-${otherSlot.end} se solapan`);
                    }
                });
            });
        });

        // 2. Validate exceptions are valid dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        exceptions.forEach((ex, idx) => {
            const exDate = new Date(ex.date);
            if (isNaN(exDate.getTime())) {
                errors.push(`Excepción ${idx + 1}: Fecha inválida`);
            }
            // Optional: warn if exception is in the past
            if (exDate < today) {
                errors.push(`Excepción ${idx + 1}: La fecha ${ex.date} ya pasó. Las excepciones deben ser fechas futuras.`);
            }
        });

        // 3. Check if at least one day is active
        const hasActiveDay = days.some(d => d.active);
        if (!hasActiveDay && exceptions.length === 0) {
            errors.push('Debes activar al menos un día de la semana para estar disponible');
        }

        return { isValid: errors.length === 0, errors };
    };

    const checkBookingConflicts = async (): Promise<{ hasConflicts: boolean; affectedBookings: number; message: string }> => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return { hasConflicts: false, affectedBookings: 0, message: '' };

            // Get all confirmed bookings in the future
            const today = new Date().toISOString().split('T')[0];
            const { data: bookings } = await supabase
                .from('bookings')
                .select('id, date, time')
                .eq('expert_id', user.id)
                .eq('status', 'confirmed')
                .gte('date', today);

            if (!bookings || bookings.length === 0) {
                return { hasConflicts: false, affectedBookings: 0, message: '' };
            }

            // Check which bookings would be affected by new schedule
            const affectedBookingIds = new Set<string>();

            bookings.forEach(booking => {
                const bookingDate = new Date(booking.date);
                const dayOfWeek = bookingDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

                // Find the corresponding day in our schedule
                const dayConfig = DAYS_MAP.find(d => d.index === dayOfWeek);
                if (!dayConfig) return;

                const daySchedule = days.find(d => d.id === dayConfig.id);

                // Check if this booking is on an exception date
                const isException = exceptions.some(ex => ex.date === booking.date);

                // If day is not active OR it's an exception date, booking is affected
                if (isException || !daySchedule?.active) {
                    affectedBookingIds.add(booking.id);
                    return;
                }

                // If day is active, check if booking time falls within any slot
                const bookingTime = booking.time.slice(0, 5);
                const bookingMinutes = parseInt(bookingTime.split(':')[0]) * 60 + parseInt(bookingTime.split(':')[1]);

                const isInAnySlot = daySchedule.slots.some(slot => {
                    const slotStart = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
                    const slotEnd = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
                    return bookingMinutes >= slotStart && bookingMinutes < slotEnd;
                });

                if (!isInAnySlot) {
                    affectedBookingIds.add(booking.id);
                }
            });

            if (affectedBookingIds.size > 0) {
                return {
                    hasConflicts: true,
                    affectedBookings: affectedBookingIds.size,
                    message: `⚠️ ADVERTENCIA: Tienes ${affectedBookingIds.size} reserva(s) confirmada(s) que quedarían fuera de tu nuevo horario. Esto puede causar problemas con tus clientes.`
                };
            }

            return { hasConflicts: false, affectedBookings: 0, message: '' };
        } catch (error) {
            console.error('Error checking conflicts:', error);
            return { hasConflicts: false, affectedBookings: 0, message: '' };
        }
    };

    const handleSave = async () => {
        // Clear previous errors
        setValidationErrors([]);

        // 1. Validate schedule
        const validation = validateSchedule();
        if (!validation.isValid) {
            setValidationErrors(validation.errors);
            alert('Por favor corrige los errores de validación antes de guardar:\n\n' + validation.errors.join('\n'));
            return;
        }

        // 2. Check for booking conflicts
        const conflicts = await checkBookingConflicts();
        if (conflicts.hasConflicts) {
            const confirmed = window.confirm(
                `${conflicts.message}\n\n¿Estás seguro de que quieres guardar estos cambios?`
            );
            if (!confirmed) {
                return;
            }
        }

        setIsSaving(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // IMPROVED STRATEGY: Insert first, then delete old records only if insert succeeds
            // This prevents data loss if insert fails

            // 1. Prepare new availability rows
            const rowsToInsert: { expert_id: string; day_of_week: number | undefined; start_time: string; end_time: string; is_active: boolean }[] = [];

            days.forEach(day => {
                if (day.active) {
                    const dayIndex = DAYS_MAP.find(d => d.id === day.id)?.index;
                    day.slots.forEach(slot => {
                        rowsToInsert.push({
                            expert_id: user.id,
                            day_of_week: dayIndex,
                            start_time: slot.start,
                            end_time: slot.end,
                            is_active: true
                        });
                    });
                }
            });

            // 2. Insert new availability FIRST
            if (rowsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('expert_availability')
                    .insert(rowsToInsert);
                if (insertError) throw new Error(`Error al guardar horarios: ${insertError.message}`);
            }

            // 3. Only if insert succeeded, delete old records
            // Find IDs to keep (the ones we just inserted)
            const { data: newRecords } = await supabase
                .from('expert_availability')
                .select('id, created_at')
                .eq('expert_id', user.id)
                .order('created_at', { ascending: false })
                .limit(rowsToInsert.length);

            if (newRecords && newRecords.length > 0) {
                const newIds = newRecords.map(r => r.id);
                // Delete all records EXCEPT the new ones
                const { error: deleteError } = await supabase
                    .from('expert_availability')
                    .delete()
                    .eq('expert_id', user.id)
                    .not('id', 'in', `(${newIds.join(',')})`);

                if (deleteError) {
                    console.warn('Warning: Could not delete old availability records:', deleteError);
                    // Don't throw - new records are saved, old ones just remain (non-critical)
                }
            }

            // 4. Handle Exceptions (same strategy: insert first, then cleanup)
            const exceptRows = exceptions.map(e => ({
                expert_id: user.id,
                date: e.date,
                reason: 'Time Off'
            }));

            if (exceptRows.length > 0) {
                const { error: insertExcept } = await supabase
                    .from('expert_exceptions')
                    .insert(exceptRows);
                if (insertExcept) throw new Error(`Error al guardar excepciones: ${insertExcept.message}`);
            }

            // 5. Cleanup old exceptions (only if insert succeeded)
            const { data: newExceptions } = await supabase
                .from('expert_exceptions')
                .select('id, created_at')
                .eq('expert_id', user.id)
                .order('created_at', { ascending: false })
                .limit(exceptRows.length);

            if (newExceptions && newExceptions.length > 0) {
                const newExceptIds = newExceptions.map(r => r.id);
                const { error: deleteExceptError } = await supabase
                    .from('expert_exceptions')
                    .delete()
                    .eq('expert_id', user.id)
                    .not('id', 'in', `(${newExceptIds.join(',')})`);

                if (deleteExceptError) {
                    console.warn('Warning: Could not delete old exception records:', deleteExceptError);
                }
            } else if (exceptRows.length === 0) {
                // If no exceptions, delete all
                await supabase
                    .from('expert_exceptions')
                    .delete()
                    .eq('expert_id', user.id);
            }

            alert("✅ Horarios guardados correctamente");
            router.refresh();

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Error saving schedule:", message);
            alert("Error al guardar: " + message);
        } finally {
            setIsSaving(false);
        }
    };

    // --- Handlers ---
    const toggleDay = (id: string) => {
        setDays(days.map(d => d.id === id ? { ...d, active: !d.active } : d));
    };

    const addSlot = (dayId: string) => {
        setDays(days.map(d => d.id === dayId ? { ...d, slots: [...d.slots, { start: '09:00', end: '13:00' }] } : d));
    };

    const removeSlot = (dayId: string, index: number) => {
        setDays(days.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...d.slots];
            newSlots.splice(index, 1);
            // If deleting last slot, disabling day? No, keep it active but empty (or auto-add default? better allow empty and user unchecks day).
            // Actually UX wise: if 0 slots and active, technically "available all day"? No, usually means "Not configured".
            // Let's allow 0 slots = error or auto-uncheck? 
            // Better: Don't allow removing the last slot, force uncheck day.
            if (newSlots.length === 0) return { ...d, active: false, slots: [{ start: '09:00', end: '17:00' }] };
            return { ...d, slots: newSlots };
        }));
    };

    const updateSlot = (dayId: string, index: number, field: 'start' | 'end', value: string) => {
        setDays(days.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...d.slots];
            newSlots[index] = { ...newSlots[index], [field]: value };
            return { ...d, slots: newSlots };
        }));
    };

    const addException = () => {
        // Default to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];
        setExceptions([...exceptions, { date: dateStr }]);
    };

    const removeException = (idx: number) => {
        setExceptions(exceptions.filter((_, i) => i !== idx));
    };

    const updateExceptionDate = (idx: number, date: string) => {
        const newEx = [...exceptions];
        newEx[idx].date = date;
        setExceptions(newEx);
    }

    const addDateRange = () => {
        if (!dateRangeStart || !dateRangeEnd) {
            alert('Por favor selecciona ambas fechas (inicio y fin)');
            return;
        }

        const start = new Date(dateRangeStart);
        const end = new Date(dateRangeEnd);

        if (start > end) {
            alert('La fecha de inicio debe ser anterior a la fecha de fin');
            return;
        }

        // Generate all dates in range
        const datesInRange: { date: string }[] = [];
        const currentDate = new Date(start);

        while (currentDate <= end) {
            datesInRange.push({ date: currentDate.toISOString().split('T')[0] });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Add to exceptions, removing duplicates
        const existingDates = new Set(exceptions.map(e => e.date));
        const newExceptions = datesInRange.filter(d => !existingDates.has(d.date));

        setExceptions([...exceptions, ...newExceptions]);
        setShowDateRangeDialog(false);
        setDateRangeStart('');
        setDateRangeEnd('');
    };

    // Copy schedule from one day to others
    const handleCopySchedule = () => {
        if (!showCopyDialog || copyToDays.length === 0) return;

        const sourceDay = days.find(d => d.id === showCopyDialog);
        if (!sourceDay) return;

        setDays(days.map(d => {
            if (copyToDays.includes(d.id)) {
                // Copy slots and active state from source day
                return {
                    ...d,
                    active: sourceDay.active,
                    slots: sourceDay.slots.map(slot => ({ ...slot })) // Deep copy slots
                };
            }
            return d;
        }));

        // Reset dialog state
        setShowCopyDialog(null);
        setCopyToDays([]);
    };

    const toggleCopyDay = (dayId: string) => {
        if (copyToDays.includes(dayId)) {
            setCopyToDays(copyToDays.filter(id => id !== dayId));
        } else {
            setCopyToDays([...copyToDays, dayId]);
        }
    };

    // Template presets
    const templates = [
        {
            id: 'full-time',
            name: 'Tiempo Completo',
            description: 'Lunes a Viernes, 9:00 - 17:00',
            icon: '💼',
            schedule: {
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                slots: [{ start: '09:00', end: '17:00' }]
            }
        },
        {
            id: 'part-time-morning',
            name: 'Medio Tiempo (Mañanas)',
            description: 'Lunes a Viernes, 9:00 - 13:00',
            icon: '🌅',
            schedule: {
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                slots: [{ start: '09:00', end: '13:00' }]
            }
        },
        {
            id: 'part-time-afternoon',
            name: 'Medio Tiempo (Tardes)',
            description: 'Lunes a Viernes, 14:00 - 18:00',
            icon: '🌆',
            schedule: {
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                slots: [{ start: '14:00', end: '18:00' }]
            }
        },
        {
            id: 'weekends',
            name: 'Solo Fines de Semana',
            description: 'Sábado y Domingo, 10:00 - 18:00',
            icon: '🎉',
            schedule: {
                days: ['sat', 'sun'],
                slots: [{ start: '10:00', end: '18:00' }]
            }
        },
        {
            id: 'flexible',
            name: 'Horario Flexible',
            description: 'Lunes a Viernes, 9:00 - 13:00 y 15:00 - 19:00',
            icon: '⚡',
            schedule: {
                days: ['mon', 'tue', 'wed', 'thu', 'fri'],
                slots: [
                    { start: '09:00', end: '13:00' },
                    { start: '15:00', end: '19:00' }
                ]
            }
        },
        {
            id: 'all-week',
            name: 'Toda la Semana',
            description: 'Lunes a Domingo, 9:00 - 17:00',
            icon: '🔥',
            schedule: {
                days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
                slots: [{ start: '09:00', end: '17:00' }]
            }
        }
    ];

    const applyTemplate = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        const newDays = days.map(day => {
            if (template.schedule.days.includes(day.id)) {
                return {
                    ...day,
                    active: true,
                    slots: template.schedule.slots.map(slot => ({ ...slot }))
                };
            } else {
                return {
                    ...day,
                    active: false,
                    slots: [{ start: '09:00', end: '17:00' }] // Default inactive slots
                };
            }
        });

        setDays(newDays);
        setShowTemplatesDialog(false);
    };


    // Calculate schedule KPIs
    const calculateKPIs = () => {
        // 1. Total hours per week
        let totalMinutesPerWeek = 0;
        days.forEach(day => {
            if (day.active) {
                day.slots.forEach(slot => {
                    const startMinutes = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
                    const endMinutes = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
                    totalMinutesPerWeek += (endMinutes - startMinutes);
                });
            }
        });
        const hoursPerWeek = (totalMinutesPerWeek / 60).toFixed(1);

        // 2. Active days count
        const activeDaysCount = days.filter(d => d.active).length;

        // 3. Exception dates (only future)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureExceptions = exceptions.filter(ex => {
            const exDate = new Date(ex.date);
            return exDate >= today;
        }).length;

        // 4. Peak hours (most common time slots)
        const hourCounts: Record<number, number> = {};
        days.forEach(day => {
            if (day.active) {
                day.slots.forEach(slot => {
                    const startHour = parseInt(slot.start.split(':')[0]);
                    const endHour = parseInt(slot.end.split(':')[0]);
                    for (let h = startHour; h < endHour; h++) {
                        hourCounts[h] = (hourCounts[h] || 0) + 1;
                    }
                });
            }
        });

        let peakHour = -1;
        let maxCount = 0;
        Object.entries(hourCounts).forEach(([hour, count]) => {
            if (count > maxCount) {
                maxCount = count;
                peakHour = parseInt(hour);
            }
        });

        const peakHourFormatted = peakHour >= 0 ? `${String(peakHour).padStart(2, '0')}:00 - ${String(peakHour + 1).padStart(2, '0')}:00` : 'N/A';

        return {
            hoursPerWeek,
            activeDaysCount,
            futureExceptions,
            peakHourFormatted,
            isConfigured: activeDaysCount > 0
        };
    };

    const kpis = calculateKPIs();

    if (isLoading) return <div style={{ padding: '2rem' }}>Cargando horarios...</div>;

    return (
        <div style={{ maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Mis Horarios</h1>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>Configura tus franjas horarias y días libres (Excepciones).</p>
                    {expertTimezone && (
                        <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.25rem' }}>
                            Zona horaria del experto: <strong>{expertTimezone}</strong>
                        </p>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <Button
                        variant="outline"
                        onClick={() => setShowTemplatesDialog(true)}
                        style={{ gap: '0.5rem' }}
                    >
                        <Zap size={18} />
                        Plantillas
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} style={{ gap: '0.5rem' }}>
                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
                <div style={{
                    background: 'rgba(var(--error), 0.1)',
                    border: '1px solid rgba(var(--error), 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ fontWeight: 600, color: 'rgb(var(--error))', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={20} />
                        Errores de Validación
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'rgb(var(--error))' }}>
                        {validationErrors.map((error, idx) => (
                            <li key={idx} style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Schedule Summary KPIs */}
            {kpis.isConfigured && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '2rem'
                }}>
                    {/* Card 1: Hours per week */}
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(var(--primary), 0.1)',
                            color: 'rgb(var(--primary))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', fontWeight: 500 }}>
                                Horas / Semana
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.1rem' }}>
                                {kpis.hoursPerWeek}h
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Active days */}
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(var(--success), 0.1)',
                            color: 'rgb(var(--success))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Calendar size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', fontWeight: 500 }}>
                                Días Activos
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.1rem' }}>
                                {kpis.activeDaysCount}/7
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Peak hour */}
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(var(--warning), 0.1)',
                            color: 'rgb(var(--warning))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Activity size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', fontWeight: 500 }}>
                                Hora Pico
                            </div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, marginTop: '0.1rem' }}>
                                {kpis.peakHourFormatted}
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Future exceptions */}
                    <div style={{
                        background: 'rgb(var(--surface))',
                        padding: '1.25rem',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid rgb(var(--border))',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(var(--error), 0.1)',
                            color: 'rgb(var(--error))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <CalendarOff size={20} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'rgb(var(--text-secondary))', fontWeight: 500 }}>
                                Excepciones Futuras
                            </div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.1rem' }}>
                                {kpis.futureExceptions}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* Weekly Schedule */}
                <section style={{
                    background: 'rgb(var(--surface))',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '1.5rem', borderBottom: '1px solid rgb(var(--border))', fontWeight: 600 }}>
                        Horario Semanal Estándar
                    </div>
                    {days.map((day, index) => (
                        <div key={day.id} style={{
                            padding: '1.5rem',
                            borderBottom: index < days.length - 1 ? '1px solid rgb(var(--border))' : 'none',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '2rem',
                            opacity: day.active ? 1 : 0.6,
                            transition: 'opacity 0.2s'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '150px', paddingTop: '0.5rem' }}>
                                {/* Toggle */}
                                <div
                                    onClick={() => toggleDay(day.id)}
                                    style={{
                                        width: '40px', height: '24px',
                                        background: day.active ? 'rgb(var(--success))' : 'rgb(var(--text-muted))',
                                        borderRadius: '12px', position: 'relative', cursor: 'pointer', flexShrink: 0,
                                        transition: 'background 0.2s'
                                    }}>
                                    <div style={{
                                        width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                        position: 'absolute', top: '2px', left: day.active ? '18px' : '2px',
                                        transition: 'left 0.2s'
                                    }} />
                                </div>
                                <span style={{ fontWeight: 600 }}>{day.label}</span>
                            </div>

                            {day.active ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {day.slots.map((slot, idx) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <input
                                                type="time"
                                                value={slot.start}
                                                onChange={(e) => updateSlot(day.id, idx, 'start', e.target.value)}
                                                style={{
                                                    padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                                    border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                            <span style={{ color: 'rgb(var(--text-muted))' }}>-</span>
                                            <input
                                                type="time"
                                                value={slot.end}
                                                onChange={(e) => updateSlot(day.id, idx, 'end', e.target.value)}
                                                style={{
                                                    padding: '0.5rem', borderRadius: 'var(--radius-md)',
                                                    border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                            {day.slots.length > 1 && (
                                                <button
                                                    onClick={() => removeSlot(day.id, idx)}
                                                    style={{ background: 'none', border: 'none', color: 'rgb(var(--text-muted))', cursor: 'pointer', padding: '0.25rem' }}
                                                    title="Eliminar franja"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            onClick={() => addSlot(day.id)}
                                            style={{
                                                background: 'none', border: 'none', color: 'rgb(var(--primary))',
                                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                                                display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content'
                                            }}
                                        >
                                            <Plus size={16} /> Agregar otra franja
                                        </button>
                                        <button
                                            onClick={() => setShowCopyDialog(day.id)}
                                            style={{
                                                background: 'none', border: 'none', color: 'rgb(var(--text-secondary))',
                                                cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500,
                                                display: 'flex', alignItems: 'center', gap: '0.25rem', width: 'fit-content'
                                            }}
                                            title="Copiar este horario a otros días"
                                        >
                                            <Copy size={16} /> Copiar a otros días
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ paddingTop: '0.5rem', color: 'rgb(var(--text-secondary))', fontStyle: 'italic' }}>
                                    No disponible
                                </div>
                            )}
                        </div>
                    ))}
                </section>

                {/* Date Exceptions */}
                <section style={{
                    background: 'rgb(var(--surface))',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgb(var(--border))',
                    padding: '1.5rem'
                }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CalendarOff size={20} /> Excepciones / Días Libres
                    </h3>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        Agrega fechas específicas en las que NO estarás disponible, independientemente de tu horario semanal (ej: vacaciones, festivos).
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {exceptions.map((ex, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(var(--error), 0.05)',
                                border: '1px solid rgba(var(--error), 0.2)',
                                color: 'rgb(var(--error))',
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                <input
                                    type="date"
                                    value={ex.date}
                                    onChange={(e) => updateExceptionDate(idx, e.target.value)}
                                    style={{
                                        background: 'transparent', border: 'none', color: 'currentcolor',
                                        fontWeight: 500, outline: 'none', fontFamily: 'inherit'
                                    }}
                                />
                                <button
                                    onClick={() => removeException(idx)}
                                    style={{ background: 'none', border: 'none', color: 'currentcolor', cursor: 'pointer', display: 'flex', opacity: 0.7 }}
                                    title="Eliminar excepción"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={addException}
                            style={{
                                border: '1px dashed rgb(var(--border))',
                                padding: '0.5rem 1rem', borderRadius: '2rem',
                                color: 'rgb(var(--text-secondary))',
                                background: 'transparent', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontSize: '0.9rem'
                            }}
                        >
                            <Plus size={16} /> Fecha individual
                        </button>
                        <button
                            onClick={() => setShowDateRangeDialog(true)}
                            style={{
                                border: '1px dashed rgb(var(--border))',
                                padding: '0.5rem 1rem', borderRadius: '2rem',
                                color: 'rgb(var(--primary))',
                                background: 'transparent', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: 500
                            }}
                        >
                            <CalendarOff size={16} /> Rango de fechas (Vacaciones)
                        </button>
                    </div>
                </section>

            </div>

            {/* Copy Schedule Dialog */}
            {showCopyDialog && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => {
                        setShowCopyDialog(null);
                        setCopyToDays([]);
                    }}
                >
                    <div
                        style={{
                            background: 'rgb(var(--surface))',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgb(var(--border))',
                            padding: '2rem',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Copy size={20} />
                            Copiar horario de {days.find(d => d.id === showCopyDialog)?.label}
                        </h3>
                        <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Selecciona los días a los que quieres copiar este horario. Se reemplazarán todos los horarios existentes en los días seleccionados.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            {days.filter(d => d.id !== showCopyDialog).map(day => (
                                <label
                                    key={day.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgb(var(--border))',
                                        background: copyToDays.includes(day.id) ? 'rgba(var(--primary), 0.05)' : 'rgb(var(--background))',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={copyToDays.includes(day.id)}
                                        onChange={() => toggleCopyDay(day.id)}
                                        style={{
                                            width: '18px',
                                            height: '18px',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <span style={{ fontWeight: 500 }}>{day.label}</span>
                                    {day.active && (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: 'rgb(var(--text-muted))',
                                            marginLeft: 'auto'
                                        }}>
                                            (Actualmente activo)
                                        </span>
                                    )}
                                </label>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowCopyDialog(null);
                                    setCopyToDays([]);
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleCopySchedule}
                                disabled={copyToDays.length === 0}
                                style={{ gap: '0.5rem' }}
                            >
                                <Copy size={18} />
                                Copiar a {copyToDays.length} día{copyToDays.length !== 1 ? 's' : ''}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Templates Dialog */}
            {showTemplatesDialog && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowTemplatesDialog(false)}
                >
                    <div
                        style={{
                            background: 'rgb(var(--surface))',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgb(var(--border))',
                            padding: '2rem',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflowY: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Zap size={20} />
                            Plantillas de Horarios
                        </h3>
                        <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Aplica una plantilla pre-configurada para configurar tu horario rápidamente. Esto reemplazará tu configuración actual.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {templates.map(template => (
                                <button
                                    key={template.id}
                                    onClick={() => applyTemplate(template.id)}
                                    style={{
                                        background: 'rgb(var(--background))',
                                        border: '1px solid rgb(var(--border))',
                                        borderRadius: 'var(--radius-md)',
                                        padding: '1.25rem',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.5rem'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'rgb(var(--primary))';
                                        e.currentTarget.style.background = 'rgba(var(--primary), 0.05)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'rgb(var(--border))';
                                        e.currentTarget.style.background = 'rgb(var(--background))';
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{template.icon}</div>
                                    <div style={{ fontWeight: 600, fontSize: '1rem' }}>{template.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'rgb(var(--text-secondary))' }}>
                                        {template.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <Button
                                variant="outline"
                                onClick={() => setShowTemplatesDialog(false)}
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Date Range Dialog */}
            {showDateRangeDialog && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowDateRangeDialog(false)}
                >
                    <div
                        style={{
                            background: 'rgb(var(--surface))',
                            borderRadius: 'var(--radius-lg)',
                            border: '1px solid rgb(var(--border))',
                            padding: '2rem',
                            maxWidth: '450px',
                            width: '90%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarOff size={20} />
                            Agregar Rango de Fechas
                        </h3>
                        <p style={{ color: 'rgb(var(--text-secondary))', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            Perfecto para vacaciones o períodos largos de ausencia. Todas las fechas en el rango serán marcadas como no disponibles.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                    Fecha de inicio
                                </label>
                                <input
                                    type="date"
                                    value={dateRangeStart}
                                    onChange={(e) => setDateRangeStart(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgb(var(--border))',
                                        background: 'rgb(var(--background))',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                    Fecha de fin
                                </label>
                                <input
                                    type="date"
                                    value={dateRangeEnd}
                                    onChange={(e) => setDateRangeEnd(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid rgb(var(--border))',
                                        background: 'rgb(var(--background))',
                                        fontFamily: 'inherit'
                                    }}
                                />
                            </div>
                        </div>

                        {dateRangeStart && dateRangeEnd && new Date(dateRangeStart) <= new Date(dateRangeEnd) && (
                            <div style={{
                                background: 'rgba(var(--primary), 0.1)',
                                padding: '0.75rem',
                                borderRadius: 'var(--radius-md)',
                                marginBottom: '1.5rem',
                                fontSize: '0.9rem',
                                color: 'rgb(var(--text-secondary))'
                            }}>
                                Se agregarán {Math.ceil((new Date(dateRangeEnd).getTime() - new Date(dateRangeStart).getTime()) / (1000 * 60 * 60 * 24)) + 1} días como excepciones
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDateRangeDialog(false);
                                    setDateRangeStart('');
                                    setDateRangeEnd('');
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={addDateRange}
                                disabled={!dateRangeStart || !dateRangeEnd}
                                style={{ gap: '0.5rem' }}
                            >
                                <Plus size={18} />
                                Agregar Rango
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
