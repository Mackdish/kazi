# Payment Gateway Integration Guide

This guide provides step-by-step instructions for integrating Stripe, M-Pesa, and PayPal payment gateways with the nextgig deposit feature.

## Quick Setup Summary

| Gateway | Setup Time | Status | Key File |
|---------|-----------|--------|----------|
| Stripe | 15-20 min | 🔄 Ready to integrate | `src/integrations/stripe/client.ts` |
| M-Pesa | 30-45 min | 🔄 Ready to integrate | `src/integrations/mpesa/client.ts` |
| PayPal | 20-25 min | 🔄 Ready to integrate | `src/integrations/paypal/client.ts` |

---

## 1. Stripe Integration

### Step 1: Create Stripe Account
1. Go to [stripe.com](https://stripe.com)
2. Sign up or log in
3. Complete identity verification
4. Navigate to Dashboard → Developers → API keys

### Step 2: Get API Keys
1. Copy your **Publishable Key** (starts with `pk_test_` or `pk_live_`)
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Environment Setup
```bash
# .env.local
VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key
```

```bash
# Backend .env
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Step 4: Install Dependencies
```bash
npm install @stripe/stripe-js
npm install stripe # Backend only
```

### Step 5: Implement Payment Intent Endpoint

Create `/api/payments/stripe/create-intent` endpoint:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { depositAmount, taskId, clientId, clientEmail } = await req.json();

  try {
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(depositAmount * 100), // cents
      currency: 'usd',
      metadata: { taskId, clientId },
      receipt_email: clientEmail,
    });

    return Response.json({
      clientSecret: intent.client_secret,
      intentId: intent.id,
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 400 });
  }
}
```

### Step 6: Setup Webhook
1. Go to Developers → Webhooks in Stripe Dashboard
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### Step 7: Implement Webhook Handler

Create `/api/webhooks/stripe` endpoint:

```typescript
import Stripe from 'stripe';
import { supabase } from '@/integrations/supabase/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'payment_intent.succeeded') {
    const { metadata, id } = event.data.object;
    
    // Confirm deposit in Supabase
    const { error } = await supabase.rpc('confirm_deposit_payment', {
      _task_id: metadata.taskId,
      _external_reference: id,
    });

    if (error) {
      console.error('Error confirming deposit:', error);
      return Response.json({ error: 'Failed to confirm deposit' }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
```

### Step 8: Update PostTask Component

In `src/pages/PostTask.tsx`, update `handlePaymentSelected`:

```typescript
const handlePaymentSelected = async (method: "stripe" | "mpesa" | "paypal") => {
  if (!createdTaskId || !taskForm) return;

  if (method === "stripe") {
    const stripe = await getStripe();
    const { clientSecret } = await createStripePaymentIntent({
      taskId: createdTaskId,
      depositAmount,
      clientId: user.id,
      clientEmail: user.email || "",
    });

    // Redirect to Stripe checkout or show Elements UI
    await stripe?.redirectToCheckout({ sessionId: clientSecret });
  }
  // ... handle other methods
};
```

### Testing
- **Sandbox Keys**: Use `pk_test_` and `sk_test_` keys
- **Test Cards**:
  - Success: `4242 4242 4242 4242`
  - Declined: `4000 0000 0000 0002`
- **CVC**: Any 3 digits
- **Expiry**: Any future date

---

## 2. M-Pesa Integration

### Step 1: Register with Safaricom
1. Go to [Safaricom Daraja Portal](https://developer.safaricom.co.ke)
2. Create developer account
3. Create a new app

### Step 2: Get API Credentials
From your app, copy:
- **Consumer Key**
- **Consumer Secret**
- **Business Shortcode** (for online checkout)
- **Shortcode Passkey** (for online checkout)

### Step 3: Environment Setup
```bash
# .env.local
VITE_MPESA_CONSUMER_KEY=your_consumer_key
VITE_MPESA_CONSUMER_SECRET=your_consumer_secret
VITE_MPESA_ENVIRONMENT=sandbox # or production
```

```bash
# Backend .env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_BUSINESS_SHORTCODE=your_shortcode
MPESA_SHORTCODE_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/webhooks/mpesa
```

### Step 4: Install Dependencies
```bash
npm install axios
# No additional packages needed - use native fetch
```

### Step 5: Implement STK Push Endpoint

Create `/api/payments/mpesa/stk-push` endpoint:

```typescript
import axios from 'axios';

async function getMpesaAccessToken() {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString('base64');

  const response = await axios.get(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${auth}` } }
  );

  return response.data.access_token;
}

function generateTimestamp() {
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
}

function generatePassword(shortCode: string, passkey: string, timestamp: string) {
  return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
}

