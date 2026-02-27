# 50% Deposit Feature Implementation

## Overview
This document describes the 50% deposit feature implemented for task posting on the nextgig platform. When clients post tasks, they are required to pay 50% of the task budget as a deposit before the task becomes active.

## Features Implemented

### 1. Database Schema (`supabase/migrations/20260227_task_deposits.sql`)
- **task_deposits table**: Stores deposit payment information
  - `id`: Unique deposit record identifier
  - `task_id`: Reference to the task being funded
  - `client_id`: Reference to the client making the deposit
  - `deposit_amount`: 50% of task budget
  - `original_budget`: Full task budget
  - `payment_status`: pending, processing, completed, failed
  - `payment_method`: stripe, mpesa, paypal
  - `external_reference`: Payment provider reference
  - `transaction_id`: Link to escrow transaction
  - `paid_at`: Timestamp when deposit was confirmed

### 2. Database Functions
- **process_task_deposit()**: Initiates deposit payment
  - Creates deposit record
  - Creates transaction for escrow tracking
  - Deducts from wallet available_balance
  - Returns deposit and transaction IDs

- **confirm_deposit_payment()**: Confirms payment completion (admin/callback only)
  - Updates deposit status to 'completed'
  - Marks transaction as held in escrow
  
- **is_deposit_paid()**: Checks if deposit is paid for a task
- **get_task_deposit()**: Retrieves deposit details for a task

### 3. Row Level Security (RLS)
- Clients can view their own deposits
- Clients can create deposits for their tasks
- Admins have full access to all deposits

### 4. React Hook (`src/hooks/useTaskDeposit.ts`)
`useTaskDeposit()` hook provides:
- `calculateTaskDeposit()`: Calculate 50% of budget
- `formatCurrency()`: Format amounts as USD
- `depositAmount`: Current deposit for budget
- `depositStatus`: Current payment status
- `initiatePayment()`: Start payment flow
- `confirmPayment()`: Confirm payment completion
- `isProcessing`: Loading state for payments

### 5. UI Components

#### DepositPaymentModal (`src/components/dashboard/DepositPaymentModal.tsx`)
Modal dialog showing:
- Task summary with budget and deposit amount
- Payment method selection (Stripe, M-Pesa, PayPal)
- Escrow explanation
- Payment processing state

#### PostTask Page (`src/pages/PostTask.tsx`)
Updated to:
- Display deposit amount based on budget input
- Show escrow explanation alert
- Create task first, then show payment modal
- Integrate with payment hook
- Update button to "Post Task & Pay Deposit"

## Payment Flow

```
1. Client fills out task form
   ├─ Title, description, category
   ├─ Budget (5 - 100,000 USD)
   └─ Deadline

2. UI calculates 50% deposit
   └─ Displays as green alert

3. Client clicks "Post Task & Pay Deposit"
   ├─ Task created in database
   └─ Deposit payment modal opens

4. Client selects payment method
   ├─ Stripe (Credit cards)
   ├─ M-Pesa (Mobile money)
   └─ PayPal

5. Payment initiated
   ├─ process_task_deposit() called
   ├─ Deposit record created
   ├─ Transaction record created
   └─ Wallet balance deducted

6. Payment provider processes (Stripe/M-Pesa/PayPal)
   └─ (API integration required - keys needed)

7. Payment callback confirms deposit
   ├─ confirm_deposit_payment() called
   ├─ Deposit status → 'completed'
   └─ Transaction escrow_status → 'held'

8. Task becomes active
   └─ Freelancers can submit bids
```

## API Integration Points

### Next Steps (API Keys Required)
1. **Stripe Integration** (`payment.ts`)
   - Endpoint: `stripe.com/v1/payment_intents`
   - Reference: `external_reference` (Stripe Intent ID)
   - Response: `client_secret` for frontend payment UI

2. **M-Pesa Integration** (`mpesa.ts`)
   - Endpoint: M-Pesa STK Push API
   - Reference: `CheckoutRequestID`
   - Callback: Webhook to `confirm_deposit_payment()`

3. **PayPal Integration** (`paypal.ts`)
   - Endpoint: `api.paypal.com/v2/checkout/orders`
   - Reference: `id` (Order ID)
   - Callback: Webhook to `confirm_deposit_payment()`

## Database Enums Updated
- `payment_method`: Added 'paypal' to existing ['stripe', 'mpesa']

## Type Definitions Updated (`src/integrations/supabase/types.ts`)
- Added `task_deposits` table type definition
- Added RPC function signatures:
  - `process_task_deposit()`
  - `confirm_deposit_payment()`
  - `is_deposit_paid()`
  - `get_task_deposit()`
- Updated `payment_method` enum to include 'paypal'

## Wallet Integration
The deposit feature integrates with the existing wallet system:
- Available balance is deducted when deposit is initiated
- Pending balance tracks held escrow amounts
- Upon task completion, freelancer receives payment
- Upon cancellation, client receives refund

## Error Handling
- Auth validation: User must be logged in
- Task creation: Validates form data before task creation
- Payment initiation: Validates task exists and not already paid
- Payment confirmation: Admin-only with external reference validation

## Toast Notifications
- Task creation success/failure
- Payment initiation feedback
- Payment confirmation
- Error messages with details

## Frontend State Management
- `createdTaskId`: Stores task ID before payment
- `taskForm`: Stores form values for deposit calculation
- `showDepositModal`: Controls modal visibility
- `isProcessing`: Tracks payment processing

## Placeholder Implementation
The current implementation includes:
- ✅ Database schema and functions
- ✅ RLS policies
- ✅ React hooks and state management
- ✅ UI components and modals
- ✅ Form integration
- ⏳ Payment provider API calls (needs keys)
- ⏳ Payment success/failure handling
- ⏳ Webhook callbacks from providers

## Testing the Feature

### Without Payment Gateway Keys
1. Fill out task form
2. Set budget (e.g., $100)
3. Submit form
4. Deposit amount shown ($50)
5. Select payment method
6. See toast: "Payment initiated for $50.00..."
7. Simulated success after 2 seconds

### With Payment Gateway Keys
1. Follow steps 1-4 above
2. Client redirected to payment provider
3. Provider returns success/failure
4. Webhook confirms payment
5. Task becomes active
6. Freelancers can bid

## Configuration
Users need to provide API keys for:
- Stripe Public Key
- M-Pesa API credentials
- PayPal Client ID

Add these to environment variables:
```
VITE_STRIPE_PUBLIC_KEY=pk_...
VITE_MPESA_API_KEY=...
VITE_PAYPAL_CLIENT_ID=...
```

## Security Considerations
- ✅ RLS policies enforce user permissions
- ✅ Server-side validation in Supabase functions
- ✅ Payment status tracked server-side
- ✅ Escrow prevents double-spending
- ⏳ Webhook signature validation (for payment callbacks)
- ⏳ PCI compliance (handled by payment providers)

## Future Enhancements
1. Payment retry mechanism
2. Partial refund support
3. Deposit amount customization (different percentages)
4. Payment plan options (installments)
5. Multi-currency support
6. Payment receipt generation
7. Auto-refund for cancelled tasks
8. Dispute resolution workflow
