-- Fix: Populate first_name and last_name from registration metadata
-- Previously only full_name was set, leaving first_name/last_name NULL

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
BEGIN
  requested_role := COALESCE(new.raw_user_meta_data->>'role', 'client');

  -- Only allow 'client' or 'expert' roles during self-registration
  IF requested_role NOT IN ('client', 'expert') THEN
    requested_role := 'client';
  END IF;

  INSERT INTO public.profiles (id, full_name, first_name, last_name, avatar_url, email, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    requested_role,
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill existing profiles that have full_name but no first_name/last_name
UPDATE public.profiles
SET
  first_name = SPLIT_PART(full_name, ' ', 1),
  last_name = TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
WHERE full_name IS NOT NULL
  AND first_name IS NULL
  AND last_name IS NULL
  AND full_name LIKE '% %';
