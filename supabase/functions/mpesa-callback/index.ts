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

    const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (ResultCode === 0) {
      // Payment successful
      let mpesaReceipt = "";
      if (CallbackMetadata?.Item) {
        const receiptItem = CallbackMetadata.Item.find(
          (item: any) => item.Name === "MpesaReceiptNumber"
        );
        mpesaReceipt = receiptItem?.Value || "";
      }

      await supabase
        .from("bid_fee_payments")
        .update({
          status: "completed",
          mpesa_receipt: mpesaReceipt,
        })
        .eq("checkout_request_id", CheckoutRequestID);
    } else {
      // Payment failed
      await supabase
        .from("bid_fee_payments")
        .update({ status: "failed" })
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
