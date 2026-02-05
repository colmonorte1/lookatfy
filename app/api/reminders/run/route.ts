import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/lib/email/brevo'
import { formatInTZ } from '@/utils/timezone'
import { bookingReminderTemplate } from '@/lib/email/templates'

export const runtime = 'nodejs'

function windowBounds(now: Date, minutesAhead: number, windowMinutes: number) {
  const lower = new Date(now.getTime() + (minutesAhead - windowMinutes) * 60_000)
  const upper = new Date(now.getTime() + (minutesAhead + windowMinutes) * 60_000)
  return { lower: lower.toISOString(), upper: upper.toISOString() }
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET || process.env.NEXT_CRON_SECRET
  const provided = request.headers.get('x-cron-secret')
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
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

  const now = new Date()
  const WINDOW_MIN = 10

  const { lower: lower24, upper: upper24 } = windowBounds(now, 24 * 60, WINDOW_MIN)
  const { lower: lower1, upper: upper1 } = windowBounds(now, 60, WINDOW_MIN)

  const selectCols = 'id, start_at, meeting_url, status, user_id, expert_id, user_timezone, expert_timezone, service:services!service_id(title, duration), user:profiles!user_id(email, full_name), expert:experts!expert_id(profile:profiles(full_name))'

  const { data: due24h } = await writeClient
    .from('bookings')
    .select(selectCols)
    .eq('status', 'confirmed')
    .gte('start_at', lower24)
    .lte('start_at', upper24)
    .or('reminder_user_24h_sent.is.false,reminder_expert_24h_sent.is.false')

  const { data: due1h } = await writeClient
    .from('bookings')
    .select(selectCols)
    .eq('status', 'confirmed')
    .gte('start_at', lower1)
    .lte('start_at', upper1)
    .or('reminder_user_1h_sent.is.false,reminder_expert_1h_sent.is.false')

  const sendFor = async (rows: any[], kind: '24h' | '1h') => {
    for (const b of rows || []) {
      const startUtc = new Date(b.start_at)
      const serviceTitle = Array.isArray(b.service) ? (b.service[0] as any)?.title : (b.service as any)?.title
      const userRow = Array.isArray(b.user) ? b.user[0] : (b.user as any)
      const expertProfile = Array.isArray(b.expert) ? (b.expert[0] as any)?.profile : (b.expert as any)?.profile
      const expertName = Array.isArray(expertProfile) ? expertProfile[0]?.full_name || 'Experto' : expertProfile?.full_name || 'Experto'
      const userName = userRow?.full_name || 'Usuario'
      const userTz = b.user_timezone || 'UTC'
      const expertTz = b.expert_timezone || 'UTC'
      const userWhen = formatInTZ(startUtc, userTz, "yyyy-MM-dd HH:mm")
      const expertWhen = formatInTZ(startUtc, expertTz, "yyyy-MM-dd HH:mm")

      if (kind === '24h') {
        if (!b.reminder_user_24h_sent && userRow?.email) {
          const subject = `Recordatorio 24h: tu sesión con ${expertName}`
          const html = bookingReminderTemplate({
            role: 'user',
            kind: '24h',
            userName: userRow?.full_name || 'Usuario',
            expertName,
            serviceTitle,
            whenStr: userWhen,
            timezone: userTz,
            viewLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/user/bookings`,
          })
          const text = `Tu sesión (${serviceTitle || ''}) es el ${userWhen} (${userTz}).`
          await sendEmail({ to: userRow.email, subject, text, html })
        }
        if (!b.reminder_expert_24h_sent && expertProfile?.email) {
          const subject = `Recordatorio 24h: sesión con ${userName}`
          const html = bookingReminderTemplate({
            role: 'expert',
            kind: '24h',
            userName,
            expertName,
            serviceTitle,
            whenStr: expertWhen,
            timezone: expertTz,
            viewLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/expert/bookings`,
          })
          const text = `Tienes una sesión (${serviceTitle || ''}) el ${expertWhen} (${expertTz}).`
          await sendEmail({ to: expertProfile.email, subject, text, html })
        }
        await writeClient
          .from('bookings')
          .update({ reminder_user_24h_sent: true, reminder_expert_24h_sent: true })
          .eq('id', b.id)
      } else {
        if (!b.reminder_user_1h_sent && userRow?.email) {
          const subject = `Recordatorio 1h: tu sesión con ${expertName}`
          const html = bookingReminderTemplate({
            role: 'user',
            kind: '1h',
            userName: userRow?.full_name || 'Usuario',
            expertName,
            serviceTitle,
            whenStr: userWhen,
            timezone: userTz,
            viewLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/user/bookings`,
            joinLink: b.meeting_url || undefined,
          })
          const text = `Tu sesión (${serviceTitle || ''}) es a las ${userWhen} (${userTz}).`
          await sendEmail({ to: userRow.email, subject, text, html })
        }
        if (!b.reminder_expert_1h_sent && expertProfile?.email) {
          const subject = `Recordatorio 1h: sesión con ${userName}`
          const html = bookingReminderTemplate({
            role: 'expert',
            kind: '1h',
            userName,
            expertName,
            serviceTitle,
            whenStr: expertWhen,
            timezone: expertTz,
            viewLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/expert/bookings`,
            joinLink: b.meeting_url || undefined,
          })
          const text = `Tu sesión (${serviceTitle || ''}) es a las ${expertWhen} (${expertTz}).`
          await sendEmail({ to: expertProfile.email, subject, text, html })
        }
        await writeClient
          .from('bookings')
          .update({ reminder_user_1h_sent: true, reminder_expert_1h_sent: true })
          .eq('id', b.id)
      }
    }
  }

  await sendFor(due24h || [], '24h')
  await sendFor(due1h || [], '1h')

  return NextResponse.json({
    ok: true,
    counts: { due24h: (due24h || []).length, due1h: (due1h || []).length },
    windowMinutes: WINDOW_MIN,
  })
}
