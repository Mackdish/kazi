import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;

    if (!callback) {
      return new Response(JSON.stringify({ error: "Invalid callback" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      MerchantRequestID,
      Timestamp,
      CallbackMetadata,
    } = callback;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract M-Pesa receipt number from callback metadata
    let mpesaReceipt = "";
    let mpesaAmount = 0;
    if (CallbackMetadata?.Item) {
      const receiptItem = CallbackMetadata.Item.find(
        (item: any) => item.Name === "MpesaReceiptNumber"
      );
      const amountItem = CallbackMetadata.Item.find(
        (item: any) => item.Name === "Amount"
      );
      mpesaReceipt = receiptItem?.Value || "";
      mpesaAmount = amountItem?.Value || 0;
    }

    // Build callback metadata object with all response fields
    // M-Pesa amounts are in KES (Kenyan Shillings)
    const callbackMetadata = {
      result_code: ResultCode,
      result_desc: ResultDesc,
      merchant_request_id: MerchantRequestID,
      checkout_request_id: CheckoutRequestID,
      timestamp: Timestamp,
      mpesa_receipt_number: mpesaReceipt,
      amount: mpesaAmount,
      currency: "KES",
    };

    if (ResultCode === 0) {
      // Payment successful
      await supabase
        .from("bid_fee_payments")
        .update({
          status: "completed",
          mpesa_receipt: mpesaReceipt,
          callback_metadata: callbackMetadata,
        })
        .eq("checkout_request_id", CheckoutRequestID);
    } else {
      // Payment failed
      await supabase
        .from("bid_fee_payments")
        .update({
          status: "failed",
          callback_metadata: callbackMetadata,
        })
        .eq("checkout_request_id", CheckoutRequestID);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Callback error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
