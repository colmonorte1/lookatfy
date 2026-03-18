# Análisis Profesional de Producto — Lookatfy App v1

> **Fecha del análisis:** 17 de marzo de 2026
> **Rama analizada:** `debug`
> **Stack:** Next.js 16 · Supabase · Wompi · Daily.co · Brevo

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura General](#2-arquitectura-general)
3. [Análisis Módulo por Módulo](#3-análisis-módulo-por-módulo)
   - 3.1 Autenticación y Registro
   - 3.2 Marketplace (Expertos y Servicios)
   - 3.3 Checkout y Pagos (Wompi)
   - 3.4 Gestión de Reservas (Usuario)
   - 3.5 Videollamada (Daily.co)
   - 3.6 Dashboard del Experto
   - 3.7 Dashboard del Usuario
   - 3.8 Panel de Administración
   - 3.9 Disputas y Reembolsos
   - 3.10 Retiros y Ganancias
   - 3.11 Notificaciones
   - 3.12 Grabaciones
4. [Flujos que Funcionan Correctamente](#4-flujos-que-funcionan-correctamente)
5. [Flujos con Problemas Lógicos o Incompletos](#5-flujos-con-problemas-lógicos-o-incompletos)
6. [Bugs y Riesgos Técnicos Identificados](#6-bugs-y-riesgos-técnicos-identificados)
7. [Deuda Técnica](#7-deuda-técnica)
8. [Mejoras del Producto](#8-mejoras-del-producto)
9. [Consideraciones de Seguridad](#9-consideraciones-de-seguridad)
10. [Priorización de Trabajo](#10-priorización-de-trabajo)

---

## 1. Resumen Ejecutivo

Lookatfy es una **plataforma de marketplace de consultoría online** que conecta clientes con expertos para sesiones de videollamada. El producto está técnicamente bien construido para su estado actual (MVP avanzado), con integraciones reales de pagos (Wompi), videollamadas (Daily.co), emails (Brevo) y una base de datos sólida (Supabase con RLS).

**Estado general:** El 70% del flujo crítico de negocio está implementado y es funcional. Sin embargo, hay gaps importantes en la transición entre estados del booking, el flujo post-llamada, y la experiencia del experto que deben resolverse antes de escalar.

**Puntuación por área:**

| Área | Estado | Nota |
|------|--------|------|
| Arquitectura de datos | ✅ Sólida | RLS bien configurado, schema coherente |
| Flujo de pago | ✅ Funcional | Wompi integrado correctamente |
| Flujo de booking | ⚠️ Parcial | Confirmación OK, post-llamada incompleto |
| Experiencia usuario | ✅ Aceptable | Interfaz funcional pero mejorable |
| Experiencia experto | ⚠️ Incompleta | Faltan herramientas clave |
| Panel de admin | ✅ Completo | Bien implementado |
| Videollamada | ⚠️ Frágil | Lógica de sala con edge cases peligrosos |
| Seguridad | ✅ / ⚠️ | Buenas bases, algunos gaps importantes |

---

## 2. Arquitectura General

### Fortalezas
- **Separación de datos por RLS** bien implementada: los datos sensibles están protegidos en Supabase y los queries en páginas admin hacen fetches separados para evitar problemas de permisos.
- **Next.js App Router** usado correctamente: server components para datos, client components para interactividad.
- **Webhook seguro de Wompi** con verificación de firma.
- **Patrón de rollback en checkout**: si la creación de la sala falla después de crear el booking, el booking se elimina.
- **Schema de base de datos limpio** con timestamps, soft deletes y migraciones versionadas.

### Debilidades
- **No hay un cron job activo configurado** para expiración de bookings pendientes — existe el endpoint pero no hay orquestador que lo llame.
- **Estilos inline masivos** en vez de clases CSS o un sistema de diseño consistente. Genera archivos de 1000+ líneas difíciles de mantener.
- **Toast duplicado**: el componente `ToastMessage` se reimplementa dentro de `checkout/page.tsx` y `BookingActions.tsx` en lugar de usar el `ToastProvider` global que ya existe.
- **`lib/daily.ts`** contiene solo un placeholder (`createRoom()` está vacío); la lógica real vive en el webhook, lo cual rompe la separación de responsabilidades.

---

## 3. Análisis Módulo por Módulo

---

### 3.1 Autenticación y Registro

**Archivos clave:** `app/(auth)/`, `middleware.ts`, `app/auth/callback/route.ts`

#### Lo que funciona
- Registro diferenciado para clientes y expertos.
- Middleware protege rutas `/user`, `/expert`, `/admin` y redirige según rol.
- Callback OAuth bien manejado.
- Confirmación de email via Supabase.

#### Problemas
- **El experto registrado no puede usar la plataforma inmediatamente.** No hay un flujo de onboarding guiado que le diga al experto qué debe completar (perfil → servicios → disponibilidad) para aparecer en el marketplace.
- **Sin verificación de rol en el callback.** Si un usuario con rol `expert` accede a `/user`, el middleware lo redirige, pero si accede desde un enlace directo no siempre se valida el rol correcto antes de servir la página.
- **`app/debug/auth/page.tsx`** está en producción. Esta página expone información de depuración de auth que no debe ser accesible públicamente.

#### Sugerencias
- Implementar un flujo de onboarding para expertos (wizard de 3 pasos: perfil → primer servicio → disponibilidad).
- Eliminar o proteger la ruta `/debug/auth` en producción.

---

### 3.2 Marketplace (Expertos y Servicios)

**Archivos clave:** `app/(public)/experts/`, `app/(public)/services/`, `components/marketplace/`

#### Lo que funciona
- Listado de expertos con búsqueda y filtros.
- Página de detalle del experto con sus servicios.
- Página de detalle del servicio con selector de fecha/hora y navegación al checkout.
- Caché de disponibilidad (`availabilityCache.ts`).
- Validación de precio en el checkout contra la base de datos (previene manipulación de URL).

#### Problemas
- **No hay paginación real en el listado de expertos.** Si la base de datos crece a 500+ expertos, la página cargará todos de golpe.
- **Los expertos no verificados son visibles** en el marketplace a menos que haya un filtro por `verified = true`. No se encontró esa restricción en el query del listado.
- **La disponibilidad del experto no se verifica en tiempo real** al momento de confirmar la reserva en el checkout — solo se muestra en el selector. Un usuario podría llegar al checkout con un slot ya ocupado por otro usuario.
- **No hay manejo de zonas horarias en la UI del marketplace.** El usuario ve los horarios en la zona horaria del experto sin conversión automática.

#### Sugerencias
- Agregar paginación o infinite scroll al listado de expertos.
- Filtrar expertos por `verified = true` por defecto; opcionalmente mostrar no-verificados con un badge "en revisión".
- Hacer una validación de disponibilidad en el servidor al momento de crear el booking en el checkout.
- Convertir automáticamente los horarios disponibles a la zona horaria del visitante.

---

### 3.3 Checkout y Pagos (Wompi)

**Archivos clave:** `app/checkout/page.tsx`, `app/api/payments/wompi/`, `app/checkout/return/page.tsx`

#### Lo que funciona
- Widget de Wompi integrado correctamente con firma de integridad.
- Sesión de checkout guardada en `sessionStorage` para reapertura del widget sin crear un booking duplicado.
- Rollback automático: si falla algo después de crear el booking, el booking se elimina.
- Validación de precio contra la base de datos (previene manipulación).
- Página de retorno con polling cada 5 segundos cuando el pago está pendiente.
- Soporte para addons de plataforma (servicios opcionales).
- La tarifa de servicio se calcula y muestra antes de pagar.
- Conversión automática de moneda al COP para Wompi.

#### Problemas

**CRÍTICO — Sin verificación de webhook:**
`app/api/payments/wompi/webhook/route.ts` **no verifica la firma del webhook**. Tiene una importación de `verifyWebhookSignature` de `@/lib/wompi` pero **nunca la llama**. Esto significa que cualquier persona que conozca la URL del webhook puede confirmar reservas falsas sin pagar.

```ts
// El código actual (webhook/route.ts línea 2):
import { verifyWebhookSignature } from "@/lib/wompi";
// ↑ Importado pero NUNCA usado
```

**CRÍTICO — El booking se crea ANTES de que el usuario pague:**
El booking se inserta en la base de datos con `status: 'pending'` cuando el usuario hace clic en "Confirmar y Pagar", ANTES de que Wompi confirme el pago. Si el usuario cierra el navegador, el booking queda en pending hasta que expire (20 min). Durante esos 20 minutos, ese slot aparece como "ocupado" para otros usuarios.

**Problema — La tarifa de servicio es un valor hardcodeado:**
`const serviceFee = dbCurrency === "COP" ? 2000 : 2;` — Este valor está en el frontend y no viene de `platform_settings`. Si el admin cambia la tarifa en settings, el checkout no lo refleja.

**Problema — Notas del usuario no se guardan:**
El formulario tiene un campo "Notas Adicionales" pero ese valor (`formData.notes`) nunca se envía al servidor ni se guarda en la base de datos. El experto nunca lo ve.

**Problema — Sin autenticación requerida al cargar la página:**
La página de checkout no redirige al login si el usuario no está autenticado hasta que hace clic en "Confirmar y Pagar". El usuario puede rellenar el formulario entero y descubrir al final que necesita login.

#### Sugerencias
1. **Urgente:** Implementar verificación de firma en el webhook.
2. **Urgente:** Mover la creación del booking al webhook (post-pago), no al pre-pago.
3. Leer la tarifa de servicio desde `platform_settings`.
4. Guardar `notes` en la tabla `bookings`.
5. Verificar autenticación al cargar la página de checkout.

---

### 3.4 Gestión de Reservas (Usuario)

**Archivos clave:** `app/user/bookings/page.tsx`, `components/user/BookingActions.tsx`

#### Lo que funciona
- Listado de reservas por tabs (Programadas, Finalizadas, Canceladas).
- Descarga de archivo `.ics` para agregar al calendario.
- Botón "Unirse ahora" habilitado 1 hora antes.
- Countdown timer dentro de la sesión.
- **Auto-marcado como completado:** cuando el countdown llega a 0, el componente llama a Supabase para marcar el booking como `completed`. Esto funciona, pero solo si la página está abierta.
- Botón de cancelación disponible con más de 20 minutos de antelación.
- Integración con disputas: 24h de ventana para reportar problema.

#### Problemas
- **`completed` depende del cliente:** El status `completed` se marca desde el `BookingActions` en el browser del usuario. Si el usuario no tiene la página abierta cuando termina la sesión, el booking queda como `confirmed` indefinidamente. No hay proceso server-side que lo marque.
- **No hay política de cancelación documentada ni aplicada.** El botón de cancelar aparece con >20 minutos de antelación pero no hay lógica de reembolso — la cancelación solo cambia el status a `cancelled` sin hacer devolución del dinero.
- **Sin paginación** en la lista de reservas — si un usuario tiene 100+ reservas, todo carga de golpe.
- **Sin indicador de precio pagado** en la vista de reservas del usuario.

#### Sugerencias
- Crear un cron job que marque como `completed` las sesiones `confirmed` cuya `start_at + duration` ya pasó.
- Definir y documentar la política de cancelación (ej: 24h antes = reembolso completo; <24h = sin reembolso).
- Mostrar el precio pagado en cada reserva.
- Agregar paginación o límite de 20 reservas por página.

---

### 3.5 Videollamada (Daily.co)

**Archivos clave:** `app/call/page.tsx`, `components/video/VideoCall.tsx`

#### Lo que funciona
- Integración funcional con Daily.co usando el SDK `@daily-co/daily-js`.
- La sala se crea en el webhook cuando el pago es aprobado.
- La URL de la sala se persiste en el booking.
- Verificación de que la sala existe antes de unirse; si no existe, crea una nueva.
- Participante puede unirse con su nombre personalizado.

#### Problemas

**GRAVE — La sala se puede recrear incorrectamente:**
En `app/call/page.tsx` líneas 36-44, si la sala no existe en Daily.co (porque fue borrada o expiró), se crea una **nueva sala** y se actualiza el booking. Esto está bien. Pero **no hay validación de si el usuario tiene permiso para estar en esa sala**. Cualquier usuario autenticado que conozca el `bookingId` puede unirse a la llamada — no solo el cliente y el experto que hicieron la reserva.

**GRAVE — No hay validación de tiempo:**
El código de la llamada no valida si es la hora correcta del booking. Un usuario podría unirse a una llamada 2 días antes o 1 mes después. Solo `BookingActions` controla el acceso 1h antes, pero si el usuario navega directamente a `/call?bookingId=xxx`, no hay restricción.

**Problema — Flujo de llamada sin protección de ruta:**
`/call` no está en `PROTECTED_ROUTES` del middleware. Cualquier persona, autenticada o no, puede acceder a la página de llamada.

**Problema — El campo de URL de sala en el UI:**
En la pantalla de lobby, si hay `roomUrl` en el query, el texto dice "Sala lista. Ingresa tu nombre para unirte." pero si no hay `roomUrl`, dice "Ingresa el enlace de tu sala Daily.co para probar la integración." — Este segundo mensaje es de desarrollo y no debe aparecer en producción.

**Problema — Sin experiencia de sala de espera:**
No hay concepto de "sala de espera" — si el experto aún no se ha unido, el cliente entra y está solo sin notificación.

#### Sugerencias
1. **Urgente:** Validar en el servidor que el `userId` que intenta unirse es el `user_id` o `expert_id` del booking.
2. **Urgente:** Agregar `/call` a las rutas protegidas del middleware.
3. Validar que la hora actual esté dentro de la ventana de la sesión (ej: start_at - 15min hasta start_at + duration + 15min).
4. Implementar una sala de espera con estado de "esperando al experto".
5. Eliminar el texto de desarrollo del lobby.

---

### 3.6 Dashboard del Experto

**Archivos clave:** `app/expert/`, `components/expert/`

#### Lo que funciona
- Gestión de servicios: crear, editar (con imagen), activar/desactivar (soft delete).
- Gestión de disponibilidad semanal y excepciones (días libres).
- Gestión de cuentas bancarias para retiros.
- Módulo de ganancias con KPIs (total, mes actual, por realizar) y desglose de comisión.
- Historial de transacciones con estados.
- Perfil editable.
- Módulo de retiros con estado.

#### Problemas

**Problema — Experto puede ver bookings pendientes que nunca se confirmarán:**
Los bookings `pending` aparecen en "Programadas" del experto. Un experto podría preparar una sesión para un cliente que abandonó el checkout y cuya reserva va a expirar en 20 minutos. Debería haber un indicador claro de "pago pendiente" y tal vez no mostrar estos bookings hasta que se confirmen.

**Problema — Las ganancias se calculan en COP fijo:**
`formatCOP(val)` se usa para todos los valores pero el experto puede tener servicios en USD o EUR. Si un experto cobra en EUR, sus ganancias se muestran como si fueran COP (solo cambia el símbolo). Hay que respetar la moneda original.

**Problema — El experto no tiene acceso a las notas del cliente:**
Las notas adicionales del checkout no se guardan (bug mencionado en sección 3.3), por lo que el experto no puede prepararse.

**Problema — Sin acceso a grabaciones desde el dashboard del experto:**
El usuario tiene `/user/recordings` pero el experto no tiene módulo equivalente para ver las grabaciones de sus sesiones.

**Problema — Sin perfil público del experto accesible desde su dashboard:**
El experto no puede previsualizar cómo se ve su perfil público desde su panel.

#### Sugerencias
- Filtrar bookings `pending` del tab "Programadas" del experto o mostrarlos con badge "Pago pendiente".
- Corregir la visualización de moneda en ganancias.
- Agregar módulo de grabaciones al dashboard del experto.
- Agregar botón "Ver mi perfil público" en el dashboard.

---

### 3.7 Dashboard del Usuario

**Archivos clave:** `app/user/`

#### Lo que funciona
- Página principal con resumen de reservas.
- Perfil editable con foto.
- Lista de reservas con acciones.
- Historial de pagos.
- Grabaciones de sesiones.
- Disputas.
- Notificaciones.

#### Problemas

**Problema — Sin historial de pagos real:**
`/user/payments` existe pero no se verificó si tiene integración con `payment_transactions`. Es probable que muestre solo los bookings, no las transacciones Wompi reales.

**Problema — Sin indicador de perfil incompleto activo:**
`ProfileCompletionAlert.tsx` existe pero no se integra globalmente en el layout de usuario. El usuario puede operar sin tener nombre, teléfono o timezone — lo que puede causar problemas en el checkout.

**Problema — Las grabaciones requieren resolución de URL:**
El módulo de grabaciones necesita hacer polling para esperar a que Daily.co termine de procesar las grabaciones. Si el usuario entra demasiado pronto, ve "procesando" indefinidamente sin timeout ni mensaje de error claro.

#### Sugerencias
- Vincular `/user/payments` con la tabla `payment_transactions`.
- Mostrar la alerta de perfil incompleto en el layout del usuario de forma persistente.
- Agregar timeout y mensaje de error en el módulo de grabaciones.

---

### 3.8 Panel de Administración

**Archivos clave:** `app/admin/`

#### Lo que funciona
- Dashboard con KPIs globales.
- Gestión completa de usuarios (CRUD, activar/desactivar, exportar).
- Gestión de expertos (verificar, bloquear, editar).
- Gestión de servicios de la plataforma.
- Módulo de sesiones con countdown de expiración y acciones rápidas.
- Módulo de pagos con aprobación/rechazo manual.
- Módulo de retiros con aprobación.
- Módulo de disputas con resolución.
- Broadcast de notificaciones.
- Moderación de reseñas.
- Configuración de plataforma (comisión, retiro mínimo).

#### Problemas

**Problema — Doble sistema de aprobación de pagos:**
Existe tanto el webhook de Wompi (aprobación automática) como el módulo de pagos del admin (aprobación manual). No está claro cuál tiene prioridad. Si Wompi ya confirmó el pago automáticamente y el admin lo "rechaza" después, ¿qué pasa? No hay lógica de transición protegida.

**Problema — Sin logs de auditoría:**
Las acciones del admin (rechazar un pago, resolver una disputa, verificar un experto) no generan un log de auditoría con timestamp y quién hizo qué.

**Problema — Sin protección de la ruta `/admin` en middleware:**
El middleware redirige a `/admin` si el rol es `admin`, pero la protección real de que solo admins accedan a `/admin/...` depende de validaciones dentro de cada componente — no hay una guarda centralizada en el middleware para el path `/admin`.

**Problema — Notificaciones broadcast sin targeting granular:**
Solo se puede hacer broadcast a todos los usuarios de un rol. No hay forma de notificar a un usuario específico desde el admin sin crear una notificación individual.

#### Sugerencias
- Definir claramente cuándo se usa la aprobación manual vs. automática (webhook). Proteger las transiciones de estado con máquinas de estado.
- Implementar tabla `admin_audit_logs` para registrar todas las acciones sensibles.
- Agregar validación de rol `admin` directamente en el middleware para el path `/admin/`.
- Agregar opción de notificación a usuario específico en el panel de notificaciones.

---

### 3.9 Disputas y Reembolsos

**Archivos clave:** `app/admin/disputes/`, `app/user/disputes/`, `app/expert/disputes/`

#### Lo que funciona
- Cliente puede abrir disputa desde su reserva dentro de las 24h post-sesión.
- Subida de evidencia (imágenes/PDFs) a storage.
- El experto puede responder a la disputa.
- El admin puede resolver: reembolsar o desestimar.
- Las disputas activas marcan la reserva como "En disputa" en los dashboards.

#### Problemas

**Problema — El reembolso es solo un cambio de status:**
Cuando el admin resuelve una disputa como "reembolsado", solo cambia el `status` de la disputa a `resolved_refunded`. **No hay una integración real con Wompi para procesar el reembolso**. El admin tendría que ir a la consola de Wompi manualmente.

**Problema — Ventana de disputa de 24h calculada en el cliente:**
El cálculo `elapsedMs <= reportWindowMs` en `BookingActions.tsx` se hace con `Date.now()` en el cliente. Un usuario con el reloj del sistema manipulado puede abrir disputas fuera de la ventana. Esto debería validarse en el servidor.

**Problema — No hay notificación al experto cuando se abre una disputa:**
El experto no recibe notificación inmediata cuando un cliente abre una disputa contra él.

#### Sugerencias
- Integrar la API de reembolsos de Wompi al resolver una disputa.
- Mover la validación de la ventana de 24h al servidor.
- Enviar notificación al experto cuando se abre una disputa.

---

### 3.10 Retiros y Ganancias

**Archivos clave:** `app/expert/withdrawals/`, `app/expert/earnings/`, `app/admin/withdrawals/`

#### Lo que funciona
- El experto puede solicitar retiro con snapshot de sus datos bancarios.
- El admin puede aprobar, procesar, o rechazar retiros.
- Las ganancias excluyen disputas y reembolsos de los totales.

#### Problemas

**GRAVE — Sin validación de saldo disponible:**
El experto puede solicitar retiro por cualquier monto sin verificación de que tiene suficiente saldo. No hay un campo de "saldo disponible" calculado como `(ganancias completadas) - (retiros aprobados/pagados)`. Un experto podría solicitar retirar más de lo que tiene.

**Problema — Las ganancias siempre en COP:**
La función `formatCOP` en earnings/page.tsx formatea todo en pesos colombianos. Si la plataforma opera en múltiples monedas (USD/EUR para expertos internacionales), esto es incorrecto.

**Problema — Retiro mínimo viene de settings pero no se valida en frontend:**
El `min_withdrawal` existe en `platform_settings` pero no está claro si se valida en el formulario de solicitud.

#### Sugerencias
- Calcular y mostrar el "saldo disponible para retirar" de forma explícita.
- Agregar validación de `min_withdrawal` y saldo disponible en el formulario de retiro.
- Respetar la moneda del experto en las visualizaciones de ganancias.

---

### 3.11 Notificaciones

**Archivos clave:** `components/notifications/`, `app/api/notifications/`

#### Lo que funciona
- Sistema de notificaciones in-app con estados (unread, read, archived).
- Contador de no leídas.
- Notificaciones de broadcast por rol.
- Notificaciones individuales al confirmar booking.

#### Problemas

**Problema — La tabla `notifications` tiene estructura inconsistente:**
El endpoint `expire-pending/route.ts` intenta insertar con campos `user_id` y `read` (columnas que no existen en el schema). El schema real usa `recipient_user_id` y `status`. Estas notificaciones fallarán silenciosamente.

**Problema — Sin real-time para notificaciones:**
El contador de notificaciones no se actualiza en tiempo real — el usuario necesita recargar la página para ver nuevas notificaciones.

**Problema — Sin notificaciones de recordatorio pre-sesión:**
No hay recordatorio automático antes de la sesión (ej: "Tu sesión es en 1 hora"). El endpoint `/api/reminders/run` existe pero depende de un cron job configurado.

#### Sugerencias
- Corregir el bug del campo de notificaciones en `expire-pending/route.ts`.
- Implementar Supabase Realtime para actualizar el contador en vivo.
- Configurar el cron job de recordatorios.

---

### 3.12 Grabaciones

**Archivos clave:** `app/user/recordings/`, `app/api/recordings/`

#### Lo que funciona
- Las grabaciones de cloud de Daily.co se almacenan con referencia en la tabla `recordings`.
- Polling para esperar que Daily.co procese la grabación.
- Grid de grabaciones en el dashboard del usuario.

#### Problemas

**Problema — Sin acceso para el experto:**
El experto no tiene acceso a las grabaciones de sus sesiones.

**Problema — Sin consentimiento explícito de grabación:**
No hay un aviso o consentimiento en el flujo de la videollamada sobre que la sesión está siendo grabada. Esto puede ser un problema legal (GDPR, Ley 1581 en Colombia).

**Problema — Sin límite de almacenamiento:**
Las grabaciones de Daily.co en cloud tienen costos. No hay lógica de expiración o límite.

#### Sugerencias
- Dar acceso a grabaciones también al experto.
- Agregar aviso de "Esta sesión está siendo grabada" al inicio de la videollamada.
- Implementar política de retención de grabaciones (ej: eliminar después de 30 días).

---

## 4. Flujos que Funcionan Correctamente

Estos flujos están completos y su lógica es coherente end-to-end:

1. **Pago con Wompi → Confirmación de booking:**
   Usuario paga → Webhook recibe evento → Verifica referencia → Crea sala Daily.co → Actualiza booking a `confirmed` → Envía email y notificación. ✅

2. **Creación de servicio por experto:**
   Experto crea servicio con imagen → Se guarda en `services` → Aparece en marketplace si el experto está verificado. ✅

3. **Disponibilidad de experto:**
   Experto define horarios semanales y excepciones → Sistema calcula slots disponibles con timezone → Se muestran al usuario al seleccionar fecha. ✅

4. **Panel de admin — Gestión de usuarios:**
   CRUD completo, bulk actions, filtros, exportación. ✅

5. **Sistema de disputas — Apertura:**
   Cliente abre disputa → Sube evidencia → Experto ve disputa en su tab "Problemáticas" → Admin revisa. ✅

6. **Cancelación de reserva con >20 minutos:**
   Usuario cancela → Status cambia a `cancelled` → Reserva desaparece de activas. ✅

7. **Flujo de registro y verificación de email:**
   Registro → Email de verificación → Callback → Perfil creado con rol correcto. ✅

8. **Generación de archivo .ics:**
   Usuario descarga archivo de calendario con los datos correctos de la sesión. ✅

---

## 5. Flujos con Problemas Lógicos o Incompletos

Estos flujos existen en el código pero tienen gaps que pueden causar comportamiento incorrecto o inesperado:

### 5.1 Expiración de Bookings Pendientes — INCOMPLETO
**Lo que existe:** Endpoint `POST /api/bookings/expire-pending` que cancela bookings expirados.
**El problema:** No hay ningún orquestador (cron job, Supabase scheduled function, Vercel cron) que llame a este endpoint cada 5 minutos. Los bookings pendientes **nunca expiran** a menos que alguien llame al endpoint manualmente. Los slots quedan bloqueados por 20 minutos pero no se liberan.

### 5.2 Marcado de Sesión como Completada — INCOMPLETO
**Lo que existe:** `BookingActions.tsx` usa un countdown que, cuando llega a 0, hace `update { status: 'completed' }` desde el cliente.
**El problema:** Si el usuario no tiene la página abierta, o si cierra el navegador durante la sesión, el booking nunca pasa a `completed`. La lógica server-side no existe. El experto tampoco puede marcarla como completada manualmente.

### 5.3 Reembolsos en Disputas — INCOMPLETO
**Lo que existe:** Admin puede resolver disputas como `resolved_refunded`.
**El problema:** Esto solo cambia un campo en la base de datos. No hay llamada a la API de Wompi para procesar el reembolso real. El dinero **no se devuelve al cliente automáticamente**.

### 5.4 Política de Cancelación — SIN IMPLEMENTAR
**Lo que existe:** Botón de cancelar en bookings activos.
**El problema:** La cancelación solo cambia el status. No hay lógica de:
- ¿Se reembolsa el dinero?
- ¿Cuánto tiempo antes se puede cancelar sin penalización?
- ¿Se notifica al experto?
- ¿Se libera el slot en el calendario?

### 5.5 Flujo de Videollamada — PARCIALMENTE SEGURO
**Lo que existe:** Página de llamada que usa el `bookingId` para obtener la URL.
**El problema:** Cualquier usuario autenticado puede acceder a `/call?bookingId=X` aunque no sea el cliente ni el experto del booking. No hay guard de autorización.

### 5.6 Tarifa de Servicio en Checkout — DESINCRONIZADA
**Lo que existe:** La tarifa de servicio se muestra en el UI del checkout.
**El problema:** El valor está hardcodeado en el frontend (`COP: 2000 / otros: 2`) y no se lee de `platform_settings`. Si el admin cambia la tarifa, el checkout no lo refleja.

### 5.7 Recordatorios por Email — CONFIGURADO PERO NO ACTIVO
**Lo que existe:** Endpoint `/api/reminders/run` y templates de email para recordatorios.
**El problema:** No hay cron job que ejecute los recordatorios. Los usuarios no reciben recordatorio de sesión.

---

## 6. Bugs y Riesgos Técnicos Identificados

| Severidad | Módulo | Bug |
|-----------|--------|-----|
| 🔴 CRÍTICO | Webhook Wompi | `verifyWebhookSignature` importado pero **nunca llamado**. Cualquiera puede confirmar una reserva falsa. |
| 🔴 CRÍTICO | Videollamada | Sin validación de autorización — cualquier usuario puede entrar a una llamada ajena. |
| 🟠 ALTO | Checkout | Las notas del cliente (`formData.notes`) se capturan en UI pero **no se guardan** en la DB. |
| 🟠 ALTO | Expiración | El cron de expiración de bookings **no está activo** — los slots no se liberan automáticamente. |
| 🟠 ALTO | Disputas | El "reembolso" solo es un cambio de status — **no procesa el dinero real**. |
| 🟡 MEDIO | Notificaciones | `expire-pending` inserta con campos incorrectos (`user_id`, `read`) que no existen en el schema. |
| 🟡 MEDIO | Ganancias | Todos los valores financieros formatean como COP independientemente de la moneda del servicio. |
| 🟡 MEDIO | Retiros | Sin validación de saldo disponible — el experto puede pedir más de lo que tiene. |
| 🟡 MEDIO | Completado | El status `completed` solo se marca si el usuario tiene el browser abierto. |
| 🟡 MEDIO | Debug | La ruta `/debug/auth` está accesible en producción. |
| 🟢 BAJO | Checkout | Mensaje "probar la integración" visible si no hay roomUrl — es texto de desarrollo. |
| 🟢 BAJO | UI | Toast duplicado en 2+ archivos en lugar de usar el `ToastProvider` global. |
| 🟢 BAJO | Seguridad | La ruta `/call` no está en las rutas protegidas del middleware. |

---

## 7. Deuda Técnica

### Estilos
- **Prácticamente todo el CSS está en `style={{ }}`** inline dentro de los componentes. Esto hace imposible mantener consistencia visual, hace difícil el theming, y aumenta el bundle size. Hay que migrar gradualmente a clases CSS o Tailwind.
- Algunos estilos responsivos están con `<style>` tags dentro de los componentes en vez de media queries o CSS modules.

### Código duplicado
- `ToastMessage` implementado de forma independiente en `checkout/page.tsx` y `BookingActions.tsx`, ignorando el `ToastProvider` global.
- Lógica de formateo de precios duplicada en múltiples archivos.
- Los queries de "fetch bookings + enrich con profiles/services" se repiten en varios módulos.

### Librerías infrautilizadas
- `lib/daily.ts` tiene la función `createRoom()` como placeholder vacío; la lógica real está copiada en 2 lugares distintos (webhook + call page).
- `data/experts.ts` contiene mock data (`EXPERTS` array) que sugiere que antes se usaba data fake — revisar si todavía se usa en algún lugar.

### TypeScript
- Varios `as any` en el codebase que evitan errores de tipado pero pueden ocultar bugs reales.
- Algunos tipos genéricos de Supabase no están bien tipados (se usa `any` en vez de tipos generados).

---

## 8. Mejoras del Producto

### A. Experiencia del Usuario (Quick wins)

1. **Conversión de zona horaria automática en el marketplace:**
   Mostrar los horarios del experto convertidos a la zona horaria del visitante reduce la fricción al agendar.

2. **Página de confirmación mejorada post-pago:**
   La página de `return` es funcional pero genérica. Mostrar: nombre del experto, fecha/hora en la zona horaria del usuario, botón para agregar al calendario, y número de confirmación.

3. **Perfil del experto más rico:**
   Agregar: video de presentación corto, portafolio/trabajos anteriores, certificaciones, idiomas con bandera visual, y reseñas con avatares.

4. **Notificación de recordatorio:**
   "Tu sesión con [Experto] es en 1 hora" — ya existe la infraestructura, solo falta el cron.

5. **Historial de sesiones con resumen:**
   Post-sesión, generar un resumen automático con: fecha, duración, experto, precio pagado, enlace a grabación.

### B. Experiencia del Experto

6. **Onboarding guiado:**
   Wizard paso a paso: completar perfil → crear primer servicio → configurar disponibilidad → apareces en el marketplace.

7. **Calendario visual de disponibilidad:**
   En vez de toggles de días/horas, un calendario tipo Google Calendar donde el experto puede arrastrar para definir bloques disponibles.

8. **Vista previa del perfil público:**
   Botón "Ver mi perfil como cliente lo ve" desde el dashboard del experto.

9. **Estadísticas de performance:**
   Rating promedio, tasa de cancelación, ingresos por mes (gráfica), número de clientes recurrentes.

10. **Notas del cliente antes de la sesión:**
    El experto recibe las notas adicionales que el cliente escribió al reservar.

### C. Monetización y Negocio

11. **Precios variables por horario:**
    Permitir que el experto defina precios distintos para diferentes horarios (ej: precio premium para horario nocturno).

12. **Paquetes de sesiones:**
    Permitir al cliente comprar 3 o 5 sesiones con descuento, con créditos que puede usar gradualmente.

13. **Sistema de suscripción para expertos:**
    Cobrar una membresía mensual a los expertos a cambio de una comisión reducida.

14. **Códigos de descuento/cupones:**
    Sistema de cupones para promover el marketplace o dar descuentos a clientes recurrentes.

15. **Comisión dinámica por categoría:**
    Diferentes tasas de comisión según la categoría del servicio.

### D. Operaciones y Seguridad

16. **Rate limiting en checkout:**
    Limitar la cantidad de bookings que un usuario puede crear en un período corto para prevenir abusos.

17. **Dashboard de health del sistema:**
    Una página en `/admin/health` que muestre: bookings expirados sin procesar, pagos pendientes >30 min, errores recientes de webhook.

18. **Auditoría completa:**
    Tabla `admin_audit_logs` para registrar todas las acciones sensibles del admin.

19. **Reembolsos automáticos vía Wompi API:**
    Integrar el endpoint de reversa/reembolso de Wompi para que las disputas resueltas a favor del cliente procesen el reembolso automáticamente.

20. **Verificación de identidad para expertos:**
    Integrar un servicio básico de verificación de identidad (selfie + documento) antes de activar un perfil de experto.

---

## 9. Consideraciones de Seguridad

### Críticas (resolver antes de producción)

1. **Verificar firma del webhook de Wompi** — ya existe la función, solo hay que llamarla.
2. **Autorización en la sala de videollamada** — verificar server-side que el usuario tiene permiso.
3. **Ventana de disputa de 24h** — mover la validación al servidor.

### Importantes

4. **Variables de entorno:** Asegurarse de que `WOMPI_INTEGRITY_SECRET`, `WOMPI_WEBHOOK_SECRET`, `DAILY_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` nunca estén en el repositorio ni en logs.
5. **La ruta de debug `/debug/auth`** debe eliminarse o protegerse con una guarda de admin.
6. **CSP (Content Security Policy):** El widget de Wompi requiere `script-src` permisivo — revisar la configuración de Next.js para minimizar el vector de XSS.
7. **RLS en `payment_transactions`:** La tabla permite al `service_role` insertar/actualizar — asegurarse de que ningún cliente pueda llamar directamente a esas rutas con sus propias credenciales.

### Buenas prácticas aplicadas (mantener)
- ✅ Validación de precio contra DB en checkout.
- ✅ `createServerClient` con service role solo en rutas API protegidas.
- ✅ RLS en todas las tablas.
- ✅ Supabase Auth con sesiones en cookies httpOnly.
- ✅ Rollback de booking si falla el setup de pago.

---

## 10. Priorización de Trabajo

### 🔴 Prioridad 1 — Urgente (antes de escalar)

| # | Tarea | Impacto |
|---|-------|---------|
| 1 | Activar verificación de firma en webhook de Wompi | Seguridad crítica |
| 2 | Agregar autorización a la ruta `/call` | Seguridad crítica |
| 3 | Configurar cron job para expiración de bookings | Operacional crítico |
| 4 | Crear proceso server-side para marcar sesiones como `completed` | Lógica de negocio |
| 5 | Guardar notas del cliente en la DB | Experiencia experto |

### 🟠 Prioridad 2 — Importante (próximo sprint)

| # | Tarea | Impacto |
|---|-------|---------|
| 6 | Integrar reembolsos reales con API de Wompi | Confianza del usuario |
| 7 | Leer tarifa de servicio desde `platform_settings` | Consistencia de negocio |
| 8 | Corrección de campos en notificaciones de `expire-pending` | Estabilidad |
| 9 | Onboarding guiado para expertos | Activación de expertos |
| 10 | Agregar módulo de grabaciones al dashboard del experto | Equidad entre roles |

### 🟡 Prioridad 3 — Mejoras (roadmap)

| # | Tarea | Impacto |
|---|-------|---------|
| 11 | Activar recordatorios por email (cron job) | Retención de usuarios |
| 12 | Convertir zona horaria en marketplace | Reducción de fricción |
| 13 | Paginación en listas de reservas y usuarios | Performance |
| 14 | Política de cancelación con reembolsos | Trust |
| 15 | Migrar estilos inline a sistema CSS | Mantenibilidad |
| 16 | Eliminar `/debug/auth` de producción | Seguridad menor |
| 17 | Unificar Toast en proveedor global | Calidad de código |
| 18 | Tabla de auditoría para acciones del admin | Operaciones |
| 19 | Validación de saldo disponible en retiros | Integridad financiera |
| 20 | Aviso de grabación en la videollamada | Cumplimiento legal |

---

*Análisis generado el 17-03-2026 — revisar trimestralmente o ante cambios mayores de arquitectura.*
