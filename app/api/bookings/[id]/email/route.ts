import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { buildICS } from '@/utils/ics'
import { sendEmail } from '@/lib/email/brevo'
import { bookingConfirmationTemplate } from '@/lib/email/templates'
import { formatInTZ } from '@/utils/timezone'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const supabase = await createClient()
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, start_at, meeting_url, user_id, user_timezone, user:profiles!user_id(email, full_name), service:services!service_id(title, duration), expert:experts!expert_id(profile:profiles(full_name))')
      .eq('id', id)
      .single()
    if (error || !booking?.start_at) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }
    const duration = Number((Array.isArray(booking.service) ? booking.service[0]?.duration : (booking.service as any)?.duration) ?? 60)
    const expertProfile = Array.isArray(booking.expert) ? (booking.expert[0] as any)?.profile : (booking.expert as any)?.profile
    const expertName = Array.isArray(expertProfile) ? expertProfile[0]?.full_name || 'Experto' : expertProfile?.full_name || 'Experto'
    const serviceTitle = Array.isArray(booking.service) ? (booking.service[0] as any)?.title : (booking.service as any)?.title
    const ics = buildICS({
      uid: `booking-${booking.id}@lookatfy`,
      startAtUTC: booking.start_at,
      durationMinutes: duration,
      summary: `Sesión con ${expertName}`,
      description: `Servicio: ${serviceTitle || ''}`,
      location: 'Sala de Video Privada',
    })
    const userRow = Array.isArray(booking.user) ? booking.user[0] : (booking.user as any)
    const whenStr = formatInTZ(new Date(booking.start_at), booking.user_timezone || 'UTC', 'yyyy-MM-dd HH:mm')
    const html = bookingConfirmationTemplate({
      userName: userRow?.full_name || 'Usuario',
      expertName,
      serviceTitle,
      whenStr,
      timezone: booking.user_timezone || 'UTC',
      viewLink: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/user/bookings`,
      joinLink: booking.meeting_url || undefined,
    })
    const text = `Tu sesión ha sido confirmada. Servicio: ${serviceTitle || ''}. Fecha: ${whenStr} (${booking.user_timezone || 'UTC'}).`
    const res = await sendEmail({
      to: userRow?.email,
      subject: `Tu reserva con ${expertName}`,
      html,
      text,
      attachments: [{ filename: `lookatfy-${booking.id}.ics`, content: Buffer.from(ics).toString('base64'), contentType: 'text/calendar' }],
    })
    return NextResponse.json({ ok: true, result: res })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
