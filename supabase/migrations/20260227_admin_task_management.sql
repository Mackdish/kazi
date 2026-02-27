-- Migration: Update RLS policies for admin task management operations
-- This ensures admins can fully manage tasks, bids, and user roles

-- Ensure admin can read all tasks
CREATE POLICY "Admins can view all tasks"
ON public.tasks FOR SELECT
USING (public.is_admin());

-- Ensure admin can update any task
CREATE POLICY "Admins can update all tasks"
ON public.tasks FOR UPDATE
USING (public.is_admin());

-- Ensure admin can view all bids
CREATE POLICY "Admins can view all bids"
ON public.bids FOR SELECT
USING (public.is_admin());

-- Ensure admin can update bid status
CREATE POLICY "Admins can update all bids"
ON public.bids FOR UPDATE
USING (public.is_admin());

-- Ensure admin can view and manage user roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.is_admin());

-- Ensure admin can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals FOR SELECT
USING (public.is_admin());

-- Ensure admin can update withdrawal status
CREATE POLICY "Admins can update all withdrawals"
ON public.withdrawals FOR UPDATE
USING (public.is_admin());

-- Ensure admin can view all wallets
CREATE POLICY "Admins can view all wallets"
ON public.wallets FOR SELECT
USING (public.is_admin());

-- Ensure admin can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions FOR SELECT
USING (public.is_admin());

-- Ensure admin can update transactions
CREATE POLICY "Admins can update all transactions"
ON public.transactions FOR UPDATE
USING (public.is_admin());