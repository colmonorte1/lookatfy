-- ============================================
-- COMPLETE EXPERTS TABLE SETUP
-- ============================================
-- This migration combines soft delete and RLS policies
-- Run this in a fresh SQL Editor query window
-- ============================================

-- ============================================
-- PART 1: SOFT DELETE COLUMNS
-- ============================================

-- Add deleted_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'experts'
        AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE public.experts
        ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add deleted_by column to track who deleted the expert (admin accountability)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'experts'
        AND column_name = 'deleted_by'
    ) THEN
        ALTER TABLE public.experts
        ADD COLUMN deleted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index on deleted_at for performance
CREATE INDEX IF NOT EXISTS idx_experts_deleted_at ON public.experts(deleted_at) WHERE deleted_at IS NOT NULL;

-- Comment on columns
COMMENT ON COLUMN public.experts.deleted_at IS 'Timestamp when expert was soft deleted (NULL if not deleted)';
COMMENT ON COLUMN public.experts.deleted_by IS 'Admin user ID who deleted this expert';

-- ============================================
-- PART 2: ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on the experts table
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active experts" ON public.experts;
DROP POLICY IF EXISTS "Authenticated users can view experts" ON public.experts;
DROP POLICY IF EXISTS "Experts can view own profile" ON public.experts;
DROP POLICY IF EXISTS "Experts can update own profile" ON public.experts;
DROP POLICY IF EXISTS "Service role can insert experts" ON public.experts;

-- 1. Authenticated users can view all experts (needed for admin dashboard)
CREATE POLICY "Authenticated users can view experts" ON public.experts
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- 2. Experts can update their own profile
CREATE POLICY "Experts can update own profile" ON public.experts
    FOR UPDATE
    USING (id = auth.uid());

-- 3. Allow INSERT for service role (expert creation)
CREATE POLICY "Service role can insert experts" ON public.experts
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify columns were added
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'experts'
AND column_name IN ('deleted_at', 'deleted_by')
ORDER BY column_name;

-- Verify RLS is enabled
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'experts';

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    cmd AS operation
FROM pg_policies
WHERE tablename = 'experts'
ORDER BY policyname;
