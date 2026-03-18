## Reglas de Negocio
- Un experto inicia con verified = false.
- Se verifica automáticamente al alcanzar ≥ 5 sesiones “completed”.
- El administrador puede verificar o quitar verificación manualmente en el panel.
- Se guarda auditoría: verified_at, verified_source ('auto'|'manual'), verified_by (admin opcional en verificación manual).

## Cambios de Datos
- Tabla public.experts: ya existe campo verified BOOLEAN.
- Añadir columnas:
  - verified_at TIMESTAMPTZ NULL
  - verified_source TEXT CHECK (verified_source IN ('auto','manual')) NULL
  - verified_by UUID NULL REFERENCES public.profiles(id)
- Índices sugeridos: (verified), (verified_source), para filtros en admin.
- No añadimos contador persistente: el conteo usa bookings status='completed'.
  - Bookings: [schema.sql: bookings](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/supabase/schema.sql#L63-L75)

## Verificación Automática (Trigger en BD)
- Trigger AFTER UPDATE ON public.bookings cuando NEW.status = 'completed' y OLD.status <> 'completed'.
- Procedimiento:
  - Contar sesiones completadas del experto: SELECT COUNT(*) FROM bookings WHERE expert_id = NEW.expert_id AND status='completed'.
  - Si count ≥ 5 y expert.verified = false: UPDATE experts SET verified=true, verified_at=NOW(), verified_source='auto'.
  - Idempotencia: no tocar si ya está verified=true.
- Beneficio: inmediato, robusto y cercano a datos.

## Verificación Manual (Admin)
- Extender acción existente para togglear verificación:
  - [admin/actions.ts: toggleExpertVerification](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/actions.ts#L8-L61)
  - Al verificar manualmente: SET verified=true, verified_at=NOW(), verified_source='manual', verified_by = admin_id.
  - Al quitar verificación: SET verified=false, verified_at=NULL, verified_source=NULL, verified_by=NULL.
- Revalidar rutas y notificaciones como ya hacen las acciones.

## UI y Badge Azul
- Público: ya se muestra ShieldCheck si expert.verified.
  - Revisar consistencia en tarjetas/listados: [ServiceDetailClient.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/(public)/services/%5Bid%5D/ServiceDetailClient.tsx#L200-L212)
- Admin listado y detalle:
  - Añadir etiqueta “Verificado” con fuente (auto/manual) y fecha.
  - Filtro por verificación (ya existe, enriquecer con fuente).
  - Archivos:
    - [admin/experts/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/experts/page.tsx#L155-L236)
    - [admin/experts/[id]/page.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/experts/%5Bid%5D/page.tsx#L114-L169)
    - [components/admin/ExpertActions.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/components/admin/ExpertActions.tsx#L1-L82)

## Notificaciones y Email
- En verificación automática o manual, enviar correo al experto.
  - Aprovechar plantillas y canal actual: [lib/email/templates.ts](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/lib/email/templates.ts#L389-L413)
  - Añadir nueva plantilla “ExpertVerifiedBlueBadge”.

## Auditoría y Logs
- Registrar eventos: expert_verified, expert_unverified con payload {expert_id, source, by, at}.
- Centralizar logging en acciones de admin y en la función del trigger.

## Migración y Backfill
- Migración SQL que añade columnas nuevas.
- Job de backfill único:
  - Verificar automáticamente expertos con ≥ 5 bookings 'completed' al momento de migrar.
  - Respetar verificados manuales existentes (verified=true sin source → set source='manual' y at = COALESCE(verified_at,NOW())).

## Observabilidad
- Métricas en admin dashboard:
  - Total expertos verificados, verificados por auto/manual, pendientes.
  - En detalle de experto, mostrar conteo de sessions 'completed'.
  - Archivos: [ExpertsDashboard.tsx](file:///d:/TRABAJOS/LOOKATFY/lookatfy-appv1/app/admin/experts/ExpertsDashboard.tsx#L1-L216)

## Pruebas
- Unit test de función trigger (si se implementa en SQL/PLpgSQL, probar vía scripts).
- Test de acción admin para togglear.
- Test de render en UI para badge y fuente.

## Seguridad y Permisos
- Verificación manual sólo con role 'admin': ya validado en server actions.
- Trigger de BD corre siempre; no depende del cliente.

## Rendimiento
- Índice en bookings (expert_id, status) para conteos rápidos.
- Las actualizaciones de verificación son poco frecuentes; el trigger es ligero.

## Despliegue
- Orden sugerido:
  1) Migración de esquema + índice.
  2) Trigger + función.
  3) Backfill.
  4) UI y emails.
  5) Monitoreo y ajustes.
