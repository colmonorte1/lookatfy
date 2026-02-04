-- ============================================
-- ADD SOFT DELETE SUPPORT TO EXPERTS
-- ============================================
-- Agrega campos para soft delete en la tabla experts
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
