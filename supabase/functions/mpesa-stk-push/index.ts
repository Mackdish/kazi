import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BID_AMOUNT = 30; // Fixed bid amount in KES

// Tuma API Configuration
const TUMA_API_BASE = "https://api.tuma.co.ke";
const TUMA_API_KEY = Deno.env.get("TUMA_API_KEY");

// Validate environment variables at startup
if (!Deno.env.get("SUPABASE_URL") || !Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) {
  console.error("Missing required Supabase environment variables");
}

if (!TUMA_API_KEY) {
  console.error("Missing TUMA_API_KEY environment variable");
}

function formatPhone(phone: string): string {
  let formatted = phone.replace(/\D/g, "");

  if (formatted.startsWith("0")) {
    formatted = "254" + formatted.substring(1);
  } else if (formatted.startsWith("7")) {
    formatted = "254" + formatted;
  }

  if (!formatted.startsWith("254") || formatted.length !== 12) {
    throw new Error("Invalid phone number format");
  }

  return formatted;
}

async function initiateTumaStkPush(
  phoneNumber: string,
  paymentId: string,
  amount: number
): Promise<{ request_id: string; message: string; status: string }> {
  const formattedPhone = formatPhone(phoneNumber);

  // Get Supabase project URL for callback
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL not configured");
  }

  const payload = {
    phone_number: formattedPhone,
    amount: amount,
    reference: `BidFee-${paymentId.substring(0, 8)}`,
    description: "Bid Fee Payment",
    callback_url: `${supabaseUrl}/functions/v1/tuma-callback`,
  };

  console.log("Initiating Tuma STK Push:", { 
    phone_number: formattedPhone, 
    amount, 
    reference: payload.reference 
  });

  const response = await fetch(`${TUMA_API_BASE}/stk-push`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TUMA_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Tuma API error:", { 
      status: response.status, 
      data 
    });
    throw new Error(
      `Tuma API error: ${data?.error_description || data?.message || "Unknown error"}`
    );
  }

  // Validate Tuma response structure
  if (!data?.request_id) {
    console.error("Invalid Tuma response:", data);
    throw new Error("Invalid Tuma API response: missing request_id");
  }

  console.log("Tuma STK Push successful:", { 
    request_id: data.request_id,
    status: data.status
  });

  return {
    request_id: data.request_id,
    message: data.message || "STK push initiated successfully",
    status: data.status || "pending",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check required environment variables
    if (!TUMA_API_KEY) {
      console.error("TUMA_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { phone_number, payment_id, user_id } = requestBody;

    // Validate input
    if (!phone_number || !payment_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: phone_number, payment_id, user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    if (!isValidUUID(user_id) || !isValidUUID(payment_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid UUID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔎 Fetch payment record securely with user verification
    const { data: payment, error: paymentError } = await supabase
      .from("bid_fee_payments")
      .select("*")
      .eq("id", payment_id)
      .eq("user_id", user_id)
      .single();

    if (paymentError || !payment) {
      console.warn("Payment record not found:", { payment_id, user_id, paymentError });
      return new Response(
        JSON.stringify({ error: "Payment record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check payment status and prevent duplicate processing
    if (payment.status !== "pending") {
      console.warn("Payment already processed:", { payment_id, status: payment.status });
      return new Response(
        JSON.stringify({ 
          error: `Payment already in ${payment.status} state. Cannot initiate new STK push.` 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 🚀 Initiate Tuma STK Push
    let stkResult;
    try {
      stkResult = await initiateTumaStkPush(phone_number, payment_id, BID_AMOUNT);
    } catch (stkError) {
      console.error("STK Push initiation failed:", stkError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to initiate STK push. Please try again.",
          details: stkError.message 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ✅ Update payment record with Tuma request ID and new status
    const { error: updateError } = await supabase
      .from("bid_fee_payments")
      .update({
        checkout_request_id: stkResult.request_id,
        amount: BID_AMOUNT,
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment_id);

    if (updateError) {
      console.error("Failed to update payment record:", updateError);
      return new Response(
        JSON.stringify({ error: "Payment initiated but record update failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("STK Push initiated successfully:", {
      payment_id,
      user_id,
      request_id: stkResult.request_id,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "STK push sent successfully. Check your phone to complete payment.",
        request_id: stkResult.request_id,
        amount: BID_AMOUNT,
        currency: "KES",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unhandled server error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred. Please try again later.",
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Utility function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}