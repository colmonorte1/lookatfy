import { NextResponse } from 'next/server';

export async function POST() {
    const DAILY_API_KEY = process.env.DAILY_API_KEY;

    if (!DAILY_API_KEY) {
        return NextResponse.json({ error: 'Daily API Key not configured' }, { status: 500 });
    }

    try {
        const response = await fetch('https://api.daily.co/v1/rooms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${DAILY_API_KEY}`,
            },
            body: JSON.stringify({
                properties: {
                    enable_chat: true,
                    enable_screenshare: true,
                    exp: Math.round(Date.now() / 1000) + 3600, // Expires in 1 hour
                },
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return NextResponse.json({ error: 'Failed to create room', details: errorData }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json({ url: data.url, name: data.name });

    } catch (error) {
        console.error('Error creating Daily room:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
