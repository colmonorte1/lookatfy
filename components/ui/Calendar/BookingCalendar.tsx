"use client";

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { Button } from '../Button/Button';
import styles from './BookingCalendar.module.css';
import { getExpertAvailability, DayAvailability } from '@/app/services/actions';

interface BookingCalendarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDate: (date: string, time: string) => void;
    expertId: string;
    serviceDuration: number;
}

export const BookingCalendar = ({ isOpen, onClose, onSelectDate, expertId, serviceDuration }: BookingCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // State for availability data
    const [availability, setAvailability] = useState<DayAvailability[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && expertId) {
            fetchAvailability();
        }
    }, [currentDate, isOpen, expertId]);

    const fetchAvailability = async () => {
        setLoading(true);
        try {
            const data = await getExpertAvailability(
                expertId,
                currentDate.getFullYear(),
                currentDate.getMonth(),
                serviceDuration
            );
            setAvailability(data);
        } catch (error) {
            console.error("Failed to fetch availability", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Helper to get days in month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const getDayAvailability = (day: number) => {
        if (availability.length === 0) return { status: 'loading', slots: [] };

        // Construct date string to match API response
        const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Correct for timezone offset issues with simple comparison by creating local ISO part
        // API returns YYYY-MM-DD. 
        // We can reconstruct it simply:
        const y = checkDate.getFullYear();
        const m = String(checkDate.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const dayData = availability.find(a => a.date === dateStr);
        return dayData ? dayData : { status: 'unavailable', slots: [] }; // Default unavailable if not found
    };

    const handleDayClick = (day: number) => {
        const { status } = getDayAvailability(day);
        if (status !== 'available') return;
        setSelectedDate(day);
        setSelectedTime(null);
    };

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toISOString();
            // Or better, send YYYY-MM-DD used for logic
            const y = currentDate.getFullYear();
            const m = String(currentDate.getMonth() + 1).padStart(2, '0');
            const d = String(selectedDate).padStart(2, '0');

            onSelectDate(`${y}-${m}-${d}`, selectedTime);
            onClose();
        }
    };

    // Get slots for currently selected day
    const selectedDayData = selectedDate ? getDayAvailability(selectedDate) : null;
    const timeSlots = selectedDayData?.slots || [];

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, textTransform: 'capitalize' }}>{monthName}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setCurrentDate(new Date(new Date(currentDate).setMonth(currentDate.getMonth() - 1)))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date(new Date(currentDate).setMonth(currentDate.getMonth() + 1)))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                            <ChevronRight size={20} />
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', marginLeft: '1rem', color: 'rgb(var(--text-muted))' }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className={styles.grid}>
                    {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                        <div key={d} className={styles.dayName}>{d}</div>
                    ))}

                    {/* Empty slots for start of month */}
                    {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {/* Days */}
                    {loading ? (
                        <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'rgb(var(--text-secondary))' }}>
                            Cargando disponibilidad...
                        </div>
                    ) : (
                        Array.from({ length: days }).map((_, i) => {
                            const day = i + 1;
                            const { status } = getDayAvailability(day);
                            // Avoid past dates if needed, but API should handle logic roughly

                            return (
                                <div
                                    key={day}
                                    className={`${styles.dayCell} ${styles[status as string] || styles.unavailable} ${selectedDate === day ? styles.selected : ''}`}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {day}
                                </div>
                            );
                        })
                    )}
                </div>

                <div className={styles.legend}>
                    <div style={{ display: 'flex', alignItems: 'center' }}><span className={styles.dot} style={{ background: 'rgb(var(--success))' }} /> Disponible</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}><span className={styles.dot} style={{ background: 'rgb(var(--text-muted))' }} /> Lleno/N/A</div>
                    {/* Simplified legend */}
                </div>

                {selectedDate && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))' }}>
                        <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} /> Horarios para el día {selectedDate}
                        </h4>

                        {timeSlots.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {timeSlots.map((time: string) => (
                                    <button
                                        key={time}
                                        onClick={() => setSelectedTime(time)}
                                        style={{
                                            padding: '0.4rem',
                                            borderRadius: '6px',
                                            border: selectedTime === time ? '1px solid rgb(var(--primary))' : '1px solid rgb(var(--border))',
                                            background: selectedTime === time ? 'rgb(var(--primary))' : 'rgb(var(--surface))',
                                            color: selectedTime === time ? 'white' : 'rgb(var(--text-main))',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div style={{ marginBottom: '1rem', color: 'rgb(var(--error))', fontSize: '0.9rem' }}>
                                No hay horarios disponibles para este día.
                            </div>
                        )}

                        <Button fullWidth onClick={handleConfirm} disabled={!selectedTime}>
                            Confirmar Horario
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
