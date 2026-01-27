## Objetivos
- Unificar cómo el sistema avisa acciones relevantes a clientes, expertos y admin.
- Soportar notificaciones en-app, email y (fase 3) push, con preferencias por usuario/rol.
- Garantizar entrega confiable (reintentos, idempotencia), trazabilidad y cumplimiento.

## Alcance y Roles
- Roles: client, expert, admin.
- Módulos que notifican: bookings/reservas, videollamadas (Daily), pagos/retiros, reviews, disputes, cuentas/seguridad.

## Canales
- En-app: centro de notificaciones y badge en el header.
- Email: proveedor recomendado Resend (Vercel-friendly) o SMTP.
- Push (web/app): fase posterior con FCM o Web Push (VAPID).

## Tipos de Eventos
- Bookings: creada, confirmada, cancelada, reprogramada, recordatorio 24h/1h.
- Videollamada: sala creada, enlace, “está por comenzar”, no-show.
- Pagos: realizado, fallido, reembolso; Retiros: solicitado, aprobado, desembolsado.
- Disputas: abierta, evidencias añadidas, resuelta.
- Reviews: nueva reseña, respuesta requerida.
- Cuenta: email cambiado, password reset, verificación, cambios de perfil.

## Arquitectura
- Patrón Outbox en Postgres (Supabase): tabla events para publicar eventos de dominio.
- Notification Orchestrator (Next.js server): job/handler que consume events y genera mensajes por canal.
- Enrutamiento por reglas: mapea event.type → destinatarios, plantilla y canal según preferencias.
- Realtime en-app: inserción en notifications + broadcast via Supabase Realtime.
- Procesamiento asíncrono: Vercel Cron (o job runner) que drena el outbox con backoff.

## Modelo de Datos (Postgres)
- notifications: id, user_id, role, type, title, body, data(jsonb), status(unread|read), delivered_channels(jsonb), created_at, expires_at, dedup_key.
- notification_preferences: user_id, role, channel_flags (in_app/email/push), per_event(jsonb), quiet_hours, digest(freq).
- outbox_events: id, type, payload(jsonb), aggregate_id, created_at, processed_at, attempts.
- email_templates: type, locale, subject, body/slug (si usamos React Email, se referencian archivos).
- audit_notification_logs: canal, request_id, response_code, latency, error.

## Preferencias y Opt‑in
- UI por rol para toggles por canal y tipo de evento.
- Quiet hours (no email/push de 22:00–07:00, salvo urgentes).
- Digest: agrupar eventos en resumen diario/semanal.

## Plantillas y Localización
- React Email + Resend para emails transaccionales con i18n (es/en).
- En-app: componentes con títulos y descripciones coherentes; links deep‑link.
- Variables comunes (nombres, horarios, enlaces a sala Daily, ID reserva).

## Entrega, Reintentos e Idempotencia
- Envío por canal con backoff exponencial (p.ej. 3 intentos).
- dedup_key para evitar duplicados por re-procesos.
- Rate limit por usuario para evitar spam.

## En‑App en Tiempo Real
- Componentes: NotificationBell, NotificationList, MarkAsRead, PreferencesForm.
- Suscripción por user_id a tabla notifications vía Supabase Realtime.
- Paginación, filtros, “marcar todas como leídas”.

## Panel de Administración
- Dashboard de notificaciones: métricas por canal, colas, fallos, últimos eventos.
- Config global: activar/desactivar tipos, plantilla por defecto, ventana quiet hours.
- Reenvío manual y vista de auditoría.

## Seguridad y Cumplimiento
- Respeto RLS: sólo el destinatario ve su notificación.
- Unsubscribe granular en email; políticas GDPR (retención y borrado).
- No exponer datos sensibles en payloads; cifrar si aplica.

## Observabilidad
- Logs estructurados por canal; trazas con request_id.
- Métricas: entregas, fallos, latencia, open rate (email), clics.

## Roadmap por Fases
- Fase 1: En‑app + Outbox básico; preferencias por canal; eventos de bookings y cuenta; React Email para “password reset” propio si aplica.
- Fase 2: Email completo (Resend/SMTP), digest, recordatorios; panel admin y métricas.
- Fase 3: Push (web/app), quiet hours avanzadas, rate limiting y reglas por severidad.

## Integraciones en el Código
- Puntos de emisión de eventos: acciones de booking, pagos/retiros, disputas, reviews, cambios de perfil.
- Job de orquestación: route/cron en Next que procesa outbox → notifications + email.
- UI: header común con NotificationBell en user/expert/admin; páginas de preferencias por rol.

## Validación
- Tests de mapeo event→mensaje; pruebas de idempotencia y reintentos.
- Entornos de prueba con Supabase y Resend sandbox.

Jota, este plan nos da una base sólida, escalable y sin sorpresas. ¿Lo aprobamos y paso a la implementación por Fase 1?