## Objetivos
- Notificaciones solo dentro del sistema (sin email) para usuario (client), experto (expert) y administrador (admin).
- Soportar: creación de eventos, visualización (campana + inbox), lectura/marcado, y tiempo real.
- Respetar permisos y RLS de Supabase; integrarse con Next.js App Router.

## Modelo de Datos (Supabase)
- Tabla: notifications
  - id (uuid, pk)
  - recipient_user_id (uuid, nullable) → notificación directa
  - target_role (text, nullable, CHECK in ('client','expert','admin')) → broadcast por rol
  - type (text, CHECK, p.ej.: 'booking_created','booking_canceled','dispute_opened','admin_announcement')
  - title (text) y body (text)
  - data (jsonb) → metadata (booking_id, etc.)
  - status (text, CHECK in ('unread','read','archived'))
  - created_by (uuid, nullable) → actor/autor
  - created_at (timestamptz, default now())
- Índices: por recipient_user_id + status, por target_role + created_at.
- Función SQL: get_current_role() → devuelve role desde profiles para auth.uid().

## Políticas RLS
- SELECT:
  - Directa: auth.uid() = recipient_user_id.
  - Broadcast por rol: target_role = get_current_role().
- INSERT:
  - Usuario/Experto: permitir solo para eventos propios si aplica; en general, creación de sistema vía rutas protegidas.
  - Admin broadcast: solo profiles.role = 'admin'.
- UPDATE (cambiar status a read/archived): solo dueño (recipient_user_id = auth.uid()).

## API (Next.js App Router)
- Crear rutas en app/api/notifications:
  - POST /api/notifications → crear (directa o broadcast). Valida rol (admin para broadcast). Usa Supabase server: [server.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/utils/supabase/server.ts).
  - GET /api/notifications → listar de la sesión actual con filtros (status, paginación).
  - PATCH /api/notifications/[id]/read → marcar como leída.
  - PATCH /api/notifications/[id]/archive → archivar.
  - GET /api/notifications/count → conteo de no leídas.

## Tiempo Real (Supabase Realtime)
- Suscripción en cliente a cambios en la tabla notifications para el usuario actual.
- Entrega respetando RLS: solo recibe filas permitidas (directas o por rol).
- Integración con supabase-js cliente: [client.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/utils/supabase/client.ts).

## UI
- Campana del header: reutilizar [DashboardHeader.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/layout/DashboardHeader.tsx).
  - Mostrar badge con conteo de no leídas.
  - Dropdown/Panel con últimas notificaciones (marcar como leídas al abrir si deseado).
- Inbox dedicado por rol:
  - /user/notifications, /expert/notifications, /admin/notifications.
  - Lista con filtros (Todas/No leídas/Archivadas), acciones rápidas.
- Toasts in-app opcionales (sin dependencias): pequeño provider con CSS Modules para avisos efímeros al recibir una inserción realtime.

## Tipos de Evento Iniciales
- Usuario (client):
  - booking_created, booking_confirmed, booking_canceled, dispute_update.
- Experto (expert):
  - new_booking_assigned, booking_paid, booking_canceled, dispute_opened.
- Administrador (admin):
  - dispute_opened, withdrawal_requested, expert_verification_submitted, admin_announcement (broadcast).

## Seguridad y Permisos
- Validar sesión y role en rutas API (server actions) siguiendo patrones actuales: [admin/actions.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/actions.ts) y políticas en SQL.
- No exponer claves; usar Service Role solo en operaciones admin/broadcast desde servidor.

## Rendimiento y Mantenimiento
- Paginación (limit/offset) en GET.
- Archivar/limpiar notificaciones viejas con job futuro (opcional).

## Integraciones en Código Existente
- Header: conectar badge y dropdown: [DashboardHeader.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/layout/DashboardHeader.tsx).
- Acciones que disparan notificaciones:
  - Bookings: en rutas y acciones de reservas existentes: [app/checkout/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/checkout/page.tsx), [bookings APIs varias].
  - Disputas: [app/admin/disputes/actions.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/disputes/actions.ts).
  - Withdrawals/Verificaciones: [app/admin/withdrawals/actions.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/withdrawals/actions.ts), [app/admin/services/adminActions.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/services/adminActions.ts).

## Pruebas y Verificación
- Semillas mínimas: crear 3 notificaciones de ejemplo (una por cada rol).
- Test manual:
  - Ver conteo/badge y dropdown en header.
  - Marcar leídas/archivar y verificar actualización.
  - Suscripción realtime: insertar y ver aparecer en el cliente correcto.

## Entregables
- SQL (tabla + función + políticas) en supabase/schema.sql.
- Rutas API en app/api/notifications/*.
- Componentes UI: NotificationBell, NotificationDropdown, NotificationInbox, ToastProvider.
- Integración de disparadores en acciones existentes para los tipos de evento definidos.
