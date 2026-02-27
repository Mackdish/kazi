-- Add PayPal to payment_method enum
ALTER TYPE public.payment_method ADD VALUE 'paypal' BEFORE 'stripe';
