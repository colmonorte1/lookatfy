-- Email reminder flags for bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS reminder_user_24h_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_user_1h_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_expert_24h_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_expert_1h_sent BOOLEAN DEFAULT false;
