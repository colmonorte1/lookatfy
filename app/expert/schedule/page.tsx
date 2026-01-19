"use client";

import { Button } from '@/components/ui/Button/Button';
import { Plus, Trash2, CalendarOff, Save, Loader2 } from 'lucide-react';
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

    // State
    const [days, setDays] = useState<DaySchedule[]>(DAYS_MAP.map(d => ({
        id: d.id,
        label: d.label,
        active: false,
        slots: [{ start: '09:00', end: '17:00' }] // Default slot if enabled
    })));

    const [exceptions, setExceptions] = useState<{ id?: string, date: string }[]>([]);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

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
                    const daySlots = availability.filter((a: any) => a.day_of_week === dayMap.index);

                    if (daySlots.length > 0) {
                        // Currently simplified to support multiple slots visually, but DB schema I designed 
                        // allows multiple rows per day. My implementation plan said "one block per day initially" 
                        // but schema allows multiple. Let's map all rows as slots.
                        // However, 'is_active' is per row. Providing any row exists and is_active=true means day is active.

                        const activeSlots = daySlots.filter((s: any) => s.is_active);
                        const isDayActive = activeSlots.length > 0;

                        return {
                            id: dayMap.id,
                            label: dayMap.label,
                            active: isDayActive, // If any slot is active, day is active
                            // Map slots. If no active slots but records exist (all inactive?), show default.
                            // Actually, let's just show active slots.
                            slots: isDayActive
                                ? activeSlots.map((s: any) => ({
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
                setExceptions(excepts.map((e: any) => ({ id: e.id, date: e.date })));
            }

        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            // 1. Delete existing availability (Simplest strategy for MVP update: wipe & replace for this user)
            // Or better: Upsert based on day_of_week? 
            // Issue: If removing a slot, upsert won't delete. 
            // Strategy: Delete all for this user, then insert all active.

            const { error: deleteError } = await supabase
                .from('expert_availability')
                .delete()
                .eq('expert_id', user.id);

            if (deleteError) throw deleteError;

            // 2. Insert new availability
            const rowsToInsert: any[] = [];

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

            if (rowsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('expert_availability')
                    .insert(rowsToInsert);
                if (insertError) throw insertError;
            }

            // 3. Handle Exceptions
            // We just fetch current exceptions from state.
            // For simplicity, we could also wipe and replace or handle diffs.
            // Let's wipe and replace for robustness in this MVP.
            const { error: deleteExceptError } = await supabase
                .from('expert_exceptions')
                .delete()
                .eq('expert_id', user.id);

            if (deleteExceptError) throw deleteExceptError;

            if (exceptions.length > 0) {
                const exceptRows = exceptions.map(e => ({
                    expert_id: user.id,
                    date: e.date,
                    reason: 'Time Off'
                }));
                const { error: insertExcept } = await supabase
                    .from('expert_exceptions')
                    .insert(exceptRows);
                if (insertExcept) throw insertExcept;
            }

            alert("Horarios guardados correctamente");
            router.refresh();

        } catch (error: any) {
            console.error("Error saving schedule:", error);
            alert("Error al guardar: " + error.message);
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


    if (isLoading) return <div style={{ padding: '2rem' }}>Cargando horarios...</div>;

    return (
        <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Mis Horarios</h1>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>Configura tus franjas horarias y días libres (Excepciones).</p>
                </div>
                <Button onClick={handleSave} disabled={isSaving} style={{ gap: '0.5rem' }}>
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

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
                            <Plus size={16} /> Agregar fecha libre
                        </button>
                    </div>
                </section>

            </div>
        </div>
    );
}
