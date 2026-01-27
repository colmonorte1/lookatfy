Jota, aquí tienes un plan claro y ejecutable para incorporar zonas horarias en la plataforma, contemplando su impacto en expertos y en el agendamiento. ¿Lo confirmamos para implementarlo?

## Objetivos
- Mostrar y operar horarios respetando la zona horaria del experto y del usuario.
- Guardar reservas en UTC de forma consistente y auditable.
- Evitar desfaces por DST (horario de verano) y offsets no enteros (ej. UTC+5:30).

## Impacto en Expertos y Usuarios
- Expertos: definen su horario base en su zona (IANA, ej. "America/Bogota"), visualizan su agenda en esa zona, y la disponibilidad se calcula desde su zona. Perfil necesita campo timezone.
- Usuarios: el calendario y los slots se muestran en su zona local (detectada o elegida), con confirmación clara de hora del experto y hora del usuario.
- Reservas: se almacenan en UTC, incluyendo metadatos de timezone del experto y del usuario para auditoría y notificaciones.

## Modelo de Datos (Postgres/Supabase)
- Tabla experts: añadir columna timezone TEXT (IANA tz). Referencia: [schema.sql](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/supabase/schema.sql).
- Tabla bookings:
  - Añadir columna start_at TIMESTAMPTZ (UTC) y deprecate/retirar DATE/TIME separados cuando cierre la migración. Referencia actual: [schema.sql:L62-L75](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/supabase/schema.sql#L62-L75).
  - Añadir columnas expert_timezone TEXT y user_timezone TEXT (IANA) para trazabilidad.
  - Mantener duration_minutes INT.

## Librería y Utilidades de Tiempo
- Adoptar date-fns + date-fns-tz para conversiones IANA, footprint pequeño y tree-shaking. No usamos moment/luxon actualmente. Confirmado en [package.json](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/package.json).
- Crear util común: utils/timezone.ts con funciones:
  - toUTC(dateInTZ, tz): Date en UTC.
  - fromUTC(utcDate, tz): Date en tz destino.
  - formatInTZ(utcDate, tz, pattern): salida amigable.
  - helpers para slots y manejo DST.

## Backend: Cálculo de Disponibilidad y Reservas
- Horarios del experto: 
  - Persistir franjas semanales en zona del experto.
  - Al generar slots, convertir esos bloques (en tz del experto) a instantes UTC para comparar y publicar. Referencia cálculo actual: [actions.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/services/actions.ts).
- Disponibilidad mensual:
  - Generar rango de días en UTC y proyectar a tz del experto al crear slots.
  - Evitar toISOString().split('T')[0] en zonas no-UTC. Ver nota actual en [actions.ts:L23-L31](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/services/actions.ts#L23-L31).
- Creación de reserva:
  - En checkout, construir start_at en UTC a partir de selección del usuario + su tz, y almacenar expert_timezone y user_timezone. Ver flujo actual: [BookingCalendar.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/ui/Calendar/BookingCalendar.tsx), [checkout/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/checkout/page.tsx#L119-L129).
- Join/acciones de booking:
  - Calcular ventana de inicio y fin usando start_at UTC + duration, renderizando para cada vista en la tz adecuada. Referencia: [BookingActions.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/user/BookingActions.tsx).

## Frontend: UI/UX
- Perfil del experto: selector IANA (con búsqueda) y guardado. Referencia: [ProfileForm.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/expert/profile/ProfileForm.tsx) y [expert/schedule/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/expert/schedule/page.tsx).
- Calendario del usuario:
  - Detectar tz del usuario (Intl) y permitir cambiarla.
  - Mostrar slots en tz del usuario, con tooltip de la hora del experto.
  - Evitar construir YYYY-MM-DD desde toISOString directamente; usar formatInTZ.
  - Referencia componente: [BookingCalendar.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/ui/Calendar/BookingCalendar.tsx).
- Confirmación y recibos:
  - Mostrar ambas horas: "Tu hora" y "Hora del experto".

## API/Contratos
- GET /availability?expertId&month&tzUsuario → devuelve slots listos para UI (en tz usuario) + metadatos.
- POST /bookings { expertId, slotLocal, userTimezone } → server traduce a UTC y persiste start_at.
- Campos comunes devuelven siempre UTC en payloads, con opción de renderizado en tz cliente.

## Notificaciones y ICS
- Emails y notificaciones: incluir hora local del usuario y del experto.
- Adjuntar ICS con VTIMEZONE correcto (IANA) para compatibilidad con Google/Outlook.

## Migración de Datos
- Backfill start_at para reservas existentes:
  - Inferir timezone del experto a partir de city/country (si existe) o pedir confirmación manual.
  - Convertir (DATE+TIME, tz experto) → start_at UTC.
- Marcar deprecated los campos DATE/TIME y remover en fase final.

## Pruebas
- Unit tests de conversiones (DST start/end, offsets +30/+45 minutos, cruce de medianoche).
- E2E: creación de reservas desde usuario en tz distinta al experto.
- Ensayos de edge cases: reserva 23:30 con duración 60 min cruza día.

## Performance
- Precomputar y cachear slots de 30 días por experto en servidor, invalidar al cambiar horario o excepciones.
- Evitar conversión por slot en cliente; traer slots ya formateados.

## Seguridad y Claridad
- No almacenar secretos en logs ni exponer tz via query sin validación.
- Mostrar explícitamente ambas horas en UI para evitar confusiones.

## Fases de Implementación
1) Fundamentos (DB + utilidades + perfil experto):
- Añadir columnas y utilidades timezone.
- Guardar timezone del experto y ajustar schedule.
- Actualizar cálculo de disponibilidad en servidor.

2) Reserva y UI:
- Actualizar calendario para usar tz del usuario.
- Crear start_at UTC al reservar; almacenar metadatos tz.
- Actualizar dashboards y acciones de booking.

3) Notificaciones + ICS + Migración:
- Enviar emails con hora doble y adjuntos ICS.
- Migrar datos existentes y retirar campos antiguos.
- Cacheo de slots y optimizaciones.

Referencias clave del código actual:
- Calendario y slots: [BookingCalendar.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/ui/Calendar/BookingCalendar.tsx), [actions.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/services/actions.ts).
- Horario del experto: [expert/schedule/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/expert/schedule/page.tsx).
- Reservas y checkout: [checkout/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/checkout/page.tsx).
- Esquema DB: [schema.sql](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/supabase/schema.sql).

Si te gusta este enfoque, lo implementamos por fases para minimizar riesgo y asegurar una UX impecable.