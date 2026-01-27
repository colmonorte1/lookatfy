ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own disputes" ON public.disputes;
DROP POLICY IF EXISTS "Users can create disputes for their bookings" ON public.disputes;
DROP POLICY IF EXISTS "Participants can view disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can view all disputes" ON public.disputes;
DROP POLICY IF EXISTS "Admins can update disputes" ON public.disputes;
DROP POLICY IF EXISTS "Expert can update own dispute response" ON public.disputes;

CREATE POLICY "Users can view their own disputes" ON public.disputes
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create disputes for their bookings" ON public.disputes
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can view disputes" ON public.disputes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = disputes.booking_id 
            AND (bookings.user_id = auth.uid() OR bookings.expert_id = auth.uid())
        )
    );

CREATE POLICY "Admins can view all disputes" ON public.disputes
    FOR SELECT USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Admins can update disputes" ON public.disputes
    FOR UPDATE USING (
        (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    );

CREATE POLICY "Expert can update own dispute response" ON public.disputes
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = disputes.booking_id 
            AND bookings.expert_id = auth.uid()
        )
        AND status IN ('open','under_review')
    );

