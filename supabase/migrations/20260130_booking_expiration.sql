-- Agregar campo de expiración para bookings pendientes
-- Esto permite limpiar automáticamente reservas que no se pagaron

-- 1. Agregar columna expires_at
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- 2. Crear índice para mejorar performance de queries de limpieza
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at
ON public.bookings(expires_at)
WHERE status = 'pending';

-- 3. Función para limpiar bookings expirados
CREATE OR REPLACE FUNCTION cleanup_expired_bookings()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Cambiar status de bookings pendientes expirados a 'cancelled'
  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE status = 'pending'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Comentarios
COMMENT ON COLUMN public.bookings.expires_at IS 'Timestamp cuando expira la reserva pending si no se paga. NULL = no expira';
COMMENT ON FUNCTION cleanup_expired_bookings() IS 'Cancela bookings pendientes que han expirado';

-- 5. Nota: Para ejecutar la limpieza automática, crear un cron job en Supabase Dashboard:
-- Función: cleanup_expired_bookings()
-- Cron: */15 * * * * (cada 15 minutos)
