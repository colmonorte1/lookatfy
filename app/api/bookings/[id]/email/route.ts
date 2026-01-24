import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { buildICS } from '@/utils/ics'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const supabase = await createClient()
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('id, start_at, user_id, user:profiles!user_id(email, full_name), service:services!service_id(title, duration), expert:experts!expert_id(profile:profiles(full_name))')
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
    const emailPayload = {
      to: userRow?.email,
      subject: `Tu reserva con ${expertName}`,
      text: `Tu sesión ha sido confirmada.\nResumen: ${serviceTitle || ''}\nAdjuntamos un archivo .ics con el evento.`,
      attachments: [{ filename: `lookatfy-${booking.id}.ics`, content: ics, contentType: 'text/calendar' }],
    }
    // Integremos proveedor real más adelante. Por ahora devolvemos payload.
    return NextResponse.json({ ok: true, emailPayload })
  } catch (e) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
