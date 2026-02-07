-- ==========================================
-- LOOKATFY - Auto-cancelación de Bookings
-- ==========================================
-- Este script configura un cron job que cancela automáticamente
-- los bookings pendientes que hayan expirado (>20 minutos)
-- Se ejecuta cada 5 minutos
-- ==========================================

-- PASO 1: Activar extensión pg_cron (si no está activada)
-- ==========================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- PASO 2: Crear función para cancelar bookings expirados
-- ==========================================
CREATE OR REPLACE FUNCTION cancel_expired_bookings()
RETURNS TABLE(
  cancelled_count INTEGER,
  booking_ids TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expired_booking RECORD;
  cancelled_ids TEXT[] := ARRAY[]::TEXT[];
  counter INTEGER := 0;
BEGIN
  -- Buscar todos los bookings pendientes que hayan expirado
  FOR expired_booking IN
    SELECT
      id,
      user_id,
      expert_id,
      date,
      time,
      expires_at
    FROM bookings
    WHERE status = 'pending'
    AND expires_at < NOW()
    AND expires_at IS NOT NULL
  LOOP
    -- Actualizar estado a cancelled
    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = expired_booking.id;

    -- Agregar a array de IDs cancelados
    cancelled_ids := array_append(cancelled_ids, expired_booking.id::TEXT);
    counter := counter + 1;

    -- Crear notificaciones para usuario y experto
    BEGIN
      INSERT INTO notifications (user_id, title, message, type, read, created_at)
      VALUES
        -- Notificación para el usuario
        (
          expired_booking.user_id,
          '❌ Reserva cancelada',
          'Tu reserva para el ' || expired_booking.date || ' a las ' || expired_booking.time || ' fue cancelada porque el pago no se confirmó a tiempo.',
          'booking',
          false,
          NOW()
        ),
        -- Notificación para el experto
        (
          expired_booking.expert_id,
          'Reserva cancelada',
          'Una reserva pendiente para el ' || expired_booking.date || ' a las ' || expired_booking.time || ' fue cancelada por falta de confirmación de pago.',
          'booking',
          false,
          NOW()
        );
    EXCEPTION
      WHEN OTHERS THEN
        -- Si falla la notificación, continuar con el siguiente booking
        RAISE NOTICE 'Error creando notificaciones para booking %: %', expired_booking.id, SQLERRM;
    END;

  END LOOP;

  -- Retornar resultado
  RETURN QUERY SELECT counter, cancelled_ids;

END;
$$;

-- PASO 3: Programar el cron job (cada 5 minutos)
-- ==========================================
-- Primero, eliminar el job si ya existe (para evitar duplicados)
SELECT cron.unschedule('cancel-expired-bookings-lookatfy')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cancel-expired-bookings-lookatfy'
);

-- Crear el nuevo cron job
SELECT cron.schedule(
  'cancel-expired-bookings-lookatfy',  -- Nombre único del job
  '*/5 * * * *',                       -- Cada 5 minutos (formato cron)
  $$SELECT cancel_expired_bookings();$$
);

-- ==========================================
-- VERIFICACIÓN
-- ==========================================

-- Ver todos los cron jobs activos
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
WHERE jobname = 'cancel-expired-bookings-lookatfy';

-- Ver el historial de ejecuciones (últimas 10)
SELECT
  job_id,
  jobname,
  start_time,
  end_time,
  status,
  return_message,
  (end_time - start_time) as duration
FROM cron.job_run_details
WHERE jobname = 'cancel-expired-bookings-lookatfy'
ORDER BY start_time DESC
LIMIT 10;

-- ==========================================
-- PRUEBA MANUAL (OPCIONAL)
-- ==========================================
-- Ejecutar la función manualmente para probar
-- Descomentar la siguiente línea para ejecutar:
-- SELECT * FROM cancel_expired_bookings();

-- ==========================================
-- COMANDOS ÚTILES
-- ==========================================

-- Para DESACTIVAR el cron job (sin eliminarlo):
-- UPDATE cron.job SET active = false WHERE jobname = 'cancel-expired-bookings-lookatfy';

-- Para REACTIVAR el cron job:
-- UPDATE cron.job SET active = true WHERE jobname = 'cancel-expired-bookings-lookatfy';

-- Para ELIMINAR completamente el cron job:
-- SELECT cron.unschedule('cancel-expired-bookings-lookatfy');

-- Para ver TODOS los bookings pendientes que expirarán pronto:
-- SELECT
--   id,
--   user_id,
--   expert_id,
--   date,
--   time,
--   status,
--   expires_at,
--   EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 as minutes_until_expiration
-- FROM bookings
-- WHERE status = 'pending'
-- AND expires_at IS NOT NULL
-- ORDER BY expires_at ASC;

-- ==========================================
-- NOTAS
-- ==========================================
-- 1. El cron job se ejecutará cada 5 minutos automáticamente
-- 2. Solo cancela bookings con status='pending' y expires_at < NOW()
-- 3. Envía notificaciones a ambos: usuario y experto
-- 4. Los logs se guardan automáticamente en cron.job_run_details
-- 5. Si la función falla, el error se registra en los logs
-- ==========================================
