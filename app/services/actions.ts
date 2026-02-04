'use server';

import { createClient } from '@/utils/supabase/server';
import { fromUTC, toISODateInTZ, buildLocalDate } from '@/utils/timezone';
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

    // 3. Get Existing Bookings for the month (including service_id to get duration)
    const { data: bookings } = await supabase
        .from('bookings')
        .select('date, time, service_id')
        .eq('expert_id', expertId)
        .in('status', ['confirmed', 'pending'])
        .gte('date', startDate)
        .lte('date', endDate);

    // 4. Get service durations for all booked services
    const bookedServiceIds = [...new Set((bookings || []).map(b => b.service_id).filter(Boolean))];
    let serviceDurations: Record<string, number> = {};
    if (bookedServiceIds.length > 0) {
        const { data: servicesData } = await supabase
            .from('services')
            .select('id, duration')
            .in('id', bookedServiceIds);
        (servicesData || []).forEach((s: any) => {
            serviceDurations[s.id] = s.duration || 60; // Default 60 min if not set
        });
    }

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

    // Helper to convert HH:MM to minutes since midnight
    const timeToMinutes = (time: string): number => {
        const [hh, mm] = time.slice(0, 5).split(':').map(Number);
        return hh * 60 + mm;
    };

    // Helper to check if two time ranges overlap
    // Range A: [startA, startA + durationA)
    // Range B: [startB, startB + durationB)
    const rangesOverlap = (startA: number, durationA: number, startB: number, durationB: number): boolean => {
        const endA = startA + durationA;
        const endB = startB + durationB;
        // Overlap if: startA < endB AND startB < endA
        return startA < endB && startB < endA;
    };

    // Current time for filtering past slots
    const nowUTC = new Date();
    const todayStr = toISODateInTZ(nowUTC, expertTz);

    for (let d = 1; d <= daysInMonth; d++) {
        // Usar mediodía UTC para evitar transiciones DST a medianoche
        const utcMidday = new Date(Date.UTC(year, month, d, 12, 0, 0));
        const zoned = fromUTC(utcMidday, expertTz);
        const dayOfWeek = zoned.getDay(); // 0 = Sun en tz experto
        const dateStr = toISODateInTZ(utcMidday, expertTz);

        // Check availability rule for this day of week
        const rule = schedule?.find(s => s.day_of_week === dayOfWeek);

        // Basic Status Check - also mark past days as unavailable
        if (!rule || exceptionDates.has(dateStr) || dateStr < todayStr) {
            results.push({ date: dateStr, status: 'unavailable', slots: [] });
            continue;
        }

        // Generate Slots from Rule
        const possibleSlots = generateSlots(rule.start_time, rule.end_time, serviceDuration);

        // Filter out slots that overlap with existing bookings
        const dayBookings = (bookings || []).filter(b => b.date === dateStr);

        let availableSlots = possibleSlots.filter(slotTime => {
            const slotStart = timeToMinutes(slotTime);
            // Check if this slot overlaps with any existing booking
            for (const booking of dayBookings) {
                const bookingStart = timeToMinutes(booking.time);
                const bookingDuration = serviceDurations[booking.service_id] || 60;
                if (rangesOverlap(slotStart, serviceDuration, bookingStart, bookingDuration)) {
                    return false; // Slot overlaps with an existing booking
                }
            }
            return true; // No overlap, slot is available
        });

        // Filter out past slots for today
        if (dateStr === todayStr) {
            availableSlots = availableSlots.filter(slotTime => {
                const [hh, mm] = slotTime.split(':').map(Number);
                // Build UTC time for this slot in expert timezone
                const slotUTC = buildLocalDate(year, month + 1, d, hh, mm, expertTz);
                // Slot must be in the future
                return slotUTC.getTime() > nowUTC.getTime();
            });
        }

        let status: 'available' | 'full' | 'unavailable' = 'available';
        if (availableSlots.length === 0) status = 'full';

        results.push({ date: dateStr, status, slots: availableSlots });
    }

    setCachedAvailability(expertId, year, month, serviceDuration, results);
    return results;
}
