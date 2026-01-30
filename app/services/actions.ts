'use server';

import { createClient } from '@/utils/supabase/server';
import { fromUTC, toISODateInTZ } from '@/utils/timezone';
import { setCachedAvailability } from './availabilityCache';

export type DayAvailability = {
    date: string; // ISO date YYYY-MM-DD
    status: 'available' | 'full' | 'unavailable';
    slots: string[]; // HH:MM
};

export async function getExpertAvailability(expertId: string, year: number, month: number, serviceDuration: number): Promise<DayAvailability[]> {
    const supabase = await createClient();

    // No cache early return: always compute fresh availability to reflect recent blocks

    // 1. Get Weekly Schedule
    const { data: schedule } = await supabase
        .from('expert_availability')
        .select('*')
        .eq('expert_id', expertId)
        .eq('is_active', true);

    // Expert timezone
    const { data: expertRow } = await supabase
        .from('experts')
        .select('timezone')
        .eq('id', expertId)
        .single();
    const expertTz: string = expertRow?.timezone || 'UTC';

    // 2. Get Exceptions for the month (DATE naive, compare contra fecha en tz experto)
    // Construct date range using month boundaries
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

    const { data: exceptions } = await supabase
        .from('expert_exceptions')
        .select('date')
        .eq('expert_id', expertId)
        .gte('date', startDate)
        .lte('date', endDate);

    // 3. Get Existing Bookings for the month
    const { data: bookings } = await supabase
        .from('bookings')
        .select('date, time')
        .eq('expert_id', expertId)
        .in('status', ['confirmed', 'pending'])
        .gte('date', startDate)
        .lte('date', endDate);

    // Process days in month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const results: DayAvailability[] = [];

    const exceptionDates = new Set(exceptions?.map(e => e.date) || []);

    // Helper to generate slots
    const generateSlots = (start: string, end: string, duration: number) => {
        const slots = [];
        let current = new Date(`2000-01-01T${start}`);
        const endTime = new Date(`2000-01-01T${end}`);

        while (current < endTime) {
            const timeString = current.toTimeString().slice(0, 5);
            // Check if slot + duration <= endTime
            const nextSlot = new Date(current.getTime() + duration * 60000);
            if (nextSlot <= endTime) {
                slots.push(timeString);
            }
            current = nextSlot;
        }
        return slots;
    };

    for (let d = 1; d <= daysInMonth; d++) {
        // Usar mediodía UTC para evitar transiciones DST a medianoche
        const utcMidday = new Date(Date.UTC(year, month, d, 12, 0, 0));
        const zoned = fromUTC(utcMidday, expertTz);
        const dayOfWeek = zoned.getDay(); // 0 = Sun en tz experto
        const dateStr = toISODateInTZ(utcMidday, expertTz);

        // Check availability rule for this day of week
        const rule = schedule?.find(s => s.day_of_week === dayOfWeek);

        // Basic Status Check
        if (!rule || exceptionDates.has(dateStr)) {
            results.push({ date: dateStr, status: 'unavailable', slots: [] });
            continue;
        }

        // Generate Slots from Rule
        const possibleSlots = generateSlots(rule.start_time, rule.end_time, serviceDuration);

        // Filter out booked slots
        // booked time matches exactly for now. In real world overlap check needed.
        // Assuming fixed slots aligned with start time.
        const bookedTimes = new Set(bookings?.filter(b => b.date === dateStr).map(b => b.time.slice(0, 5)) || []);

        const availableSlots = possibleSlots.filter(s => !bookedTimes.has(s));

        let status: 'available' | 'full' | 'unavailable' = 'available';
        if (availableSlots.length === 0) status = 'full';

        results.push({ date: dateStr, status, slots: availableSlots });
    }

    setCachedAvailability(expertId, year, month, serviceDuration, results);
    return results;
}
