# Implementation Checklist: 50% Deposit Feature Completion

Use this checklist to track your progress implementing the 50% deposit feature with payment gateway integration.

## Phase 1: Initial Setup ✅ (Complete)

- [x] Database schema created
- [x] React hooks implemented
- [x] UI components built
- [x] PostTask integration complete
- [x] TypeScript types updated
- [x] Build passing without errors
- [x] Documentation written

## Phase 2: Environment Setup

### 2.1 Choose Payment Provider(s)
- [ ] Decide which provider(s) to use:
  - [ ] Stripe (Recommended for global)
  - [ ] M-Pesa (Recommended for Kenya)
  - [ ] PayPal (Recommended for PayPal users)

### 2.2 Create Developer Accounts
- [ ] Stripe:
  - [ ] Sign up at stripe.com
  - [ ] Complete identity verification
  - [ ] Access Dashboard → Developers → API keys
  
- [ ] M-Pesa (Safaricom):
  - [ ] Sign up at developer.safaricom.co.ke
  - [ ] Create new app
  - [ ] Get Consumer Key & Secret
  
- [ ] PayPal:
  - [ ] Sign up at developer.paypal.com
  - [ ] Create business app
  - [ ] Get Client ID & Secret

### 2.3 Collect API Credentials
- [ ] Stripe Public Key: `pk_test_...`
- [ ] Stripe Secret Key: `sk_test_...`
- [ ] Stripe Webhook Secret: `whsec_...`
- [ ] M-Pesa Consumer Key
- [ ] M-Pesa Consumer Secret
- [ ] M-Pesa Business Shortcode
- [ ] M-Pesa Shortcode Passkey
- [ ] PayPal Client ID
- [ ] PayPal Client Secret
- [ ] PayPal Webhook ID (generated after setup)

## Phase 3: Frontend Configuration

### 3.1 Add Environment Variables
- [ ] Create `.env.local` file in project root
- [ ] Add Stripe variables (if using Stripe)
- [ ] Add M-Pesa variables (if using M-Pesa)
- [ ] Add PayPal variables (if using PayPal)
- [ ] Add Supabase variables (already configured?)

**Command:**
```bash
# Verify variables are loaded
npm run dev
# Check browser console: console.log(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
```

### 3.2 Test Frontend Integration
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to "Post Task" page
- [ ] Fill in task form
- [ ] Verify deposit amount displays at 50% of budget
- [ ] Verify "Post Task & Pay Deposit" button shows
- [ ] Click submit and verify modal opens
- [ ] Verify payment method selection works
- [ ] Verify modal styling is correct

## Phase 4: Backend API Setup

### 4.1 Setup Backend Framework (if not done)
- [ ] Choose framework: Express, Fastify, Next.js API routes, etc.
- [ ] Setup project structure
- [ ] Install required dependencies

### 4.2 Implement Stripe Integration
- [ ] Install Stripe SDK: `npm install stripe`
- [ ] Create `POST /api/payments/stripe/create-intent` endpoint
  - [ ] Copy code from `src/integrations/stripe/client.ts`
  - [ ] Add stripe secret key validation
  - [ ] Test locally: call endpoint and verify intent creation
  
- [ ] Create Stripe Webhook endpoint: `POST /api/webhooks/stripe`
  - [ ] Copy code from integration template
  - [ ] Verify webhook signature
  - [ ] Call `confirm_deposit_payment()` RPC
  - [ ] Return 200 status

**Test:**
```bash
curl -X POST http://localhost:3000/api/payments/stripe/create-intent \
  -H "Content-Type: application/json" \
  -d '{"depositAmount": 50, "taskId": "xxx", "clientId": "xxx", "clientEmail": "user@example.com"}'
```

### 4.3 Implement M-Pesa Integration
- [ ] Install axios: `npm install axios`
- [ ] Create `POST /api/payments/mpesa/stk-push` endpoint
  - [ ] Copy code from `src/integrations/mpesa/client.ts`
  - [ ] Implement `getMpesaAccessToken()` helper
  - [ ] Test with sandbox credentials
  
- [ ] Create M-Pesa Callback endpoint: `POST /api/webhooks/mpesa`
  - [ ] Parse M-Pesa callback data
  - [ ] Validate payment success
  - [ ] Call `confirm_deposit_payment()` RPC
  - [ ] Return M-Pesa formatted response

**Test with sandbox till:**
```bash
# Safaricom provides test phone: 254708374149
# Use amount: 1 (minimum for sandbox)
```

### 4.4 Implement PayPal Integration
- [ ] Install PayPal SDK: `npm install @paypal/checkout-server-sdk`
- [ ] Create `POST /api/payments/paypal/create-order` endpoint
  - [ ] Copy code from `src/integrations/paypal/client.ts`
  - [ ] Create PayPal order with deposit amount
  - [ ] Store order ID in database
  - [ ] Return order ID to frontend
  
