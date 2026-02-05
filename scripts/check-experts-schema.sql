-- ============================================
-- CHECK EXPERTS TABLE SCHEMA
-- ============================================
-- Run this in Supabase SQL Editor to verify the experts table schema
-- ============================================

-- 1. Check if experts table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'experts'
) as experts_table_exists;

-- 2. Check all columns in experts table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'experts'
ORDER BY ordinal_position;

-- 3. Check if deleted_at column exists (required for soft delete)
SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'experts'
    AND column_name = 'deleted_at'
) as deleted_at_exists;

-- 4. Check if deleted_by column exists (required for soft delete)
SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'experts'
    AND column_name = 'deleted_by'
) as deleted_by_exists;

-- 5. Check RLS policies on experts table
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'experts'
ORDER BY policyname;

-- 6. Check if RLS is enabled
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'experts';
