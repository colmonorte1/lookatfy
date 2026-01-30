## Objetivo
- Implementar notificaciones por email confiables para usuarios (client), expertos (expert) y administradores (admin) usando Brevo.
- Integrar con el sistema de notificaciones in‑app ya existente y mantener trazabilidad, reintentos y buenas prácticas.

## Arquitectura
- Orquestación en Next.js (App Router): envío transaccional desde rutas/acciones de servidor.
- Fase 1 (rápida): envío inmediato en los puntos clave (reservas y notificaciones) + log básico.
- Fase 2 (robusta): patrón Outbox en Postgres + job/cron que drena cola y gestiona reintentos/backoff.
- Realtime in‑app intacto: se mantiene la tabla notifications y su suscripción.

## Proveedor: Brevo
- Paquete: @getbrevo/brevo.
- Configuración: BREVO_API_KEY (server‑only), BREVO_SENDER_EMAIL, BREVO_SENDER_NAME.
- Utilidad de envío: lib/email/brevo.ts con funciones sendEmail(payload) y soporte de adjuntos (base64), categoría transaccional.

## Modelo de Datos (SQL)
- email_outbox (Fase 2): id, to, subject, html, text, attachments(jsonb), template_type, dedup_key, status(pending/sent/failed), attempts, last_attempt_at, notification_id/event_id, created_at.
- audit_email_logs: canal=email, request_id, response_code, error, latency, created_at.
- Opcional (Fase 2/3): notification_preferences por usuario/rol (flags canal, quiet hours, per_event).
- Mantener notifications actual: [schema.sql](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/supabase/schema.sql#L348-L394).

## Eventos y Destinatarios (Inicial)
- Usuarios: booking_confirmed, booking_reminder_24h/1h, dispute_update.
- Expertos: new_booking_assigned, booking_reminder, payout_notice.
- Admin: dispute_opened, withdrawal_requested, admin_announcement.
- Mapeo evento→plantilla→destinatarios:
  - recipient_user_id directo: buscar email en profiles.
  - target_role broadcast: listar perfiles por rol y enviar one‑to‑many.

## Plantillas
- Base en HTML simple + texto plano, localización ES (inicial) y soporte variables comunes: nombres, horarios, enlaces (Daily), ID de reserva.
- Adjuntos: .ics para reservas (archivo generado por [buildICS](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/utils/ics.ts)).

## Integración en Código
- Utilidad Brevo: lib/email/brevo.ts.
- Reservas:
  - Actualizar [bookings/[id]/email/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/bookings/%5Bid%5D/email/route.ts) para enviar realmente el email al usuario con .ics.
- Notificaciones in‑app:
  - En [api/notifications/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/notifications/route.ts) y [api/notifications/booking/route.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/api/notifications/booking/route.ts): tras insertar filas en notifications, disparar sendEmail según tipo/rol.
  - Broadcast admin (target_role='admin') soportado: enviar a todos los admin.
- Config central de tipos email‑habilitados: p.ej. EMAIL_ENABLED_TYPES en server code para controlar qué eventos salen por email.

## Entrega y Fiabilidad
- Fase 1: envío síncrono + log mínimo (response ID de Brevo) y manejo de errores (try/catch con NextResponse 500 y registro).
- Fase 2: Outbox + reintentos (máx. 3, backoff exponencial), dedup_key para evitar duplicados, rate limit básico por destinatario.

## Seguridad y Cumplimiento
- Claves fuera del cliente; nunca exponer BREVO_API_KEY.
- Emails transaccionales (no marketing); agregar footer con motivo del email y enlace a ajustes cuando tengamos preferencias.
- RLS sin cambios: el email toma datos de profiles/booking ya autorizados.

## Observabilidad
- Logs estructurados (audit_email_logs) con request_id/respuesta.
- Métricas básicas en panel admin: entregas/fallos/latencia (Fase 2).

## Pruebas y Verificación
- Unit: formateo de payload y adjuntos .ics.
- E2E (dev): usar ruta de reservas para generar un email y validar entrega.
- Simular broadcast por rol y verificar que cada destinatario recibe su email.

## Roadmap
- Fase 1 (hoy):
  - Instalar @getbrevo/brevo y crear lib/email/brevo.ts.
  - Enviar email real en bookings/[id]/email.
  - Enviar email al crear notifications (directo y broadcast admin/expert/client) para tipos habilitados.
- Fase 2:
  - Crear email_outbox y audit_email_logs (SQL + políticas mínimas).
  - Job/cron de drenaje en Next (Vercel Cron o similar) con reintentos.
  - Preferencias por usuario/rol y digest.

Jota, lo hacemos por Fase 1 para tener valor inmediato y dejamos la cola (Outbox) para reforzar fiabilidad en Fase 2. Te va así? 😊