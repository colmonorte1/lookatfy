import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const DAILY_API_KEY = process.env.DAILY_API_KEY;
    if (!DAILY_API_KEY) {
      return NextResponse.json({ error: 'Daily API Key not configured' }, { status: 500 });
    }

    const { roomUrl, instanceId } = await request.json();
    if (!roomUrl) return NextResponse.json({ error: 'Missing roomUrl' }, { status: 400 });

    let roomName = '';
    try {
      const u = new URL(roomUrl);
      roomName = u.pathname.split('/').filter(Boolean).pop() || '';
    } catch {
      roomName = roomUrl;
    }

    const listResp = await fetch(`https://api.daily.co/v1/recordings`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
    });
    if (!listResp.ok) {
      return NextResponse.json({ error: 'Failed to list recordings' }, { status: listResp.status });
    }
    const json = await listResp.json();
    const items: any[] = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);

    const recent = items
      .filter((it) => String(it?.room_name || '').includes(roomName))
      .sort((a, b) => new Date(b?.created_at || b?.start_ts || 0).getTime() - new Date(a?.created_at || a?.start_ts || 0).getTime())[0];

    const storageUrl: string | null = recent?.download_url || recent?.url || null;

    try {
      const { createServerClient } = await import('@supabase/ssr');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;
      const supabase = createServerClient(url, serviceKey, { cookies: { getAll: () => [], setAll: () => {} } });

      if (storageUrl) {
        await supabase
          .from('recordings')
          .update({ storage_url: storageUrl })
          .eq('instance_id', instanceId);
      }
    } catch {}

    return NextResponse.json({ ok: true, storageUrl });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
