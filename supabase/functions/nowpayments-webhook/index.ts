import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    console.log("NOWPayments webhook received:", JSON.stringify(body));

    const {
      order_id,
      payment_status,
      pay_amount,
      pay_currency,
    } = body;

    if (!order_id || !payment_status) {
      throw new Error("Missing order_id or payment_status");
    }

    // Map NOWPayments status to our status
    const statusMap: Record<string, string> = {
      waiting: "pending",
      confirming: "confirming",
      confirmed: "confirmed",
      sending: "sending",
      partially_paid: "partially_paid",
      finished: "finished",
      failed: "failed",
      refunded: "refunded",
      expired: "expired",
    };

    const mappedStatus = statusMap[payment_status] || payment_status;

    // Update payment record
    const { error } = await supabase
      .from("payments")
      .update({
        status: mappedStatus,
        crypto_amount: pay_amount || null,
        crypto_currency: pay_currency || null,
      })
      .eq("id", order_id);

    if (error) {
      console.error("Failed to update payment:", error);
      throw new Error("Failed to update payment: " + error.message);
    }

    console.log(`Payment ${order_id} updated to status: ${mappedStatus}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
