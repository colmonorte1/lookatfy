"use client";

import { Button } from '@/components/ui/Button/Button';
import { Plus, Trash2, CalendarOff } from 'lucide-react';
import { useState } from 'react';

type TimeSlot = { start: string; end: string };
type DaySchedule = { id: string; label: string; active: boolean; slots: TimeSlot[] };

const INITIAL_DAYS: DaySchedule[] = [
    { id: 'mon', label: 'Lunes', active: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
    { id: 'tue', label: 'Martes', active: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
    { id: 'wed', label: 'Miércoles', active: true, slots: [{ start: '09:00', end: '17:00' }] }, // Continuous
    { id: 'thu', label: 'Jueves', active: true, slots: [{ start: '09:00', end: '12:00' }, { start: '13:00', end: '17:00' }] },
    { id: 'fri', label: 'Viernes', active: true, slots: [{ start: '09:00', end: '13:00' }] },
    { id: 'sat', label: 'Sábado', active: false, slots: [] },
    { id: 'sun', label: 'Domingo', active: false, slots: [] },
];

export default function ExpertSchedulePage() {
    const [days, setDays] = useState(INITIAL_DAYS);
    const [exceptions, setExceptions] = useState(['2024-12-25', '2024-01-01']);

    const toggleDay = (id: string) => {
        setDays(days.map(d => d.id === id ? { ...d, active: !d.active } : d));
    };

    const addSlot = (dayId: string) => {
        setDays(days.map(d => d.id === dayId ? { ...d, slots: [...d.slots, { start: '09:00', end: '10:00' }] } : d));
    };

    const removeSlot = (dayId: string, index: number) => {
        setDays(days.map(d => {
            if (d.id !== dayId) return d;
            const newSlots = [...d.slots];
            newSlots.splice(index, 1);
            return { ...d, slots: newSlots };
        }));
    };

    return (
        <div style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem' }}>Mis Horarios</h1>
                    <p style={{ color: 'rgb(var(--text-secondary))', marginTop: '0.5rem' }}>Configura tus franjas horarias y días libres.</p>
                </div>
                <Button>Guardar Cambios</Button>
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
                        Horario Semanal
                    </div>
                    {days.map((day, index) => (
                        <div key={day.id} style={{
                            padding: '1.5rem',
                            borderBottom: index < days.length - 1 ? '1px solid rgb(var(--border))' : 'none',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '2rem',
                            opacity: day.active ? 1 : 0.6
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '150px', paddingTop: '0.5rem' }}>
                                {/* Toggle */}
                                <div
                                    onClick={() => toggleDay(day.id)}
                                    style={{
                                        width: '40px', height: '24px',
                                        background: day.active ? 'rgb(var(--success))' : 'rgb(var(--text-muted))',
                                        borderRadius: '12px', position: 'relative', cursor: 'pointer', flexShrink: 0
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
                                            <select style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))' }} defaultValue={slot.start}>
                                                <option>09:00</option><option>10:00</option><option>11:00</option><option>12:00</option><option>13:00</option>
                                            </select>
                                            <span>-</span>
                                            <select style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid rgb(var(--border))', background: 'rgb(var(--background))' }} defaultValue={slot.end}>
                                                <option>12:00</option><option>13:00</option><option>14:00</option><option>17:00</option>
                                            </select>
                                            <button
                                                onClick={() => removeSlot(day.id, idx)}
                                                style={{ background: 'none', border: 'none', color: 'rgb(var(--text-muted))', cursor: 'pointer', padding: '0.25rem' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
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
                                        <Plus size={16} /> Agregar horario
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
                        <CalendarOff size={20} /> Excepciones / Días Bloqueados (No laborales)
                    </h3>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                        {exceptions.map((date, idx) => (
                            <div key={idx} style={{
                                background: 'rgba(var(--error), 0.1)',
                                color: 'rgb(var(--error))',
                                padding: '0.5rem 1rem',
                                borderRadius: '2rem',
                                fontWeight: 500,
                                display: 'flex', alignItems: 'center', gap: '0.5rem'
                            }}>
                                {date}
                                <button style={{ background: 'none', border: 'none', color: 'currentcolor', cursor: 'pointer', display: 'flex' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        <button style={{
                            border: '1px dashed rgb(var(--border))',
                            padding: '0.5rem 1rem', borderRadius: '2rem',
                            color: 'rgb(var(--text-secondary))',
                            background: 'transparent', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}>
                            <Plus size={16} /> Agregar fecha
                        </button>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'rgb(var(--text-muted))', marginTop: '1rem' }}>
                        Estas fechas anularán tu disponibilidad semanal estándar.
                    </p>
                </section>

            </div>
        </div>
    );
}
