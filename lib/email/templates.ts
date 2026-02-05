const COLORS = {
  primary: 'rgb(255,70,85)',
  secondary: 'rgb(79,70,229)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  text: 'rgb(17,24,39)',
  muted: 'rgb(75,85,99)',
  border: '#e5e7eb',
  bg: '#f8fafc',
  white: '#ffffff',
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || ''

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

function infoBox(content: string, color: string = COLORS.secondary) {
  return `<div style="background:${color}11;border-left:4px solid ${color};padding:14px 16px;border-radius:6px;margin:16px 0">${content}</div>`
}

function detailRow(label: string, value: string) {
  return `<tr><td style="padding:12px;border-bottom:1px solid ${COLORS.border}"><strong>${label}</strong><br/><span style="color:${COLORS.muted}">${value}</span></td></tr>`
}

function detailTable(rows: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid ${COLORS.border};border-radius:10px;overflow:hidden;margin:0 0 16px 0">${rows}</table>`
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

// ─── WELCOME / ONBOARDING ──────────────────────────────────────────

export function welcomeTemplate(params: { userName: string; role: 'client' | 'expert' }) {
  const { userName, role } = params
  const roleName = role === 'expert' ? 'experto' : 'cliente'
  const dashboardLink = `${BASE_URL}/${role === 'expert' ? 'expert' : 'user'}`
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">¡Bienvenido a Lookatfy!</h2>
    <p style="margin:0 0 16px 0;color:${COLORS.muted}">Hola <strong>${userName}</strong>, tu cuenta como <strong>${roleName}</strong> ha sido creada exitosamente.</p>
    ${role === 'client'
      ? `<p style="color:${COLORS.muted}">Ahora puedes explorar expertos, reservar sesiones y recibir asesorías profesionales.</p>`
      : `<p style="color:${COLORS.muted}">Completa tu perfil, configura tus servicios y empieza a recibir reservas de clientes.</p>`
    }
    <div style="margin:18px 0">
      ${button(role === 'expert' ? 'Completar mi perfil' : 'Explorar expertos', dashboardLink)}
    </div>
  `
  return layoutEmail({
    title: 'Bienvenido a Lookatfy',
    preheader: `¡Hola ${userName}! Tu cuenta está lista.`,
    contentHTML: content,
  })
}

export function welcomeAdminCreatedTemplate(params: { userName: string; email: string; tempPassword: string }) {
  const { userName, email, tempPassword } = params
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">¡Bienvenido a Lookatfy!</h2>
    <p style="margin:0 0 16px 0;color:${COLORS.muted}">Hola <strong>${userName}</strong>, tu cuenta ha sido creada por un administrador.</p>
    ${detailTable(
      detailRow('Email', email) +
      detailRow('Contraseña temporal', tempPassword)
    )}
    ${infoBox('<strong>Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña después del primer inicio de sesión.')}
    <div style="margin:18px 0">
      ${button('Iniciar Sesión', `${BASE_URL}/login`)}
    </div>
  `
  return layoutEmail({
    title: 'Bienvenido a Lookatfy',
    preheader: 'Tu cuenta ha sido creada. Aquí están tus credenciales.',
    contentHTML: content,
  })
}

// ─── ACCOUNT STATUS ────────────────────────────────────────────────

export function accountSuspendedTemplate(params: { userName: string }) {
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Cuenta Suspendida</h2>
    ${infoBox('<strong>Tu cuenta ha sido suspendida temporalmente.</strong>', COLORS.warning)}
    <p style="color:${COLORS.muted}">Hola <strong>${params.userName}</strong>, no podrás acceder a tu cuenta hasta que sea reactivada por un administrador.</p>
    <p style="color:${COLORS.muted}">Si crees que esto es un error, por favor contacta al equipo de soporte.</p>
  `
  return layoutEmail({
    title: 'Cuenta Suspendida',
    preheader: 'Tu cuenta ha sido suspendida temporalmente.',
    contentHTML: content,
  })
}

export function accountReactivatedTemplate(params: { userName: string }) {
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Cuenta Reactivada</h2>
    ${infoBox('<strong>¡Buenas noticias! Tu cuenta ha sido reactivada.</strong>', COLORS.success)}
    <p style="color:${COLORS.muted}">Hola <strong>${params.userName}</strong>, ya puedes volver a acceder a todos los servicios de Lookatfy.</p>
    <div style="margin:18px 0">
      ${button('Iniciar Sesión', `${BASE_URL}/login`)}
    </div>
  `
  return layoutEmail({
    title: 'Cuenta Reactivada',
    preheader: 'Tu cuenta ha sido reactivada.',
    contentHTML: content,
  })
}

export function accountUpdatedTemplate(params: { userName: string }) {
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Cuenta Actualizada</h2>
    ${infoBox('<strong>Tu información de cuenta ha sido actualizada por un administrador.</strong>')}
    <p style="color:${COLORS.muted}">Hola <strong>${params.userName}</strong>, si no solicitaste estos cambios, por favor contacta al equipo de soporte inmediatamente.</p>
  `
  return layoutEmail({
    title: 'Cuenta Actualizada',
    preheader: 'Tu información de cuenta fue actualizada.',
    contentHTML: content,
  })
}

// ─── BOOKING ───────────────────────────────────────────────────────

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
    ${detailTable(
      detailRow('Servicio', serviceTitle || 'Sesión') +
      detailRow('Fecha y hora', `${whenStr} (${timezone})`) +
      `<tr><td style="padding:12px"><strong>Experto</strong><br/><span style="color:${COLORS.muted}">${expertName}</span></td></tr>`
    )}
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

export function bookingCancelledTemplate(params: {
  recipientName: string
  otherPartyName: string
  serviceTitle?: string
  whenStr: string
  timezone: string
  reason?: string
  role: 'user' | 'expert'
}) {
  const { recipientName, otherPartyName, serviceTitle, whenStr, timezone, reason, role } = params
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Reserva Cancelada</h2>
    <p style="color:${COLORS.muted}">Hola <strong>${recipientName}</strong>, la siguiente reserva ha sido cancelada:</p>
    ${detailTable(
      detailRow('Servicio', serviceTitle || 'Sesión') +
      detailRow('Fecha y hora', `${whenStr} (${timezone})`) +
      detailRow(role === 'expert' ? 'Cliente' : 'Experto', otherPartyName)
    )}
    ${reason ? infoBox(`<strong>Motivo:</strong> ${reason}`, COLORS.warning) : ''}
    <div style="margin:18px 0">
      ${button('Ver mis reservas', `${BASE_URL}/${role === 'expert' ? 'expert' : 'user'}/bookings`)}
    </div>
  `
  return layoutEmail({
    title: 'Reserva cancelada',
    preheader: `La sesión del ${whenStr} fue cancelada.`,
    contentHTML: content,
  })
}

// ─── DISPUTES ──────────────────────────────────────────────────────

export function disputeOpenedTemplate(params: {
  recipientName: string
  bookingDate: string
  reason: string
  role: 'admin' | 'user' | 'expert'
}) {
  const { recipientName, bookingDate, reason, role } = params
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Nueva Disputa Abierta</h2>
    <p style="color:${COLORS.muted}">Hola <strong>${recipientName}</strong>, se ha abierto una disputa para una reserva.</p>
    ${detailTable(
      detailRow('Reserva', bookingDate) +
      detailRow('Motivo', reason)
    )}
    <div style="margin:18px 0">
      ${button('Ver disputa', `${BASE_URL}/${role === 'admin' ? 'admin' : role === 'expert' ? 'expert' : 'user'}/disputes`)}
    </div>
  `
  return layoutEmail({
    title: 'Nueva disputa abierta',
    preheader: `Disputa abierta para la reserva del ${bookingDate}`,
    contentHTML: content,
  })
}

export function disputeResolvedTemplate(params: {
  recipientName: string
  resolution: 'resolved_refunded' | 'resolved_dismissed'
  resolutionNotes: string
  role: 'user' | 'expert'
}) {
  const { recipientName, resolution, resolutionNotes, role } = params
  const statusText = resolution === 'resolved_refunded' ? 'Resuelta con reembolso' : 'Resuelta sin reembolso'
  const statusColor = resolution === 'resolved_refunded' ? COLORS.success : COLORS.warning
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Disputa Resuelta</h2>
    <p style="color:${COLORS.muted}">Hola <strong>${recipientName}</strong>, tu disputa ha sido revisada y resuelta.</p>
    ${infoBox(`<strong>Resolución:</strong> ${statusText}`, statusColor)}
    ${resolutionNotes ? `<p style="color:${COLORS.muted}"><strong>Notas:</strong> ${resolutionNotes}</p>` : ''}
    <div style="margin:18px 0">
      ${button('Ver mis disputas', `${BASE_URL}/${role === 'expert' ? 'expert' : 'user'}/disputes`)}
    </div>
  `
  return layoutEmail({
    title: 'Disputa resuelta',
    preheader: `Tu disputa fue resuelta: ${statusText}`,
    contentHTML: content,
  })
}

// ─── WITHDRAWALS ───────────────────────────────────────────────────

export function withdrawalApprovedTemplate(params: { expertName: string; amount: number; currency: string }) {
  const { expertName, amount, currency } = params
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Retiro Aprobado</h2>
    <p style="color:${COLORS.muted}">Hola <strong>${expertName}</strong>, tu solicitud de retiro ha sido aprobada.</p>
    ${infoBox(`<strong>Monto:</strong> ${amount.toLocaleString('es-CO')} ${currency}`, COLORS.success)}
    <p style="color:${COLORS.muted}">El pago será procesado en las próximas horas.</p>
    <div style="margin:18px 0">
      ${button('Ver mis retiros', `${BASE_URL}/expert/withdrawals`)}
    </div>
  `
  return layoutEmail({
    title: 'Retiro aprobado',
    preheader: `Tu retiro de ${amount} ${currency} fue aprobado.`,
    contentHTML: content,
  })
}

export function withdrawalPaidTemplate(params: { expertName: string; amount: number; currency: string; transactionRef: string }) {
  const { expertName, amount, currency, transactionRef } = params
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Pago Emitido</h2>
    <p style="color:${COLORS.muted}">Hola <strong>${expertName}</strong>, el pago de tu retiro ha sido emitido.</p>
    ${detailTable(
      detailRow('Monto', `${amount.toLocaleString('es-CO')} ${currency}`) +
      detailRow('Referencia', transactionRef)
    )}
    <p style="color:${COLORS.muted}">El dinero debería reflejarse en tu cuenta bancaria según los tiempos de tu entidad financiera.</p>
    <div style="margin:18px 0">
      ${button('Ver mis retiros', `${BASE_URL}/expert/withdrawals`)}
    </div>
  `
  return layoutEmail({
    title: 'Pago emitido',
    preheader: `Pago de ${amount} ${currency} emitido - Ref: ${transactionRef}`,
    contentHTML: content,
  })
}

export function withdrawalRejectedTemplate(params: { expertName: string; amount: number; currency: string; reason?: string }) {
  const { expertName, amount, currency, reason } = params
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Retiro Rechazado</h2>
    <p style="color:${COLORS.muted}">Hola <strong>${expertName}</strong>, tu solicitud de retiro ha sido rechazada.</p>
    ${infoBox(`<strong>Monto solicitado:</strong> ${amount.toLocaleString('es-CO')} ${currency}`, COLORS.error)}
    ${reason ? `<p style="color:${COLORS.muted}"><strong>Motivo:</strong> ${reason}</p>` : ''}
    <p style="color:${COLORS.muted}">Si tienes dudas, contacta al equipo de soporte.</p>
    <div style="margin:18px 0">
      ${button('Ver mis retiros', `${BASE_URL}/expert/withdrawals`)}
    </div>
  `
  return layoutEmail({
    title: 'Retiro rechazado',
    preheader: `Tu retiro de ${amount} ${currency} fue rechazado.`,
    contentHTML: content,
  })
}

// ─── EXPERT VERIFICATION ──────────────────────────────────────────

export function expertVerifiedTemplate(params: { expertName: string }) {
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">¡Perfil Verificado!</h2>
    ${infoBox('<strong>Tu perfil de experto ha sido verificado.</strong>', COLORS.success)}
    <p style="color:${COLORS.muted}">Hola <strong>${params.expertName}</strong>, los clientes verán un sello de verificación en tu perfil, lo cual genera mayor confianza y visibilidad.</p>
    <div style="margin:18px 0">
      ${button('Ver mi perfil', `${BASE_URL}/expert/profile`)}
    </div>
  `
  return layoutEmail({
    title: 'Perfil verificado',
    preheader: '¡Tu perfil de experto ha sido verificado!',
    contentHTML: content,
  })
}

export function expertUnverifiedTemplate(params: { expertName: string }) {
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Verificación Desactivada</h2>
    ${infoBox('<strong>Tu verificación de experto ha sido desactivada por un administrador.</strong>', COLORS.warning)}
    <p style="color:${COLORS.muted}">Hola <strong>${params.expertName}</strong>, si tienes dudas sobre esta decisión, contacta al equipo de soporte.</p>
  `
  return layoutEmail({
    title: 'Verificación desactivada',
    preheader: 'Tu verificación de experto fue desactivada.',
    contentHTML: content,
  })
}

// ─── SUPABASE AUTH TEMPLATES (for custom SMTP) ────────────────────

export function confirmEmailTemplate() {
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Confirma tu correo electrónico</h2>
    <p style="color:${COLORS.muted}">Gracias por registrarte en Lookatfy. Haz clic en el botón para confirmar tu dirección de correo:</p>
    <div style="margin:18px 0">
      <a href="{{ .ConfirmationURL }}" style="
        display:inline-block;
        padding:12px 18px;
        background:${COLORS.primary};
        color:${COLORS.white};
        text-decoration:none;
        border-radius:8px;
        font-weight:600;
      ">Confirmar mi correo</a>
    </div>
    <p style="color:${COLORS.muted};font-size:13px">Si no creaste esta cuenta, puedes ignorar este correo.</p>
  `
  return layoutEmail({
    title: 'Confirma tu correo',
    preheader: 'Confirma tu dirección de correo para activar tu cuenta.',
    contentHTML: content,
  })
}

export function resetPasswordTemplate() {
  const content = `
    <h2 style="margin:0 0 12px 0;font-size:22px">Restablecer Contraseña</h2>
    <p style="color:${COLORS.muted}">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón para crear una nueva:</p>
    <div style="margin:18px 0">
      <a href="{{ .ConfirmationURL }}" style="
        display:inline-block;
        padding:12px 18px;
        background:${COLORS.primary};
        color:${COLORS.white};
        text-decoration:none;
        border-radius:8px;
        font-weight:600;
      ">Restablecer contraseña</a>
    </div>
    <p style="color:${COLORS.muted};font-size:13px">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.</p>
  `
  return layoutEmail({
    title: 'Restablecer contraseña',
    preheader: 'Restablece tu contraseña de Lookatfy.',
    contentHTML: content,
  })
}
