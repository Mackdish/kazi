/**
 * M-Pesa Payment Integration Handler
 * This file handles payment processing with M-Pesa
 * 
 * Setup:
 * 1. Get Safaricom M-Pesa API credentials from Daraja
 * 2. Add environment variables:
 *    - VITE_MPESA_CONSUMER_KEY
 *    - VITE_MPESA_CONSUMER_SECRET
 *    - VITE_MPESA_ENVIRONMENT (sandbox/production)
 * 3. Create M-Pesa callback endpoint for payment confirmation
 */

export interface MpesaPaymentParams {
  taskId: string;
  depositAmount: number;
  clientId: string;
  phoneNumber: string; // E.g., 254712345678
}

export interface MpesaSTKPushRequest {
  depositAmount: number;
  phoneNumber: string;
  taskId: string;
  clientId: string;
}

/**
 * Initiate M-Pesa STK Push
 * Prompts user with payment prompt on their phone
 */
export const initiateMpesaSTKPush = async (
  params: MpesaPaymentParams
) => {
  try {
    const response = await fetch("/api/payments/mpesa/stk-push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        depositAmount: params.depositAmount,
        phoneNumber: params.phoneNumber,
        taskId: params.taskId,
        clientId: params.clientId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to initiate M-Pesa payment");
    }

    const data = await response.json();
    return data; // { checkoutRequestId, responseCode }
  } catch (error) {
    console.error("M-Pesa STK push error:", error);
    throw error;
  }
};

/**
 * Query M-Pesa STK Push Status
 * Check if user completed payment
 */
export const queryMpesaSTKStatus = async (
  checkoutRequestId: string
) => {
  try {
    const response = await fetch("/api/payments/mpesa/query-stk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        checkoutRequestId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to query M-Pesa status");
    }

    const data = await response.json();
    return data; // { resultCode, resultDesc, mpesaReceiptNumber }
  } catch (error) {
    console.error("M-Pesa status query error:", error);
    throw error;
  }
};

/**
 * Backend Endpoint (to be implemented in backend)
 * POST /api/payments/mpesa/stk-push
 * 
 * Handler pseudocode:
 * 
 * async (req, res) => {
 *   const { depositAmount, phoneNumber, taskId, clientId } = req.body;
 *   
 *   // Get access token from Safaricom
 *   const accessToken = await getMpesaAccessToken();
 *   
 *   // Format phone number: remove leading 0, add 254
 *   const formattedPhone = formatPhoneForMpesa(phoneNumber);
 *   
 *   // Create STK push request
 *   const response = await axios.post(
 *     'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
 *     {
 *       BusinessShortCode: process.env.MPESA_SHORTCODE,
 *       Password: generateMpesaPassword(),
 *       Timestamp: generateTimestamp(),
 *       TransactionType: 'CustomerPayBillOnline',
 *       Amount: depositAmount,
 *       PartyA: formattedPhone,
 *       PartyB: process.env.MPESA_SHORTCODE,
 *       PhoneNumber: formattedPhone,
 *       CallBackURL: 'https://yourdomain.com/api/webhooks/mpesa',
 *       AccountReference: taskId,
 *       TransactionDesc: `Deposit for task ${taskId}`,
 *     },
 *     {
 *       headers: {
 *         Authorization: `Bearer ${accessToken}`,
 *       },
 *     }
 *   );
 *   
 *   // Store checkoutRequestId in database
 *   await supabase
 *     .from('task_deposits')
 *     .update({
 *       external_reference: response.data.CheckoutRequestID,
 *       payment_status: 'processing',
 *     })
 *     .eq('task_id', taskId);
 *   
 *   res.json({
 *     checkoutRequestId: response.data.CheckoutRequestID,
 *     responseCode: response.data.ResponseCode,
 *   });
 * }
 */

/**
 * Backend Endpoint for Query
 * POST /api/payments/mpesa/query-stk
 * 
 * Handler pseudocode:
 * 
 * async (req, res) => {
 *   const { checkoutRequestId } = req.body;
 *   
 *   const accessToken = await getMpesaAccessToken();
 *   
 *   const response = await axios.post(
 *     'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
 *     {
 *       BusinessShortCode: process.env.MPESA_SHORTCODE,
 *       Password: generateMpesaPassword(),
 *       Timestamp: generateTimestamp(),
 *       CheckoutRequestID: checkoutRequestId,
 *     },
 *     {
 *       headers: {
 *         Authorization: `Bearer ${accessToken}`,
 *       },
 *     }
 *   );
 *   
 *   res.json({
 *     resultCode: response.data.ResultCode,
 *     resultDesc: response.data.ResultDesc,
 *     mpesaReceiptNumber: response.data.MpesaReceiptNumber,
 *   });
 * }
 */

/**
 * Webhook Handler for M-Pesa Callback
 * POST /api/webhooks/mpesa
 * 
 * Handler pseudocode:
 * 
 * async (req, res) => {
 *   const { Body } = req.body;
 *   const stkCallback = Body.stkCallback;
 *   
 *   if (stkCallback.ResultCode === 0) {
 *     // Payment successful
 *     const callbackMetadata = stkCallback.CallbackMetadata.Item;
 *     const mpesaReceiptNumber = callbackMetadata.find(
 *       item => item.Name === 'MpesaReceiptNumber'
 *     )?.Value;
 *     
 *     const checkoutRequestId = stkCallback.CheckoutRequestID;
 *     
 *     // Find deposit by external reference
 *     const { data: deposits } = await supabase
 *       .from('task_deposits')
 *       .select('task_id')
 *       .eq('external_reference', checkoutRequestId);
 *     
 *     if (deposits?.length === 1) {
 *       // Confirm payment
 *       await supabase.rpc('confirm_deposit_payment', {
 *         _task_id: deposits[0].task_id,
 *         _external_reference: mpesaReceiptNumber,
 *       });
 *     }
 *   }
 *   
 *   res.json({});
 * }
 */

/**
 * Helper function to format phone number for M-Pesa
 * Input: 0712345678 or 712345678 or 254712345678
 * Output: 254712345678
 */
export const formatPhoneForMpesa = (phone: string): string => {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, "");

  // If it starts with 0, remove it
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }

  // If it doesn't start with 254, add it
  if (!cleaned.startsWith("254")) {
    cleaned = "254" + cleaned;
  }

  return cleaned;
};

/**
 * Helper function to validate M-Pesa phone number
 */
export const isValidMpesaPhone = (phone: string): boolean => {
  try {
    const formatted = formatPhoneForMpesa(phone);
    // Should be exactly 12 digits starting with 254
    // And the next 2 digits should be 71 or 72 or similar valid operators
    return /^254(7\d|41)\d{7}$/.test(formatted);
  } catch {
    return false;
  }
};
