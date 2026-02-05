import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/lib/email/brevo'
import { shouldSendEmail } from '@/lib/email/types'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get('status')
  const limit = Number(url.searchParams.get('limit') || 20)
  const offset = Number(url.searchParams.get('offset') || 0)

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + Math.max(0, limit - 1))

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ notifications: data || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const payload = await request.json()
  const {
    recipient_user_id,
    target_role,
    type,
    title,
    body,
    data,
  } = payload || {}

  if (!type || !title) {
    return NextResponse.json({ error: 'Missing type or title' }, { status: 400 })
  }

  if (!!recipient_user_id === !!target_role) {
    return NextResponse.json({ error: 'Provide either recipient_user_id or target_role' }, { status: 400 })
  }

  // Use Service Role if available to bypass RLS on INSERT
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

  const { error } = await writeClient
    .from('notifications')
    .insert({
      recipient_user_id: recipient_user_id || null,
      target_role: target_role || null,
      type,
      title,
      body: body || null,
      data: data || null,
      status: 'unread',
      created_by: user.id,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  try {
    if (shouldSendEmail(type)) {
      const supa = await createClient()
      if (recipient_user_id) {
        const { data: profile } = await supa
          .from('profiles')
          .select('email, full_name')
          .eq('id', recipient_user_id)
          .single()
        if (profile?.email) {
          const html = `<p>${title}</p>${body ? `<p>${body}</p>` : ''}`
          const text = `${title}${body ? `\n${body}` : ''}`
          await sendEmail({ to: profile.email, subject: title, html, text })
        }
      } else if (target_role) {
        const { data: profiles } = await supa
          .from('profiles')
          .select('email')
          .eq('role', target_role)
        const emails = (profiles || []).map((p: any) => p.email).filter(Boolean)
        if (emails.length) {
          const html = `<p>${title}</p>${body ? `<p>${body}</p>` : ''}`
          const text = `${title}${body ? `\n${body}` : ''}`
          await sendEmail({ to: emails, subject: title, html, text })
        }
      }
    }
  } catch {}
  return NextResponse.json({ success: true })
}
