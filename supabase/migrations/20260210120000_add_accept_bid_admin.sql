-- Migration: add accept_bid_admin function and task_assignments audit table

-- Ensure pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Audit table for assignments
CREATE TABLE IF NOT EXISTS public.task_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  bid_id uuid NOT NULL,
  assigned_by uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

-- Function to accept a bid and assign task; only admins may call
CREATE OR REPLACE FUNCTION public.accept_bid_admin(_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  b RECORD;
BEGIN
  -- Check admin privilege using existing helper; will error if not admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'only admins may assign tasks';
  END IF;

  SELECT * INTO b FROM public.bids WHERE id = _bid_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'bid not found';
  END IF;

  -- Update bid status
  UPDATE public.bids SET status = 'accepted', updated_at = now() WHERE id = _bid_id;

  -- Update task to link accepted bid and set in_progress
  UPDATE public.tasks SET accepted_bid_id = _bid_id, status = 'in_progress', updated_at = now() WHERE id = b.task_id;

  -- Insert audit record
  INSERT INTO public.task_assignments(task_id, bid_id, assigned_by, assigned_at)
  VALUES (b.task_id, _bid_id, auth.uid()::uuid, now());

  RETURN jsonb_build_object('ok', true, 'task_id', b.task_id, 'bid_id', _bid_id);
END;
$$;

-- Grant execute to authenticated role
GRANT EXECUTE ON FUNCTION public.accept_bid_admin(uuid) TO authenticated;
