-- Migration: Add callback metadata to bid_fee_payments
-- Stores detailed M-Pesa callback information

ALTER TABLE public.bid_fee_payments
ADD COLUMN callback_metadata JSONB;

-- Create an index for better query performance
CREATE INDEX idx_bid_fee_payments_callback_metadata ON public.bid_fee_payments USING GIN (callback_metadata);
