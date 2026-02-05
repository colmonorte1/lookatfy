-- ADD STATUS AND SOFT DELETE SUPPORT TO PROFILES
-- Adds status field and deleted_at for soft delete functionality

-- Add status column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN status TEXT CHECK (status IN ('active', 'suspended', 'inactive', 'deleted')) DEFAULT 'active';
    END IF;
END $$;

-- Add deleted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add deleted_by column to track who deleted the user (admin accountability)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'deleted_by'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index on status for performance
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Create index on deleted_at for performance
CREATE INDEX IF NOT EXISTS idx_profiles_deleted_at ON public.profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Function to automatically set status to 'deleted' when deleted_at is set
CREATE OR REPLACE FUNCTION auto_set_deleted_status()
RETURNS TRIGGER AS $$
BEGIN
    -- When deleted_at is set, automatically set status to 'deleted'
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
        NEW.status = 'deleted';
    END IF;

    -- When deleted_at is cleared (restoration), set status back to 'active'
    IF NEW.deleted_at IS NULL AND OLD.deleted_at IS NOT NULL THEN
        NEW.status = 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update status when deleted_at changes
DROP TRIGGER IF EXISTS trigger_auto_set_deleted_status ON public.profiles;
CREATE TRIGGER trigger_auto_set_deleted_status
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_deleted_status();

-- Update RLS policies to exclude deleted users from normal queries

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate policies with deleted_at check
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (
        auth.uid() = id
        AND deleted_at IS NULL
    );

CREATE POLICY "Admins can view all profiles (including deleted)" ON public.profiles
    FOR SELECT
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid() AND deleted_at IS NULL) = 'admin'
    );

CREATE POLICY "Admins can update profiles" ON public.profiles
    FOR UPDATE
    USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid() AND deleted_at IS NULL) = 'admin'
    );

-- Comment on columns
COMMENT ON COLUMN public.profiles.status IS 'User account status: active, suspended, inactive, deleted';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Timestamp when user was soft deleted (NULL if not deleted)';
COMMENT ON COLUMN public.profiles.deleted_by IS 'Admin user ID who deleted this user';
