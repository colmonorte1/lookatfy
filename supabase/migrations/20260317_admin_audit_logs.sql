-- Admin audit log table for tracking sensitive admin actions
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,          -- e.g. 'approve_payment', 'reject_payment', 'resolve_dispute'
    target_type TEXT NOT NULL,     -- e.g. 'booking', 'dispute', 'withdrawal', 'user'
    target_id TEXT,                -- ID of the affected record
    details JSONB,                 -- Extra context (amounts, reasons, etc.)
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
    ON public.admin_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Service role (used by server actions) can insert
CREATE POLICY "Service role can insert audit logs"
    ON public.admin_audit_logs FOR INSERT
    WITH CHECK (true);

-- Index for quick lookup by admin or target
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.admin_audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