- [ ] Create `POST /api/payments/paypal/capture-order` endpoint
  - [ ] Capture PayPal order
  - [ ] Call `confirm_deposit_payment()` RPC
  - [ ] Return capture result

**Test:**
```bash
# Use PayPal sandbox credentials
# Test email and account from developer.paypal.com
```

### 4.5 Implement Webhook Handlers
- [ ] Stripe webhook: Verify signature and process
- [ ] M-Pesa webhook: Parse callback and process
- [ ] PayPal webhook: Verify event and process

**Critical:** Make sure webhooks:
- [ ] Return 200 OK immediately
- [ ] Process payment asynchronously
- [ ] Handle duplicate webhooks gracefully
- [ ] Log all events for debugging

## Phase 5: Database & Supabase Setup

### 5.1 Run Migrations
- [ ] Run migration: `20260227_task_deposits.sql`
  ```bash
  # Using Supabase CLI:
  supabase migration up
  # Or manually run SQL in Supabase dashboard
  ```

- [ ] Verify tables created:
  - [ ] `task_deposits` table exists
  - [ ] RLS policies applied
  - [ ] Functions created: `process_task_deposit`, `confirm_deposit_payment`

### 5.2 Show Supabase RPC Signatures
- [ ] Verify `process_task_deposit` accepts correct parameters
- [ ] Verify `confirm_deposit_payment` accepts correct parameters
- [ ] Test RPC functions manually in Supabase dashboard

**Test RPC:**
```sql
-- In Supabase SQL Editor
SELECT * FROM process_task_deposit(
  _task_id := 'task-uuid'::uuid,
  _deposit_amount := 50.00,
  _payment_method := 'stripe'::payment_method
);
```

## Phase 6: Connect Frontend to Backend

### 6.1 Update useTaskDeposit Hook
- [ ] Modify endpoint URLs in `initiatePayment()` function
  - [ ] Change `/api/payments/` to your backend URL
  - [ ] Add authentication headers if needed

### 6.2 Update DepositPaymentModal
- [ ] Ensure payment method options match your providers
- [ ] Adjust styling if needed
- [ ] Add/remove payment method buttons based on which you're using

### 6.3 Update PostTask Component
- [ ] Verify task creation happens correctly
- [ ] Verify payment modal opens after task creation
- [ ] Test complete flow: Form → Modal → Payment selection

## Phase 7: Setup Webhooks in Payment Providers

### 7.1 Stripe Webhooks
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Enter webhook URL: `https://yourdomain.com/api/webhooks/stripe`
- [ ] Select events:
  - [ ] `payment_intent.succeeded`
  - [ ] `payment_intent.payment_failed`
- [ ] Copy webhook secret to `.env`: `STRIPE_WEBHOOK_SECRET=`
- [ ] Test webhook (Stripe provides test button)

### 7.2 M-Pesa Webhooks
- [ ] Go to Safaricom Daraja → Your App → Online Shortcode
- [ ] Set Callback URL: `https://yourdomain.com/api/webhooks/mpesa`
- [ ] Set Timeout URL: `https://yourdomain.com/api/webhooks/mpesa/timeout`
- [ ] Save configuration
- [ ] Note: M-Pesa doesn't have test webhook button; test with actual payment

### 7.3 PayPal Webhooks
- [ ] Go to PayPal Dashboard → Account Settings → Notifications
- [ ] Click "Update"
- [ ] Set Webhook URL: `https://yourdomain.com/api/webhooks/paypal`
- [ ] Select event: `checkout.order.completed`
- [ ] Copy Webhook ID to `.env`: `PAYPAL_WEBHOOK_ID=`
- [ ] Test webhook in PayPal Dashboard

## Phase 8: Testing

### 8.1 Test with Sandbox Credentials
- [ ] Stripe:
  - [ ] Use test card: `4242 4242 4242 4242`
  - [ ] Use any future expiry and 3-digit CVC
  
- [ ] M-Pesa:
  - [ ] Use test phone: `254708374149`
  - [ ] Use amount: `1` (minimum)
  
- [ ] PayPal:
  - [ ] Create sandbox accounts at developer.paypal.com
  - [ ] Use test buyer account for payments

### 8.2 Complete Payment Flow Test
- [ ] Create new task with $100 budget
- [ ] Verify deposit shows as $50
- [ ] Submit task → Modal opens
- [ ] Select payment method
- [ ] Complete payment with sandbox credentials
- [ ] Verify webhook executes
- [ ] Check `task_deposits` table: status should be 'completed'
- [ ] Check `transactions` table: transaction should show deposit
- [ ] Verify user wallet balance updated

