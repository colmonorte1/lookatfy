-- Backfill start_at from existing bookings using expert timezone when available
UPDATE public.bookings
SET start_at = (date::timestamp + time::interval) AT TIME ZONE COALESCE(expert_timezone, 'UTC')
WHERE start_at IS NULL;

-- Optional: Future removal of legacy columns (commented until verified)
-- ALTER TABLE public.bookings DROP COLUMN IF EXISTS date;
-- ALTER TABLE public.bookings DROP COLUMN IF EXISTS time;
