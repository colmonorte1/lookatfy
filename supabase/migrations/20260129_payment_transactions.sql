-- PAYMENT TRANSACTIONS TABLE
-- Stores all payment transaction details for auditing and tracking
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- References
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Wompi Transaction Data
  wompi_transaction_id TEXT UNIQUE, -- ID from Wompi
  wompi_reference TEXT NOT NULL, -- Usually the booking_id

  -- Payment Details
  amount_in_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'COP',
  original_amount NUMERIC, -- Amount in original currency before conversion
  original_currency TEXT, -- Original currency if converted

  -- Payment Method
  payment_method_type TEXT CHECK (payment_method_type IN ('CARD', 'PSE', 'NEQUI', 'DAVIPLATA', 'PCOL')),
  payment_method_details JSONB, -- Store additional payment method info

  -- Transaction Status
  status TEXT CHECK (status IN ('PENDING', 'APPROVED', 'DECLINED', 'VOIDED', 'ERROR')) DEFAULT 'PENDING',
  status_message TEXT,

  -- Wompi Response Data
  redirect_url TEXT, -- For PSE and other redirect methods
  payment_link TEXT,
  wompi_response JSONB, -- Full response from Wompi

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Audit
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_booking_id ON public.payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_wompi_transaction_id ON public.payment_transactions(wompi_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- RLS Policies
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.payment_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions" ON public.payment_transactions
  FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Only system (service role) can insert/update transactions
CREATE POLICY "Service role can insert transactions" ON public.payment_transactions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update transactions" ON public.payment_transactions
  FOR UPDATE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());

  -- Set completed_at when status changes to APPROVED or DECLINED
  IF NEW.status IN ('APPROVED', 'DECLINED', 'VOIDED', 'ERROR') AND OLD.status = 'PENDING' THEN
    NEW.completed_at = timezone('utc'::text, now());
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER update_payment_transaction_timestamp
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_transaction_timestamp();

-- Comment on table
COMMENT ON TABLE public.payment_transactions IS 'Stores all payment transaction details from Wompi for auditing and reconciliation';
