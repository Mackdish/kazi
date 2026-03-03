# STK Push Error - Root Cause & Fix

## 🐛 Issue Found & Fixed

### **The Problem**
The edge function was trying to access the API key with the wrong environment variable name.

**BEFORE (Incorrect):**
```typescript
const TUMA_API_KEY = Deno.env.get("tuma_a067865ec91a2bb49c734ee9e5ad95dda3f30c7bc7f9c08c436e1d4632808a0d_1772307722");
```

This tries to get an env variable named `tuma_a067865ec91a2...` which doesn't exist!

**AFTER (Correct):**
```typescript
const TUMA_API_KEY = Deno.env.get("TUMA_API_KEY");
```

This correctly retrieves the `TUMA_API_KEY` environment variable where the actual API key value is stored.

### **Why This Caused Non-2xx Errors**

1. `TUMA_API_KEY` would be `undefined`
2. The startup validation logs: "Missing TUMA_API_KEY environment variable"
3. Request handler checks if key exists → It doesn't → Returns 500 error
4. Error message: "Payment service not configured"

---

## ✅ What Was Fixed

✅ **Line 13** - Changed from using API key as env var name → Using correct env var name  
✅ **Environment validation** - Now properly detects missing API key

---

## 🚀 How to Verify the Fix

### 1. **Check Supabase Secrets Are Set**
```bash
# View your secrets
npx supabase secrets list
```

Should show:
```
name                 value
───────────────────  ─────────
TUMA_API_KEY         [configured]
```

### 2. **Deploy the Fixed Function**
```bash
# Redeploy with the fix
npx supabase functions deploy mpesa-stk-push
```

### 3. **Test the Payment Flow**

**Via Frontend:**
1. Go to a task page
2. Click "Place Bid"
3. Enter phone number (e.g., 0712345678)
4. Submit form
5. Check if STK prompt appears on phone

**Expected Success Response (200):**
```json
{
  "success": true,
  "message": "STK push sent successfully. Check your phone to complete payment.",
  "request_id": "uuid-from-tuma",
  "amount": 30,
  "currency": "KES"
}
```

### 4. **Check Logs for Debugging**
```bash
# Monitor edge function logs in real-time
npx supabase functions logs mpesa-stk-push --follow
```

Look for:
- ✅ "Initiating Tuma STK Push" → STK call started
- ✅ "Tuma STK Push successful" → API returned data
- ✅ "STK Push initiated successfully" → Database updated

---

## 🔍 Common Error Responses & Solutions

| Status | Error | Cause | Solution |
|--------|-------|-------|----------|
| 500 | "Payment service not configured" | TUMA_API_KEY not set | Run `npx supabase secrets set TUMA_API_KEY="..."` |
| 400 | "Missing required fields" | Missing phone_number/payment_id/user_id | Check frontend is sending all fields |
| 400 | "Invalid UUID format" | Malformed payment_id or user_id | Verify UUID format |
| 404 | "Payment record not found" | Payment ID doesn't exist in DB | Check payment was created first |
| 500 | "Tuma API error: 401" | Wrong/expired API key | Verify API key value in Supabase secrets |
| 500 | "Failed to initiate STK push" | Tuma API down or blocked | Check Tuma status & firewall |

---

## 🔐 Verification Checklist

- [ ] **API Key Configured**
  ```bash
  npx supabase secrets list | grep TUMA_API_KEY
  ```

- [ ] **Function Deployed**
  ```bash
  npx supabase functions list | grep mpesa-stk-push
  ```

- [ ] **config.toml Updated**
  - Check `env = ["TUMA_API_KEY"]` is set for both functions

- [ ] **Environment Variables in .env**
  - `TUMA_API_KEY="tuma_a067..."`

- [ ] **Edge Function Code Fixed**
  - Line 13 should be: `const TUMA_API_KEY = Deno.env.get("TUMA_API_KEY");`

- [ ] **Frontend Hook Working**
  - Sending all required fields: phone_number, payment_id, user_id

---

## 📊 Request/Response Flow

```
Frontend (useBidFeePayment)
    ↓
    Creates payment record in DB
    ↓
    Calls edge function (mpesa-stk-push)
    ↓
Edge Function
    ✓ Gets TUMA_API_KEY from environment
    ✓ Validates request body
    ✓ Fetches payment record from DB
    ✓ Calls Tuma API with Bearer token
    ↓
Tuma API
    ✓ Returns request_id
    ↓
Edge Function
    ✓ Updates DB with request_id
    ✓ Returns 200 success
    ↓
Frontend
    ✓ Shows success message
    ✓ Polls database for status updates
```

---

## 🎯 Next Steps

1. **Redeploy the fixed function**
   ```bash
   npx supabase functions deploy mpesa-stk-push
   ```

2. **Test with a real payment flow**
   - Use a test phone number if available
   - Monitor logs during test

3. **Check database for payment record**
   ```sql
   SELECT id, user_id, status, checkout_request_id, created_at
   FROM bid_fee_payments
   ORDER BY created_at DESC
   LIMIT 1;
   ```

4. **Verify callback webhook is configured**
   - Tuma should POST to `https://your-domain/functions/v1/tuma-callback` on payment completion

---

## 📝 Summary

**Root Cause**: API key environment variable not correctly retrieved  
**Fix**: Changed line 13 to use `"TUMA_API_KEY"` instead of the full key value  
**Status**: ✅ Fixed and ready to redeploy  
**Impact**: Edge function will now properly authenticate with Tuma API