export async function POST(req: Request) {
  const { depositAmount, phoneNumber, taskId, clientId } = await req.json();

  try {
    const accessToken = await getMpesaAccessToken();
    const timestamp = generateTimestamp();
    const password = generatePassword(
      process.env.MPESA_BUSINESS_SHORTCODE!,
      process.env.MPESA_SHORTCODE_PASSKEY!,
      timestamp
    );

    // Format phone: remove 0, add 254
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    }

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: process.env.MPESA_BUSINESS_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(depositAmount),
        PartyA: formattedPhone,
        PartyB: process.env.MPESA_BUSINESS_SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: taskId,
        TransactionDesc: `Task Deposit - ${taskId}`,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Store checkout request ID
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase
      .from('task_deposits')
      .update({
        external_reference: response.data.CheckoutRequestID,
        payment_status: 'processing',
      })
      .eq('task_id', taskId);

    return Response.json({
      checkoutRequestId: response.data.CheckoutRequestID,
      responseCode: response.data.ResponseCode,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.response?.data?.errorMessage || String(error) },
      { status: 400 }
    );
  }
}
```

### Step 6: Implement Callback Webhook

Create `/api/webhooks/mpesa` endpoint (receives M-Pesa callbacks):

```typescript
import { supabase } from '@/integrations/supabase/client';

export async function POST(req: Request) {
  const body = await req.json();
  const { Body } = body;
  
  if (!Body?.stkCallback) {
    return Response.json({ success: false });
  }

  const { ResultCode, CheckoutRequestID, CallbackMetadata } = Body.stkCallback;

  if (ResultCode === 0) {
    // Payment successful
    const mpesaReceiptNumber = CallbackMetadata?.Item?.find(
      (item: any) => item.Name === 'MpesaReceiptNumber'
    )?.Value;

    // Find deposit by checkout request ID
    const { data: deposits, error: queryError } = await supabase
      .from('task_deposits')
      .select('task_id')
      .eq('external_reference', CheckoutRequestID)
      .single();

    if (deposits && mpesaReceiptNumber) {
      // Confirm payment
      await supabase.rpc('confirm_deposit_payment', {
        _task_id: deposits.task_id,
        _external_reference: mpesaReceiptNumber,
      });
    }
  }

  // Always return 200 to acknowledge receipt
  return Response.json({ ResultCode: 0 });
}
```

### Step 7: Configure M-Pesa Callback

In [Safaricom Daraja](https://developer.safaricom.co.ke):
1. Go to your app
2. Under "Test Credentials" → "OnlineStkPush"
3. Set Callback URL: `https://yourdomain.com/api/webhooks/mpesa`
4. Save

### Testing
- Use test credentials from Safaricom
- Test with valid Kenya phone numbers (starting with 254 7xx)
- In sandbox, use `254708374149` for testing

---

## 3. PayPal Integration

