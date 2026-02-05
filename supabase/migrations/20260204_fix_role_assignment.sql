-- Fix: Prevent role manipulation from client-side metadata
-- The trigger now validates that role can only be 'client' or 'expert'
-- 'admin' role can never be self-assigned during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
BEGIN
  requested_role := COALESCE(new.raw_user_meta_data->>'role', 'client');

  -- Only allow 'client' or 'expert' roles during self-registration
  -- 'admin' must be assigned manually by an existing admin
  IF requested_role NOT IN ('client', 'expert') THEN
    requested_role := 'client';
  END IF;

  INSERT INTO public.profiles (id, full_name, avatar_url, email, role, status)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    requested_role,
    'active'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
