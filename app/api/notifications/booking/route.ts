import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { sendEmail } from '@/lib/email/brevo'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { booking_id } = await request.json()
  if (!booking_id) return NextResponse.json({ error: 'Missing booking_id' }, { status: 400 })

  const { data: booking, error: bErr } = await supabase
    .from('bookings')
    .select('id, user_id, expert_id, date, time, status')
    .eq('id', booking_id)
    .single()
  if (bErr || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use Service Role to insert notifications
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

  const payloads = [
    {
      recipient_user_id: booking.expert_id,
      type: 'new_booking_assigned',
      title: 'Nueva reserva asignada',
      body: `Tienes una nueva reserva para ${booking.date} ${booking.time}.`,
      data: { booking_id: booking.id },
    },
    {
      recipient_user_id: booking.user_id,
      type: 'booking_confirmed',
      title: 'Reserva confirmada',
      body: `Tu reserva ha sido confirmada para ${booking.date} ${booking.time}.`,
      data: { booking_id: booking.id },
    }
  ]

  const { error } = await writeClient.from('notifications').insert(
    payloads.map((p) => ({ ...p, status: 'unread', created_by: user.id }))
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  try {
    const supa = await createClient()
    const { data: userProfile } = await supa
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.user_id)
      .single()
    const { data: expertProfile } = await supa
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.expert_id)
      .single()
    if (userProfile?.email) {
      const text = `Tu reserva ha sido confirmada para ${booking.date} ${booking.time}.`
      const html = `<p>Tu reserva ha sido confirmada para ${booking.date} ${booking.time}.</p>`
      await sendEmail({ to: userProfile.email, subject: 'Reserva confirmada', html, text })
    }
    if (expertProfile?.email) {
      const text = `Nueva reserva asignada para ${booking.date} ${booking.time}.`
      const html = `<p>Nueva reserva asignada para ${booking.date} ${booking.time}.</p>`
      await sendEmail({ to: expertProfile.email, subject: 'Nueva reserva asignada', html, text })
    }
  } catch {}
  return NextResponse.json({ success: true })
}