### 8.3 Error Scenarios
- [ ] Test insufficient balance (if wallet-based)
- [ ] Test payment decline (card/M-Pesa failure)
- [ ] Test webhook timeout (manual retry)
- [ ] Test duplicate webhook (should handle gracefully)

### 8.4 Browser Testing
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on mobile (iPhone)
- [ ] Test on mobile (Android)

## Phase 9: Monitoring & Logging

### 9.1 Setup Logging
- [ ] Log all payment initiation attempts
- [ ] Log all webhook events received
- [ ] Log payment confirmations
- [ ] Log errors with context

### 9.2 Setup Monitoring
- [ ] Monitor webhook success rate
- [ ] Monitor payment failure rate
- [ ] Setup alerts for payment failures
- [ ] Track deposit completion rate

## Phase 10: Production Deployment

### 10.1 Prepare for Production
- [ ] Switch to live payment keys
- [ ] Update webhook URLs to production
- [ ] Setup HTTPS (required for webhooks)
- [ ] Setup database backups
- [ ] Setup error tracking (Sentry, etc.)

### 10.2 Pre-Launch Checklist
- [ ] Test with real payment methods (small amount)
- [ ] Verify email notifications send (if implemented)
- [ ] Verify analytics tracking works
- [ ] Load test: handle 100 concurrent deposits
- [ ] Security review: check for vulnerabilities
- [ ] Compliance review: PCI, data protection

### 10.3 Launch
- [ ] Enable in production environment
- [ ] Monitor first 24 hours closely
- [ ] Have support team prepared
- [ ] Have rollback plan ready

## Phase 11: Post-Launch

### 11.1 Monitor Metrics
- [ ] Success rate of deposits
- [ ] Failed payment recovery rate
- [ ] User feedback on experience
- [ ] Support tickets related to payments

### 11.2 Optimize
- [ ] A/B test payment methods
- [ ] Optimize UI based on user feedback
- [ ] Reduce payment failure rate
- [ ] Improve webhook reliability

### 11.3 Maintain
- [ ] Rotate API keys monthly
- [ ] Update dependencies regularly
- [ ] Review and update security policies
- [ ] Process refunds and disputes

## Troubleshooting Guide

### Issue: "API Key not found"
- [ ] Check `.env.local` file exists
- [ ] Restart dev server
- [ ] Check variable name matches exactly

### Issue: "Webhook not receiving"
- [ ] Verify webhook URL is HTTPS
- [ ] Check URL in provider dashboard matches code
- [ ] Verify firewall allows webhook IPs
- [ ] Check backend is running and accessible

### Issue: "Payment succeeded but deposit not confirmed"
- [ ] Check webhook was called (check logs)
- [ ] Verify RPC function signature matches
- [ ] Check `confirm_deposit_payment` error in database
- [ ] Manually call RPC to test

### Issue: "Balance deducted but payment failed"
- [ ] Check wallet transaction logic
- [ ] Implement rollback on payment failure
- [ ] Add test for refund logic

## Completion Checklist

When everything is complete, verify:

- [ ] All API endpoints implemented and tested
- [ ] All webhooks receiving and processing events
- [ ] Full payment flow works end-to-end
- [ ] Error handling and edge cases covered
- [ ] Logging and monitoring in place
- [ ] Documentation updated with any changes
- [ ] Team trained on new feature
- [ ] Rollback plan documented
- [ ] Support materials prepared
- [ ] Go-live date confirmed

## Timeline Estimate

| Phase | Estimated Time | Notes |
|-------|----------------|-------|
| Phase 1-2 | Already Done | ✅ |
| Phase 3 | 30 min | Copy variables |
| Phase 4 | 2-3 hours | Implement 1-3 providers |
| Phase 5 | 30 min | Run migrations |
| Phase 6 | 1 hour | Connect frontend to backend |
| Phase 7 | 1 hour | Setup webhooks |
| Phase 8 | 2-3 hours | Comprehensive testing |
| Phase 9 | 1 hour | Setup monitoring |
| Phase 10-11 | 2-4 hours | Deploy and monitor |

**Total Time**: 8-14 hours for full implementation with testing

## Need Help?

1. Refer to `PAYMENT_INTEGRATION.md` for detailed setup
2. Check integration files in `src/integrations/`
3. Review provider documentation (links in guide)
4. Check webhook logs in provider dashboards
5. Review application logs for errors

## Notes for Your Team

- Share this checklist with your development team
- Assign Phase 4 (Backend) to backend developer
- Assign Phase 7 (Webhooks) to DevOps/Backend
- Review Phase 9 (Monitoring) during launch planning
- Schedule Phase 10 (Production) launch meeting 1 week before
