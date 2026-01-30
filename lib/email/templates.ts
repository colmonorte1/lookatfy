const COLORS = {
  primary: 'rgb(255,70,85)',
  secondary: 'rgb(79,70,229)',
  text: 'rgb(17,24,39)',
  muted: 'rgb(75,85,99)',
  border: '#e5e7eb',
  bg: '#f8fafc',
  white: '#ffffff',
}

function button(label: string, href: string, variant: 'primary' | 'secondary' = 'primary') {
  const bg = variant === 'primary' ? COLORS.primary : COLORS.secondary
  return `
    <a href="${href}" style="
      display:inline-block;
      padding:12px 18px;
      background:${bg};
      color:${COLORS.white};
      text-decoration:none;
      border-radius:8px;
      font-weight:600;
    ">${label}</a>
  `
}

export function layoutEmail(params: { title: string; preheader?: string; contentHTML: string; footerHTML?: string }) {
  const { title, preheader, contentHTML, footerHTML } = params
  return `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
    ${preheader ? `<span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0">${preheader}</span>` : ''}
  </head>
  <body style="margin:0;background:${COLORS.bg};font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;color:${COLORS.text}">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${COLORS.bg};padding:24px 0">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:${COLORS.white};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden">
            <tr>
              <td style="padding:20px;background:${COLORS.white};border-bottom:1px solid ${COLORS.border}">
                <div style="display:flex;align-items:center;gap:12px">
                  <div style="width:36px;height:36px;border-radius:8px;background:${COLORS.primary}"></div>
                  <div style="font-weight:700;font-size:18px">Lookatfy</div>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px">
                ${contentHTML}
              </td>
            </tr>
            <tr>
              <td style="padding:20px;background:${COLORS.bg};border-top:1px solid ${COLORS.border};font-size:12px;color:${COLORS.muted}">
                ${footerHTML || 'Este es un correo transaccional de Lookatfy.'}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `
}

export function bookingConfirmationTemplate(params: {
  userName: string
  expertName: string
  serviceTitle?: string
  whenStr: string
  timezone: string
  viewLink: string
  joinLink?: string
}) {
  const { userName, expertName, serviceTitle, whenStr, timezone, viewLink, joinLink } = params
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">¡Tu reserva está confirmada!</h2>
    <p style="margin:0 0 16px 0;color:${COLORS.muted}">Hola ${userName}, tu sesión con <strong>${expertName}</strong> ha sido programada.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${COLORS.border};border-radius:10px;overflow:hidden;margin:0 0 16px 0">
      <tr><td style="padding:12px;border-bottom:1px solid ${COLORS.border}"><strong>Servicio</strong><br/><span style="color:${COLORS.muted}">${serviceTitle || 'Sesión'}</span></td></tr>
      <tr><td style="padding:12px;border-bottom:1px solid ${COLORS.border}"><strong>Fecha y hora</strong><br/><span style="color:${COLORS.muted}">${whenStr} (${timezone})</span></td></tr>
      <tr><td style="padding:12px"><strong>Experto</strong><br/><span style="color:${COLORS.muted}">${expertName}</span></td></tr>
    </table>
    <div style="display:flex;gap:12px;margin:18px 0">
      ${button('Ver mis reservas', viewLink, 'primary')}
      ${joinLink ? button('Entrar a la reunión', joinLink, 'secondary') : ''}
    </div>
  `
  return layoutEmail({
    title: 'Reserva confirmada',
    preheader: `Sesión con ${expertName} el ${whenStr}`,
    contentHTML: content,
    footerHTML: 'Si no esperabas este correo, por favor ignóralo.',
  })
}

export function bookingReminderTemplate(params: {
  role: 'user' | 'expert'
  kind: '24h' | '1h'
  userName: string
  expertName: string
  serviceTitle?: string
  whenStr: string
  timezone: string
  viewLink: string
  joinLink?: string
}) {
  const { role, kind, userName, expertName, serviceTitle, whenStr, timezone, viewLink, joinLink } = params
  const title = kind === '24h'
    ? (role === 'user' ? `Recordatorio 24h de tu sesión con ${expertName}` : `Recordatorio 24h de sesión con ${userName}`)
    : (role === 'user' ? `Recordatorio 1h de tu sesión con ${expertName}` : `Recordatorio 1h de sesión con ${userName}`)
  const heading = kind === '24h' ? 'Falta 1 día' : 'Falta 1 hora'
  const primaryCtaLabel = role === 'user' ? 'Ver mis reservas' : 'Ver mis reservas (experto)'
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">${heading}</h2>
    <p style="margin:0 0 16px 0;color:${COLORS.muted}">
      ${role === 'user'
        ? `Hola ${userName}, tu sesión con <strong>${expertName}</strong> (${serviceTitle || 'Sesión'}) es el <strong>${whenStr}</strong> (${timezone}).`
        : `Hola ${expertName}, tu sesión con <strong>${userName}</strong> (${serviceTitle || 'Sesión'}) es el <strong>${whenStr}</strong> (${timezone}).`}
    </p>
    <div style="display:flex;gap:12px;margin:18px 0">
      ${button(primaryCtaLabel, viewLink, 'primary')}
      ${joinLink ? button('Entrar a la reunión', joinLink, 'secondary') : ''}
    </div>
  `
  return layoutEmail({
    title,
    preheader: `${serviceTitle || 'Sesión'} el ${whenStr} (${timezone})`,
    contentHTML: content,
  })
}
