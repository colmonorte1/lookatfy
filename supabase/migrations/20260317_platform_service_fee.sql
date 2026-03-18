-- Agrega tarifa de servicio configurable a platform_settings
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS service_fee_cop  NUMERIC DEFAULT 2000,
  ADD COLUMN IF NOT EXISTS service_fee_usd  NUMERIC DEFAULT 2;

COMMENT ON COLUMN public.platform_settings.service_fee_cop IS 'Tarifa de servicio fija en COP que se cobra al usuario en cada reserva';
COMMENT ON COLUMN public.platform_settings.service_fee_usd IS 'Tarifa de servicio fija en USD/EUR que se cobra al usuario en cada reserva';

-- Actualizar fila existente con los valores por defecto
UPDATE public.platform_settings
SET service_fee_cop = 2000, service_fee_usd = 2
WHERE id = 1;
