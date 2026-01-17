// lib/daily.ts
// Setup for Daily.co video calls

export const DAILY_ROOM_OPTIONS = {
    // Default options for creating rooms
    privacy: 'public', // For MVP, we might use public rooms with tokens, or private.
    properties: {
        enable_chat: true,
        start_video_off: false,
        start_audio_off: false,
    }
};

// Placeholder for future API helpers to create rooms
export async function createRoom() {
    // content to be implemented
    console.log("Creating room...");
}
