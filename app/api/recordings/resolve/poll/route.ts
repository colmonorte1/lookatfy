import { NextResponse } from 'next/server';

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(request: Request) {
  const DAILY_API_KEY = process.env.DAILY_API_KEY;
  if (!DAILY_API_KEY) return NextResponse.json({ error: 'Daily API Key not configured' }, { status: 500 });

  const { roomUrl, instanceId } = await request.json();
  if (!roomUrl) return NextResponse.json({ error: 'Missing roomUrl' }, { status: 400 });

  let roomName = '';
  try {
    const u = new URL(roomUrl);
    roomName = u.pathname.split('/').filter(Boolean).pop() || '';
  } catch {
    roomName = roomUrl;
  }

  const attempts = [500, 1000, 2000, 4000, 8000];
  let storageUrl: string | null = null;
  for (let i = 0; i < attempts.length; i++) {
    const resp = await fetch('https://api.daily.co/v1/recordings', { headers: { Authorization: `Bearer ${DAILY_API_KEY}` } });
    if (resp.ok) {
      const json = await resp.json();
      const items: any[] = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      const recent = items
        .filter((it) => String(it?.room_name || '').includes(roomName))
        .sort((a, b) => new Date(b?.created_at || b?.start_ts || 0).getTime() - new Date(a?.created_at || a?.start_ts || 0).getTime())[0];
      storageUrl = recent?.download_url || recent?.url || null;
      if (storageUrl) break;
    }
    await wait(attempts[i]);
  }

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
}
