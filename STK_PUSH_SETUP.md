# STK Push System - Setup & Debugging Guide

## ⚠️ Critical Issues Causing Non-2xx Errors

### 1. Missing TUMA_API_KEY Environment Variable
**Status**: ❌ Required - This is likely causing the error

The edge function requires the `TUMA_API_KEY` environment variable. Without it:
- The function returns 500 error
- Message: "Payment service not configured"

**Solution**:
```bash
# Add to your Supabase secrets
supabase secrets set TUMA_API_KEY="your-tuma-api-key"
```

Or in the Supabase dashboard:
- Go to Project Settings → Edge Functions → Environment Variables
- Add: `TUMA_API_KEY` = your actual Tuma API key

### 2. Verify Supabase Environment Variables
Ensure these are also set:
- `SUPABASE_URL` - Your project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin access

## 📋 Complete Setup Checklist

- [ ] **Set TUMA_API_KEY** in Supabase secrets
- [ ] **Verify Tuma API endpoint** is correct: `https://api.tuma.co.ke/stk-push`
- [ ] **Test phone number formatting** - supports 0XXXXXXXXX, 254XXXXXXXXX, 7XXXXXXXXX formats
- [ ] **Verify bid_fee_payments table exists** with correct schema
- [ ] **Test locally** before deploying:
  ```bash
  supabase functions serve mpesa-stk-push
  ```

## 🔍 Debugging Steps

### 1. Check Function Logs
```bash
# View real-time logs
supabase functions logs mpesa-stk-push --follow

# View recent logs
supabase functions logs mpesa-stk-push
```

### 2. Test with Sample Request
```bash
curl -X POST http://localhost:54321/functions/v1/mpesa-stk-push \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "phone_number": "0712345678",
    "payment_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001"
  }'
```

### 3. Check Payment Record Creation
```sql
SELECT * FROM bid_fee_payments 
WHERE id = 'your-payment-id'
ORDER BY created_at DESC;
```

### 4. Verify Tuma API Credentials
- Test Tuma credentials independently
- Ensure API key has permission for STK push
- Check if endpoint IP is whitelisted

## 📊 Response Format

### Success Response (200)
```json
{
  "success": true,
  "message": "STK push sent successfully. Check your phone to complete payment.",
  "request_id": "tuma-request-uuid",
  "amount": 30,
  "currency": "KES"
}
```

### Error Responses
- **400**: Invalid input (missing fields, invalid UUID, invalid phone)
- **404**: Payment record not found
- **500**: Server error (missing env vars, API failure, DB error)

## 🔧 Common Issues & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Payment service not configured" | TUMA_API_KEY not set | Add env variable |
| "Invalid phone number format" | Wrong phone format | Use 0XXXXXXXXX or 254XXXXXXXXX |
| "Payment record not found" | ID mismatch or wrong user | Verify IDs in request |
| "Tuma API error" | Bad API key or endpoint issue | Check credentials & endpoint |
| "Invalid UUID format" | Not a valid UUID | Verify UUID format |

## 📝 Database Schema
```sql
CREATE TABLE public.bid_fee_payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  amount NUMERIC,
  phone_number TEXT NOT NULL,
  checkout_request_id TEXT,  -- Tuma request ID
  mpesa_receipt TEXT,        -- Tuma transaction ID
  status TEXT DEFAULT 'pending',  -- pending, completed, failed
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🚀 Next Steps

1. **Set the TUMA_API_KEY environment variable**
2. **Deploy the functions**:
   ```bash
   supabase functions deploy mpesa-stk-push
   supabase functions deploy tuma-callback
   ```
3. **Test with the frontend**
4. **Monitor logs** for any additional errors
5. **Configure callback webhook** in Tuma dashboard to point to: `https://your-project.supabase.co/functions/v1/tuma-callback`
