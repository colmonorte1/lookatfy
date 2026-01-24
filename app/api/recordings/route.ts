import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const instanceId: string = body.instanceId;
    const roomUrl: string = body.roomUrl;
    const bookingId: string | null = body.bookingId || null;
    const type: 'cloud' | 'local' | 'raw-tracks' = body.type || 'cloud';
    const storageUrl: string | null = body.storageUrl || null;

    if (!instanceId || !roomUrl) {
      return NextResponse.json({ error: 'Missing instanceId or roomUrl' }, { status: 400 });
    }

    let roomName = '';
    try {
      const u = new URL(roomUrl);
      roomName = u.pathname.split('/').filter(Boolean).pop() || '';
    } catch {
      roomName = roomUrl;
    }

    const { data, error } = await supabase
      .from('recordings')
      .insert({
        user_id: user.id,
        booking_id: bookingId,
        room_name: roomName,
        type,
        status: 'finished',
        instance_id: instanceId,
        storage_url: storageUrl,
        ended_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to persist recording', details: error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, recording: data });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
