-- Migration: Add task deposit tracking
-- This tracks when clients pay the 50% deposit for tasks

CREATE TABLE IF NOT EXISTS public.task_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE UNIQUE,
  client_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  deposit_amount DECIMAL(12,2) NOT NULL CHECK (deposit_amount > 0),
  original_budget DECIMAL(12,2) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  payment_method payment_method,
  external_reference TEXT,
  transaction_id uuid REFERENCES public.transactions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for task_deposits
CREATE POLICY "Clients can view their own deposits"
ON public.task_deposits FOR SELECT
USING (client_id = auth.uid() OR public.is_admin());

CREATE POLICY "Clients can create deposits for their tasks"
ON public.task_deposits FOR INSERT
WITH CHECK (client_id = auth.uid());

CREATE POLICY "Admins can update deposits"
ON public.task_deposits FOR UPDATE
USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_task_deposits_updated_at
BEFORE UPDATE ON public.task_deposits
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if a task deposit has been paid
CREATE OR REPLACE FUNCTION public.is_deposit_paid(_task_id uuid)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.task_deposits
    WHERE task_id = _task_id
      AND payment_status = 'completed'
  )
$$;

-- Function to get deposit amount for a task
CREATE OR REPLACE FUNCTION public.get_task_deposit(_task_id uuid)
RETURNS TABLE(deposit_amount DECIMAL, original_budget DECIMAL, payment_status VARCHAR)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT task_deposits.deposit_amount, task_deposits.original_budget, task_deposits.payment_status
  FROM public.task_deposits
  WHERE task_id = _task_id
$$;

-- Function to process task deposit payment
CREATE OR REPLACE FUNCTION public.process_task_deposit(
  _task_id uuid,
  _deposit_amount DECIMAL,
  _payment_method payment_method,
  _external_reference TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_task_id uuid;
  v_deposit_id uuid;
  v_transaction_id uuid;
  v_wallet RECORD;
BEGIN
  -- Get authenticated user
  v_client_id := auth.uid();
  
  IF v_client_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'User not authenticated');
  END IF;

  -- Verify task exists and belongs to client
  SELECT id INTO v_task_id FROM public.tasks 
  WHERE id = _task_id AND client_id = v_client_id;
  
  IF v_task_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Task not found or does not belong to user');
  END IF;

  -- Check if deposit already exists and paid
  IF EXISTS (
    SELECT 1 FROM public.task_deposits 
    WHERE task_id = _task_id AND payment_status = 'completed'
  ) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Deposit already paid for this task');
  END IF;

  -- Get or create wallet for client
  SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_client_id LIMIT 1;
  
  IF v_wallet IS NULL THEN
    INSERT INTO public.wallets (user_id) VALUES (v_client_id);
    SELECT * INTO v_wallet FROM public.wallets WHERE user_id = v_client_id;
  END IF;

  -- Create deposit record if doesn't exist
  INSERT INTO public.task_deposits (task_id, client_id, deposit_amount, original_budget, payment_status, payment_method, external_reference)
  SELECT _task_id, v_client_id, _deposit_amount, budget, 'processing', _payment_method, _external_reference
  FROM public.tasks
  WHERE id = _task_id
  ON CONFLICT (task_id) DO UPDATE SET payment_status = 'processing'
  RETURNING id INTO v_deposit_id;

  -- Create transaction record for tracking
  INSERT INTO public.transactions (task_id, payer_id, amount, payment_method, escrow_status, external_reference)
  VALUES (_task_id, v_client_id, _deposit_amount, _payment_method, 'held', _external_reference)
  RETURNING id INTO v_transaction_id;

  -- Update deposit with transaction reference
  UPDATE public.task_deposits 
  SET transaction_id = v_transaction_id
  WHERE id = v_deposit_id;

  -- Deduct from available balance (will be released after task completion or refunded)
  UPDATE public.wallets 
  SET available_balance = available_balance - _deposit_amount
  WHERE user_id = v_client_id AND available_balance >= _deposit_amount;

  RETURN jsonb_build_object(
    'ok', true, 
    'deposit_id', v_deposit_id,
    'transaction_id', v_transaction_id,
    'message', 'Deposit payment initiated'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.process_task_deposit(uuid, DECIMAL, payment_method, TEXT) TO authenticated;

-- Function to confirm deposit payment completion
CREATE OR REPLACE FUNCTION public.confirm_deposit_payment(
  _task_id uuid,
  _external_reference TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deposit RECORD;
BEGIN
  -- Only admins can confirm payments (or automatic payment processing can call this)
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Admin access required');
  END IF;

  -- Get deposit record
  SELECT * INTO v_deposit FROM public.task_deposits 
  WHERE task_id = _task_id AND external_reference = _external_reference;
  
  IF v_deposit IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Deposit record not found');
  END IF;

  -- Update deposit status
  UPDATE public.task_deposits 
  SET payment_status = 'completed', paid_at = now()
  WHERE id = v_deposit.id;

  -- Update transaction status
  UPDATE public.transactions 
  SET escrow_status = 'held'
  WHERE id = v_deposit.transaction_id;

  -- Update task to mark as deposit paid (add new column or use comment)
  UPDATE public.tasks 
  SET updated_at = now()
  WHERE id = _task_id;

  RETURN jsonb_build_object(
    'ok', true,
    'deposit_id', v_deposit.id,
    'message', 'Deposit payment confirmed'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_deposit_payment(uuid, TEXT) TO authenticated;
