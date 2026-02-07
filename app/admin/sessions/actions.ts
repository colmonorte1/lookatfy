'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

interface SessionStatus {
    active: boolean;
    participants: number;
    participantDetails: { user_name?: string; join_time?: string }[];
}

export async function checkDailyRoomStatus(meetingUrl: string | null): Promise<SessionStatus> {
    if (!meetingUrl) {
        return { active: false, participants: 0, participantDetails: [] };
    }

    try {
        const roomName = meetingUrl.split('/').pop();
        if (!roomName) throw new Error('Invalid room URL');

        const apiKey = process.env.DAILY_API_KEY;
        if (!apiKey) throw new Error('Daily API key not configured');

        // Fetch room presence/participants
        // Daily API endpoint for room analytics/presence is likely needed.
        // However, the standard REST API allows checking ongoing sessions.
        // GET /rooms/:name/presence is not standard, check docs or use /meetings
        // Let's try checking if a meeting is running or room info.
        // GET https://api.daily.co/v1/rooms/:name/presence

        const response = await fetch(`https://api.daily.co/v1/rooms/${roomName}/presence`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            // If 404, maybe room deleted or expired? Use empty.
            return { active: false, participants: 0, participantDetails: [] };
        }

        const data = await response.json();
        // Expected data format from Daily Presence API:
        // { "data": [ { "id": "...", "userName": "...", "joinTime": "..." } ] }
        // OR it might be an object keyed by session ID.
        // Let's assume standard response or empty array.

        // Actually, distinct presence API might return object with data.
        // https://docs.daily.co/reference/rest-api/rooms/get-room-presence
        // Returns: { "id": "...", "name": "...", "privacy": "...", "data": [ ...participants ] }

        const participants = Array.isArray(data.data) ? data.data : [];

        return {
            active: participants.length > 0,
            participants: participants.length,
            participantDetails: participants.map((p: any) => ({
                user_name: p.userName || 'Unknown',
                join_time: p.joinTime
            }))
        };

    } catch (error) {
        console.error('Error checking Daily room status:', error);
        return { active: false, participants: 0, participantDetails: [] };
    }
}

export async function approveBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'No autenticado' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return { success: false, error: 'No autorizado' };
        }

        // Call the approve API endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/payments/${bookingId}/approve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Error al aprobar' };
        }

        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Error approving booking:', error);
        return { success: false, error: 'Error interno' };
    }
}

export async function rejectBooking(bookingId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = await createClient();

        // Verify admin
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'No autenticado' };
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || profile.role !== 'admin') {
            return { success: false, error: 'No autorizado' };
        }

        // Call the reject API endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/admin/payments/${bookingId}/reject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ reason }),
        });

        if (!response.ok) {
            const error = await response.json();
            return { success: false, error: error.error || 'Error al rechazar' };
        }

        revalidatePath('/admin/sessions');
        return { success: true };
    } catch (error) {
        console.error('Error rejecting booking:', error);
        return { success: false, error: 'Error interno' };
    }
}
