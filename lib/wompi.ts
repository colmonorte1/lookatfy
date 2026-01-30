import crypto from 'crypto'

const getBaseUrl = () => {
  const isProd = process.env.NODE_ENV === 'production'
  return isProd ? 'https://api.wompi.co/v1' : 'https://sandbox.wompi.co/v1'
}

export const getAcceptanceToken = async (publicKey: string) => {
  const url = `${getBaseUrl()}/merchants/${publicKey}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    try {
      const err = await res.json()
      throw new Error(err?.error || 'Error obteniendo acceptance token')
    } catch {
      throw new Error('Error obteniendo acceptance token')
    }
  }
  const data = await res.json()
  return data?.data?.presigned_acceptance?.acceptance_token as string
}

export const createPaymentSource = async (input: {
  type: 'CARD' | 'NEQUI' | 'DAVIPLATA' | 'PSE' | 'PCOL'
  token: string
  customerEmail?: string
}) => {
  const url = `${getBaseUrl()}/payment_sources`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY || ''}`,
    },
    body: JSON.stringify({
      type: input.type,
      token: input.token,
      customer_email: input.customerEmail,
    }),
  })
  if (!res.ok) {
    try {
      const err = await res.json()
      throw new Error(err?.error || 'Error creando fuente de pago')
    } catch {
      throw new Error('Error creando fuente de pago')
    }
  }
  const data = await res.json()
  return data?.data?.id as number
}

type PaymentMethodType = 'CARD' | 'PSE' | 'NEQUI' | 'DAVIPLATA' | 'PCOL'
type PSEPaymentMethod = {
  type: 'PSE'
  user_type: 0 | 1
  user_phone: string
  user_legal_id_type: string
  user_legal_id: string
  user_email?: string
  bank_code?: string
}
type NequiPaymentMethod = { type: 'NEQUI'; phone_number: string }
type DaviplataPaymentMethod = {
  type: 'DAVIPLATA'
  phone_number: string
  user_legal_id_type: string
  user_legal_id: string
}

export const createTransaction = async (input: {
  amountInCents: number
  currency: string
  reference: string
  customerEmail: string
  paymentSourceId?: number
  acceptanceToken: string
  paymentMethodType?: PaymentMethodType
  paymentMethod?: PSEPaymentMethod | NequiPaymentMethod | DaviplataPaymentMethod | Record<string, unknown>
}) => {
  const url = `${getBaseUrl()}/transactions`
  const body: Record<string, unknown> = {
    amount_in_cents: input.amountInCents,
    currency: input.currency,
    customer_email: input.customerEmail,
    reference: input.reference,
    acceptance_token: input.acceptanceToken,
  }
  if (input.paymentSourceId) body.payment_source_id = input.paymentSourceId
  if (input.paymentMethodType) body.payment_method_type = input.paymentMethodType
  if (input.paymentMethod) body.payment_method = input.paymentMethod
  // Generate integrity signature
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET
  if (!integritySecret) {
    // Log warning in production
    if (process.env.NODE_ENV === 'production') {
      console.warn('WOMPI_INTEGRITY_SECRET not set - signature will not be included. This is required for production!')
    }
  } else {
    try {
      const raw = `${input.reference}${input.amountInCents}${input.currency}${integritySecret}`
      const signature = crypto.createHash('sha256').update(raw, 'utf8').digest('hex')
      ;(body as any).signature = signature
    } catch (err) {
      console.error('Error generating Wompi signature:', err)
      throw new Error('Failed to generate payment signature')
    }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY || ''}`,
    },
    body: JSON.stringify(body),
  })
  try {
    const debug: { [key: string]: unknown; acceptance_token?: unknown } = { ...body }
    delete debug.acceptance_token
    console.log('WOMPI_TX_BODY', { ...debug, has_signature: !!(debug as any).signature })
  } catch {}
  if (!res.ok) {
    const status = res.status
    let bodyText = ''
    try { bodyText = await res.text() } catch {}
    let msg = 'Error creando transacción'
    try {
      const err = JSON.parse(bodyText)
      if (typeof err?.error === 'string') msg = err.error
      else if (err?.error?.reason) msg = err.error.reason
      else if (Array.isArray(err?.error?.messages)) msg = err.error.messages.join(', ')
      else if (err?.message) msg = err.message
    } catch {}
    throw new Error(`${msg} [${status}] ${bodyText?.slice(0,200) || ''}`.trim())
  }
  const data = await res.json()
  return data?.data
}

export const verifyWebhookSignature = (payload: string, checksum?: string) => {
  const secret = process.env.WOMPI_WEBHOOK_SECRET || ''
  if (!secret || !checksum) return false
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload, 'utf8')
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(checksum))
}
