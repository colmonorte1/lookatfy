import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = String(profile?.role || 'client') as 'client' | 'expert' | 'admin'

  let writeClient = supabase
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
  if (serviceRoleKey) {
    try {
      const { createServerClient } = await import('@supabase/ssr')
      writeClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceRoleKey!,
        { cookies: { getAll: () => [], setAll: () => { } } }
      )
    } catch {}
  }

  const rows = [
    {
      recipient_user_id: user.id,
      type: 'welcome',
      title: '¡Bienvenido a Notificaciones!',
      body: 'Este es un ejemplo de notificación directa.',
      data: null,
      status: 'unread',
      created_by: user.id,
    },
    {
      target_role: role,
      type: 'role_announcement',
      title: `Mensaje para ${role}`,
      body: 'Este es un ejemplo de broadcast por rol.',
      data: null,
      status: 'unread',
      created_by: user.id,
    }
  ]

  const { error } = await writeClient.from('notifications').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true, inserted: rows.length })
}
