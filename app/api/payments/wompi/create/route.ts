import { NextResponse } from 'next/server'
import { getAcceptanceToken, createPaymentSource, createTransaction } from '@/lib/wompi'
import { createServerClient } from '@supabase/ssr'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const {
      amount_in_cents,
      currency,
      reference,
      customer_email,
      type,
      token,
      payment_method_type,
      payment_method_payload,
      customer_data,
      original_amount,
      original_currency,
      redirect_url,
    } = payload || {}

    try {
      console.log('WOMPI_CREATE_REQUEST', {
        amount_in_cents,
        currency,
        reference,
        customer_email,
        has_source_token: !!token,
        source_type: type,
        has_method_type: !!payment_method_type,
        has_method_payload: !!payment_method_payload,
      })
    } catch {}

    if (!amount_in_cents || !currency || !reference || !customer_email) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
    }

    if (!token && !type && !payment_method_type) {
      return NextResponse.json({ error: 'Debe especificar método de pago (payment_method_type) o fuente (token+type)' }, { status: 400 })
    }

    if (payment_method_type && !payment_method_payload) {
      return NextResponse.json({ error: 'Falta payment_method para el método seleccionado' }, { status: 400 })
    }

    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY
    const privateKey = process.env.WOMPI_PRIVATE_KEY
    if (!publicKey) {
      return NextResponse.json({ error: 'Falta NEXT_PUBLIC_WOMPI_PUBLIC_KEY' }, { status: 500 })
    }
    if (!privateKey) {
      return NextResponse.json({ error: 'Falta WOMPI_PRIVATE_KEY' }, { status: 500 })
    }

    let acceptanceToken: string
    try {
      acceptanceToken = await getAcceptanceToken(publicKey)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'Error obteniendo acceptance token' }, { status: 400 })
    }
    let paymentSourceId: number | undefined

    if (token && type) {
      paymentSourceId = await createPaymentSource({
        type,
        token,
        customerEmail: customer_email,
      })
    }

    let tx
    try {
      tx = await createTransaction({
        amountInCents: Number(amount_in_cents),
        currency,
        reference,
        customerEmail: customer_email,
        paymentSourceId,
        acceptanceToken,
        paymentMethodType: payment_method_type,
        paymentMethod: payment_method_payload,
        customerData: customer_data,
        redirectUrl: redirect_url,
      })
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || 'Error creando transacción' }, { status: 400 })
    }

    try {
      console.log('WOMPI_TX', { id: tx?.id, status: tx?.status, reference: tx?.reference })
    } catch {}

    // Save transaction to database for auditing
    try {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY
      if (serviceRoleKey) {
        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { cookies: { getAll: () => [], setAll: () => {} } }
        )

        // Get user_id from booking
        const { data: booking } = await supabase
          .from('bookings')
          .select('user_id')
          .eq('id', reference)
          .single()

        await supabase.from('payment_transactions').insert({
          booking_id: reference,
          user_id: booking?.user_id || null,
          wompi_transaction_id: tx?.id,
          wompi_reference: reference,
          amount_in_cents: Number(amount_in_cents),
          currency,
          original_amount: original_amount || null,
          original_currency: original_currency || null,
          payment_method_type,
          payment_method_details: payment_method_payload || null,
          status: tx?.status || 'PENDING',
          redirect_url: tx?.redirect_url || null,
          payment_link: tx?.payment_link || null,
          wompi_response: tx || null,
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent') || null,
        })
      }
    } catch (dbError) {
      console.error('Error saving transaction to DB:', dbError)
      // Don't fail the request if DB save fails
    }

    return NextResponse.json({ transaction: tx })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Error creando transacción' }, { status: 400 })
  }
}
