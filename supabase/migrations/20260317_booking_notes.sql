-- Agrega columna de notas del cliente al crear una reserva
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN bookings.notes IS 'Notas adicionales del cliente al crear la reserva (peticiones especiales para el experto)';
