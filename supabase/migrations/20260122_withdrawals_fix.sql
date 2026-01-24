-- 12. Withdrawals System (Added 2026-01-22)
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  expert_id UUID REFERENCES public.experts(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'COP',
  status TEXT CHECK (status IN ('pending','processing','approved','rejected','paid')) DEFAULT 'pending',
  bank_snapshot JSONB NOT NULL,
  admin_notes TEXT,
  transaction_ref TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  processed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experts can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = expert_id);

CREATE POLICY "Experts can request withdrawals" ON public.withdrawals
  FOR INSERT WITH CHECK (auth.uid() = expert_id);

CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals
  FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

CREATE POLICY "Admins can update withdrawals" ON public.withdrawals
  FOR UPDATE USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
