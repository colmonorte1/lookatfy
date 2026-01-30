type Attachment = {
  filename: string
  content: string
  contentType?: string
}

type SendEmailPayload = {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  attachments?: Attachment[]
  senderEmail?: string
  senderName?: string
}

function getSender() {
  const email = process.env.BREVO_SENDER_EMAIL || process.env.NEXT_BREVO_SENDER_EMAIL
  const name = process.env.BREVO_SENDER_NAME || process.env.NEXT_BREVO_SENDER_NAME || 'Lookatfy'
  return { email, name }
}

export async function sendEmail(payload: SendEmailPayload) {
  const key = process.env.BREVO_API_KEY || process.env.NEXT_BREVO_API_KEY
  if (!key) {
    return { success: false, error: 'Missing BREVO_API_KEY' }
  }
  const toList = Array.isArray(payload.to) ? payload.to : [payload.to]
  const sender = {
    email: payload.senderEmail || getSender().email!,
    name: payload.senderName || getSender().name!,
  }
  try {
    const body = {
      subject: payload.subject,
      htmlContent: payload.html,
      textContent: payload.text,
      sender,
      to: toList.map((email) => ({ email })),
      attachment: payload.attachments?.map((a) => ({
        name: a.filename,
        content: a.content,
        type: a.contentType,
      })),
    }
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': key,
        'accept': 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { success: false, error: json?.message || 'Email send failed' }
    }
    const id = json?.messageId || json?.messageIds
    return { success: true, id }
  } catch (e: any) {
    return { success: false, error: e?.message || 'Email send failed' }
  }
}
