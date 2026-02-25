
-- Table to track bid fee payments via M-Pesa
CREATE TABLE public.bid_fee_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL REFERENCES public.tasks(id),
  amount NUMERIC NOT NULL DEFAULT 55,
  phone_number TEXT NOT NULL,
  checkout_request_id TEXT,
  mpesa_receipt TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bid_fee_payments ENABLE ROW LEVEL SECURITY;

-- Freelancers can create their own payment records
CREATE POLICY "Freelancers can create bid fee payments"
ON public.bid_fee_payments
FOR INSERT
WITH CHECK (user_id = auth.uid() AND is_freelancer());

-- Users can view their own payments
CREATE POLICY "Users can view own bid fee payments"
ON public.bid_fee_payments
FOR SELECT
USING (user_id = auth.uid() OR is_admin());

-- Only service role (edge functions) updates payment status
CREATE POLICY "Admins can update bid fee payments"
ON public.bid_fee_payments
FOR UPDATE
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_bid_fee_payments_updated_at
BEFORE UPDATE ON public.bid_fee_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
