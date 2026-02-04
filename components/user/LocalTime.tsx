'use client';

import { useEffect, useState } from 'react';
import { Clock, Globe } from 'lucide-react';

interface LocalTimeProps {
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    expertTimezone?: string | null;
}

export function LocalTime({ date, time, expertTimezone }: LocalTimeProps) {
    const [userTz, setUserTz] = useState<string>('');
    const [localTime, setLocalTime] = useState<string>(time);
    const [showTzInfo, setShowTzInfo] = useState(false);

    useEffect(() => {
        try {
            const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            setUserTz(browserTz);

            // If we have expert timezone, convert the time to user's local time
            if (expertTimezone && browserTz && expertTimezone !== browserTz) {
                // Parse the date and time in expert's timezone
                const [year, month, day] = date.split('-').map(Number);
                const [hours, minutes] = time.split(':').map(Number);

                // Create a date string that we can parse
                const dateTimeStr = `${date}T${time}:00`;

                // Create formatter for expert timezone
                const expertFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: expertTimezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                // Create formatter for user timezone
                const userFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: browserTz,
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                });

                // We need to find the UTC time that corresponds to the given time in expert's timezone
                // Create a date object and adjust
                const testDate = new Date(`${date}T${time}:00Z`);

                // Get the offset difference
                const expertOffset = getTimezoneOffset(expertTimezone, testDate);
                const userOffset = getTimezoneOffset(browserTz, testDate);

                // Adjust the time
                const adjustedDate = new Date(testDate.getTime() + (expertOffset - userOffset) * 60000);

                const userHours = adjustedDate.getUTCHours().toString().padStart(2, '0');
                const userMinutes = adjustedDate.getUTCMinutes().toString().padStart(2, '0');

                setLocalTime(`${userHours}:${userMinutes}`);
                setShowTzInfo(true);
            }
        } catch {
            // Keep original time on error
        }
    }, [date, time, expertTimezone]);

    // Helper to get timezone offset in minutes
    function getTimezoneOffset(tz: string, date: Date): number {
        const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
        return (utcDate.getTime() - tzDate.getTime()) / 60000;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} /> {localTime}
                {showTzInfo && (
                    <span style={{
                        fontSize: '0.7rem',
                        color: 'rgb(var(--text-muted))',
                        background: 'rgba(var(--primary), 0.1)',
                        padding: '0.1rem 0.4rem',
                        borderRadius: '4px'
                    }}>
                        tu hora
                    </span>
                )}
            </span>
            {showTzInfo && (
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    color: 'rgb(var(--text-muted))'
                }}>
                    <Globe size={10} /> Experto: {time} ({expertTimezone?.split('/').pop()?.replace('_', ' ')})
                </span>
            )}
        </div>
    );
}
