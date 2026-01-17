"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Clock } from 'lucide-react';
import { Button } from '../Button/Button';
import styles from './BookingCalendar.module.css';

interface BookingCalendarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDate: (date: string, time: string) => void;
}

type DayStatus = 'available' | 'full' | 'unavailable';

export const BookingCalendar = ({ isOpen, onClose, onSelectDate }: BookingCalendarProps) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    if (!isOpen) return null;

    // Helper to get days in month
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday

        // Adjust for Monday start (classic specialized formatting) or Keep Sunday. 
        // Let's assume standard Sunday start for simplicity or adjust grid.
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    // Mock Status Logic (Deterministic for demo)
    const getStatus = (day: number): DayStatus => {
        if (day % 7 === 0) return 'unavailable'; // Sundays closed
        if (day % 5 === 0) return 'full'; // Some days full
        return 'available';
    };

    const handleDayClick = (day: number) => {
        const status = getStatus(day);
        if (status !== 'available') return;
        setSelectedDate(day);
        setSelectedTime(null); // Reset time when date changes
    };

    const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

    const handleConfirm = () => {
        if (selectedDate && selectedTime) {
            const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), selectedDate).toISOString();
            onSelectDate(dateStr, selectedTime);
            onClose();
        }
    };

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, textTransform: 'capitalize' }}>{monthName}</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}>
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
                    {Array.from({ length: days }).map((_, i) => {
                        const day = i + 1;
                        const status = getStatus(day);
                        return (
                            <div
                                key={day}
                                className={`${styles.dayCell} ${styles[status]} ${selectedDate === day ? styles.selected : ''}`}
                                onClick={() => handleDayClick(day)}
                            >
                                {day}
                            </div>
                        );
                    })}
                </div>

                <div className={styles.legend}>
                    <div style={{ display: 'flex', alignItems: 'center' }}><span className={styles.dot} style={{ background: 'rgb(var(--success))' }} /> Disponible</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}><span className={styles.dot} style={{ background: 'rgb(var(--text-muted))' }} /> Lleno</div>
                    <div style={{ display: 'flex', alignItems: 'center' }}><span className={styles.dot} style={{ background: 'rgb(var(--error))' }} /> No disponible</div>
                </div>

                {selectedDate && (
                    <div style={{ padding: '0 1.5rem 1.5rem', borderTop: '1px solid rgb(var(--border))', background: 'rgb(var(--surface-hover))' }}>
                        <h4 style={{ margin: '1rem 0 0.5rem', fontSize: '0.9rem', color: 'rgb(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Clock size={16} /> Horarios para el día {selectedDate}
                        </h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            {timeSlots.map(time => (
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
                        <Button fullWidth onClick={handleConfirm} disabled={!selectedTime}>
                            Confirmar Horario
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