### Step 1: Create PayPal Developer Account
1. Go to [developer.paypal.com](https://developer.paypal.com)
2. Sign up or log in with PayPal account
3. Navigate to Dashboard

### Step 2: Create App
1. Go to "Apps & Credentials"
2. Select "Sandbox" (for testing)
3. Click "Create App" (if not exists)
4. Name it something like "nextgig-deposit"

### Step 3: Get Credentials
From your app, copy:
- **Client ID** (Sandbox)
- **Secret** (Sandbox)

### Step 4: Environment Setup
```bash
# .env.local
VITE_PAYPAL_CLIENT_ID=your_sandbox_client_id
VITE_PAYPAL_ENVIRONMENT=sandbox # or production
```

```bash
# Backend .env
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_secret
PAYPAL_WEBHOOK_ID=your_webhook_id
```

### Step 5: Install Dependencies
```bash
npm install @paypal/checkout-server-sdk
```

### Step 6: Implement Order Creation Endpoint

Create `/api/payments/paypal/create-order` endpoint:

```typescript
import paypalClient from '@paypal/checkout-server-sdk';

const client = new paypalClient.core.PayPalHttpClient(
  new paypalClient.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID!,
    process.env.PAYPAL_CLIENT_SECRET!
  )
);

export async function POST(req: Request) {
  const { depositAmount, taskId, taskTitle } = await req.json();

  try {
    const request = new paypalClient.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: depositAmount.toString(),
          },
          description: `50% Deposit: ${taskTitle}`,
          custom_id: taskId,
        },
      ],
      application_context: {
        return_url: 'https://yourdomain.com/dashboard/client',
        cancel_url: 'https://yourdomain.com/post-task',
      },
    });

    const response = await client.execute(request);
    
    // Store order ID
    const { supabase } = await import('@/integrations/supabase/client');
    await supabase
      .from('task_deposits')
      .update({
        external_reference: response.result.id,
        payment_status: 'processing',
      })
      .eq('task_id', taskId);

    return Response.json({ orderId: response.result.id });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### Step 7: Implement Order Capture Endpoint

Create `/api/payments/paypal/capture-order` endpoint:

```typescript
export async function POST(req: Request) {
  const { orderId } = await req.json();

  try {
    const request = new paypalClient.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const response = await client.execute(request);

    // Find and confirm deposit
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: deposits } = await supabase
      .from('task_deposits')
      .select('task_id')
      .eq('external_reference', orderId)
      .single();

    if (deposits) {
      await supabase.rpc('confirm_deposit_payment', {
        _task_id: deposits.task_id,
        _external_reference: response.result.id,
      });
    }

    return Response.json({
      id: response.result.id,
      status: response.result.status,
    });
  } catch (error: any) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

### Step 8: Setup Webhook

1. Go to PayPal Dashboard → Accounts Settings
2. Click "Notifications"
3. Click "Update"
4. Enter webhook URL: `https://yourdomain.com/api/webhooks/paypal`
5. Select event: `checkout.order.completed`
6. Copy Webhook ID to `PAYPAL_WEBHOOK_ID`

### Step 9: Implement Webhook Handler

Create `/api/webhooks/paypal` endpoint:

```typescript
import crypto from 'crypto';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Verify webhook signature (see PayPal docs for full verification)
  // Implementation depends on your framework

  if (body.event_type === 'CHECKOUT.ORDER.COMPLETED') {
    const orderId = body.resource.id;

    // Find and confirm deposit
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: deposits } = await supabase
      .from('task_deposits')
      .select('task_id')
      .eq('external_reference', orderId)
      .single();

    if (deposits) {
      await supabase.rpc('confirm_deposit_payment', {
        _task_id: deposits.task_id,
        _external_reference: body.id,
      });
    }
  }

  return Response.json({ id: body.id });
}
```

### Testing
- Use sandbox credentials
- Test email: Create at [developer.paypal.com](https://developer.paypal.com) under accounts
- Use test email for checkout
- Check webhook delivery in Sandbox settings

---

## Environment Variables Checklist

### Frontend (.env.local)
```bash
# Stripe
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx

# M-Pesa
VITE_MPESA_CONSUMER_KEY=xxx
VITE_MPESA_CONSUMER_SECRET=xxx

# PayPal
VITE_PAYPAL_CLIENT_ID=xxx
VITE_PAYPAL_ENVIRONMENT=sandbox
```

### Backend (.env)
```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# M-Pesa
MPESA_CONSUMER_KEY=xxx
MPESA_CONSUMER_SECRET=xxx
MPESA_BUSINESS_SHORTCODE=xxx
MPESA_SHORTCODE_PASSKEY=xxx
MPESA_CALLBACK_URL=https://yourdomain.com/api/webhooks/mpesa

# PayPal
PAYPAL_CLIENT_ID=xxx
PAYPAL_CLIENT_SECRET=xxx
PAYPAL_WEBHOOK_ID=xxx
```

---

## Testing Checklist

- [ ] Create account with payment provider
- [ ] Get API credentials
- [ ] Add environment variables
- [ ] Implement endpoints
- [ ] Setup webhooks
- [ ] Test with sandbox credentials
- [ ] Create task with deposit
- [ ] Complete payment flow
- [ ] Verify webhook callback
- [ ] Confirm deposit in database

---

## Troubleshooting

### Stripe
- **Issue**: "Invalid public key"
  - Solution: Ensure key starts with `pk_` (not `sk_`)
- **Issue**: Webhook not receiving
  - Solution: Check endpoint URL and webhook secrets in Stripe Dashboard

### M-Pesa
- **Issue**: "Invalid credentials"
  - Solution: Verify Consumer Key and Secret are correct
- **Issue**: "Phone number invalid"
  - Solution: Use format `254712345678` (no 0 prefix)

### PayPal
- **Issue**: "Missing PayPal SDK"
  - Solution: Ensure Client ID is set and SDK loads before checkout
- **Issue**: "Webhook not delivering"
  - Solution: Check webhook URL is accessible and returns 200 status

---

## Production Considerations

1. **Switch to Live Keys**: Replace test credentials with production keys
2. **Enable Https**: Webhooks require HTTPS
3. **Monitor Transactions**: Log all payment activity
4. **Handle Retries**: Implement retry logic for failed payments
5. **Test Coverage**: Create integration tests for payment flows
6. **Error Recovery**: Implement transaction reconciliation
7. **Compliance**: Ensure PCI compliance and data protection

---

## Support Resources

- **Stripe**: [stripe.com/docs](https://stripe.com/docs)
- **M-Pesa**: [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
- **PayPal**: [developer.paypal.com](https://developer.paypal.com)
