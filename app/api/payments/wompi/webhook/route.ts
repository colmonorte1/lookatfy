import { NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/wompi'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const raw = await request.text()
    const checksum = request.headers.get('X-Event-Checksum') || request.headers.get('x-event-checksum') || undefined
    const ok = verifyWebhookSignature(raw, checksum || undefined)
    if (!ok) return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
    const payload = JSON.parse(raw)
    const tx = payload?.event?.data?.transaction
    const reference = tx?.reference as string | undefined
    const status = tx?.status as string | undefined
    if (!reference || !status) return NextResponse.json({ error: 'Evento inválido' }, { status: 400 })
    let newStatus: 'confirmed' | 'cancelled' | 'pending' = 'pending'
    if (status === 'APPROVED') newStatus = 'confirmed'
    else if (status === 'DECLINED' || status === 'VOIDED' || status === 'ERROR') newStatus = 'cancelled'
    try {
      console.log('WOMPI_WEBHOOK', { status, newStatus, reference })
    } catch {}
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) return NextResponse.json({ error: 'Service role requerido' }, { status: 500 })
    const { createServerClient } = await import('@supabase/ssr')
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey!,
      { cookies: { getAll: () => [], setAll: () => { } } }
    )
    // Si el pago fue APROBADO, completar la reserva
    if (status === 'APPROVED') {
      try {
        // 1. Crear sala de Daily.co
        let roomUrl: string | null = null
        try {
          const dailyApiKey = process.env.DAILY_API_KEY
          if (dailyApiKey) {
            const roomRes = await fetch('https://api.daily.co/v1/rooms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${dailyApiKey}`,
              },
              body: JSON.stringify({
                properties: {
                  enable_screenshare: true,
                  enable_chat: true,
                  enable_recording: 'cloud',
                  max_participants: 2,
                },
              }),
            })
            if (roomRes.ok) {
              const data = await roomRes.json()
              roomUrl = data.url || null
            }
          }
        } catch (err) {
          console.error('Error creating Daily.co room:', err)
        }

        // 2. Actualizar booking con sala y status confirmed
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            meeting_url: roomUrl,
          })
          .eq('id', reference)

        if (bookingError) {
          console.error('Error updating booking:', bookingError)
        }

        // 3. Enviar email de confirmación
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/bookings/${reference}/email`, {
            method: 'POST',
          })
        } catch (err) {
          console.error('Error sending confirmation email:', err)
        }

        // 4. Enviar notificaciones in-app
        try {
          await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications/booking`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ booking_id: reference }),
          })
        } catch (err) {
          console.error('Error sending notifications:', err)
        }
      } catch (err) {
        console.error('Error processing approved payment:', err)
      }
    } else {
      // Si el pago fue rechazado o tuvo error, solo actualizar el status
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', reference)

      if (bookingError) {
        console.error('Error updating booking:', bookingError)
      }
    }

    // Update transaction status (siempre)
    const { error: txError } = await supabase
      .from('payment_transactions')
      .update({
        status: status,
        status_message: tx?.status_message || null,
        wompi_response: tx || null,
      })
      .eq('wompi_reference', reference)

    if (txError) {
      console.error('Error updating transaction:', txError)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error procesando webhook' }, { status: 400 })
  }
}
