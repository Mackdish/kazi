/**
 * Stripe Payment Integration Handler
 * This file handles payment processing with Stripe
 * 
 * ⚠️ IMPORTANT: This is a TEMPLATE file with reference implementations
 * The actual Stripe SDK integration should be implemented in your backend
 * 
 * Setup:
 * 1. Backend: npm install stripe @stripe/stripe-js
 * 2. Frontend: npm install @stripe/stripe-js (optional, for client-side payments)
 * 3. Add VITE_STRIPE_PUBLIC_KEY to .env
 * 4. Create Stripe webhook endpoint for payment confirmation
 * 
 * Reference Implementation Files:
 * - Backend implementation: /backend/payments/stripe.ts
 * - Webhook handler: /backend/webhooks/stripe.ts
 */

// TYPE DEFINITIONS (frontend only, no SDK dependency)
export interface StripePaymentParams {
  taskId: string;
  depositAmount: number;
  clientId: string;
  clientEmail: string;
}

export interface StripePaymentIntent {
  clientSecret: string;
  intentId: string;
}

/**
 * Create a payment intent with Stripe
 * Call this after initiating deposit in Supabase
 */
export const createStripePaymentIntent = async (
  params: StripePaymentParams
): Promise<StripePaymentIntent> => {
  try {
    const response = await fetch("/api/payments/stripe/create-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        depositAmount: Math.round(params.depositAmount * 100), // Convert to cents
        taskId: params.taskId,
        clientId: params.clientId,
        clientEmail: params.clientEmail,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create payment intent");
    }

    const data = await response.json();
    return data; // { clientSecret, intentId }
  } catch (error) {
    console.error("Stripe payment intent error:", error);
    throw error;
  }
};

/**
 * Get Stripe instance (only if @stripe/stripe-js is installed)
 * 
 * Frontend usage example:
 * const stripe = await getStripe();
 * if (stripe) {
 *   // Use stripe client
 * }
 */
export const getStripe = async () => {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
  if (!publicKey) {
    console.warn("Stripe public key not configured");
    return null;
  }

  try {
    // This import will fail if @stripe/stripe-js is not installed
    // Wrap in try-catch to handle gracefully
    // const { loadStripe } = await import("@stripe/stripe-js");
    // const stripe = await loadStripe(publicKey);
    
    // For now, return null - actual implementation in backend
    console.info("Stripe integration requires backend implementation");
    return null;
  } catch (error) {
    console.error("Failed to load Stripe:", error);
    return null;
  }
};

/**
 * ================================================
 * BACKEND IMPLEMENTATION GUIDE (Reference)
 * ================================================
 * 
 * File: /backend/payments/stripe.ts
 * 
 * import Stripe from 'stripe';
 * 
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 * 
 * export async function createPaymentIntent(req: Request) {
 *   const { depositAmount, taskId, clientId, clientEmail } = await req.json();
 * 
 *   try {
 *     const intent = await stripe.paymentIntents.create({
 *       amount: Math.round(depositAmount * 100),
 *       currency: 'usd',
 *       metadata: { taskId, clientId },
 *       receipt_email: clientEmail,
 *     });
 * 
 *     return Response.json({
 *       clientSecret: intent.client_secret,
 *       intentId: intent.id,
 *     });
 *   } catch (error: any) {
 *     return Response.json({ error: String(error) }, { status: 400 });
 *   }
 * }
 * 
 * ================================================
 * WEBHOOK IMPLEMENTATION GUIDE (Reference)
 * ================================================
 * 
 * File: /backend/webhooks/stripe.ts
 * 
 * import Stripe from 'stripe';
 * import { supabase } from '@/integrations/supabase/client';
 * 
 * const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
 * 
 * export async function handleWebhook(req: Request) {
 *   const body = await req.text();
 *   const signature = req.headers.get('stripe-signature')!;
 * 
 *   let event;
 *   try {
 *     event = stripe.webhooks.constructEvent(
 *       body,
 *       signature,
 *       process.env.STRIPE_WEBHOOK_SECRET!
 *     );
 *   } catch (error) {
 *     return Response.json({ error: 'Invalid signature' }, { status: 400 });
 *   }
 * 
 *   if (event.type === 'payment_intent.succeeded') {
 *     const { metadata, id } = event.data.object;
 * 
 *     const { error } = await supabase.rpc('confirm_deposit_payment', {
 *       _task_id: metadata.taskId,
 *       _external_reference: id,
 *     });
 * 
 *     if (error) {
 *       console.error('Error confirming deposit:', error);
 *     }
 *   }
 * 
 *   return Response.json({ received: true });
 * }
 */
