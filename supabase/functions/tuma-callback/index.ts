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
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Invalid JSON in callback:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Tuma webhook structure validation
    if (!body || typeof body !== "object") {
      console.warn("Invalid webhook payload");
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract Tuma payment callback data
    const {
      request_id,
      status,
      amount,
      phone_number,
      transaction_id,
      error_message,
      error_code,
      timestamp,
    } = body;

    if (!request_id || !status) {
      console.warn("Missing required callback fields:", { request_id, status });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Build callback metadata object with all response fields
    const callbackMetadata = {
      request_id,
      status,
      amount,
      phone_number,
      transaction_id,
      error_message,
      error_code,
      timestamp: timestamp || new Date().toISOString(),
      currency: "KES",
    };

    console.log("Processing Tuma callback:", callbackMetadata);

    if (status === "completed" || status === "success") {
      // ✅ Payment successful - update payment record
      const { data: payment, error: fetchError } = await supabase
        .from("bid_fee_payments")
        .select("id, user_id, task_id")
        .eq("checkout_request_id", request_id)
        .single();

      if (fetchError || !payment) {
        console.error("Payment record not found for request_id:", request_id);
        return new Response(
          JSON.stringify({ error: "Payment record not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update payment status to completed
      const { error: updateError } = await supabase
        .from("bid_fee_payments")
        .update({
          status: "completed",
          mpesa_receipt: transaction_id || "",
          callback_metadata: callbackMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("Failed to update payment record:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to process payment" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Payment completed successfully:", {
        payment_id: payment.id,
        user_id: payment.user_id,
        task_id: payment.task_id,
        transaction_id,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment processed successfully",
          payment_id: payment.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (
      status === "failed" ||
      status === "cancelled" ||
      status === "timeout"
    ) {
      // ❌ Payment failed or cancelled - update to failed status
      const { data: payment, error: fetchError } = await supabase
        .from("bid_fee_payments")
        .select("id")
        .eq("checkout_request_id", request_id)
        .single();

      if (fetchError || !payment) {
        console.warn("Payment record not found for failed request:", request_id);
        return new Response(
          JSON.stringify({ error: "Payment record not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabase
        .from("bid_fee_payments")
        .update({
          status: "failed",
          callback_metadata: callbackMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.id);

      if (updateError) {
        console.error("Failed to update failed payment record:", updateError);
      }

      console.log("Payment failed:", {
        payment_id: payment.id,
        failure_reason: status,
      });

      return new Response(
        JSON.stringify({
          success: false,
          message: `Payment ${status}`,
          payment_id: payment.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // ⏳ Pending or unknown status
      console.log("Payment in pending state:", { request_id, status });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment status received",
          status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Unhandled callback error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
