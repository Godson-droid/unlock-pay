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
    const NOWPAYMENTS_API_KEY = Deno.env.get("NOWPAYMENTS_API_KEY");
    if (!NOWPAYMENTS_API_KEY) {
      throw new Error("NOWPAYMENTS_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { content_id, price_usd } = await req.json();

    if (!content_id || !price_usd) {
      throw new Error("Missing content_id or price_usd");
    }

    // Verify content exists
    const { data: content, error: contentError } = await supabase
      .from("content")
      .select("id, title, share_token")
      .eq("id", content_id)
      .eq("is_active", true)
      .single();

    if (contentError || !content) {
      throw new Error("Content not found");
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .insert({
        content_id,
        amount_usd: price_usd,
        status: "pending",
      })
      .select("id, access_token")
      .single();

    if (paymentError || !payment) {
      throw new Error("Failed to create payment record: " + paymentError?.message);
    }

    // Determine the callback URL
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const successUrl = `${origin}/unlock/${content.share_token}?access=${payment.access_token}`;
    const callbackUrl = `${SUPABASE_URL}/functions/v1/nowpayments-webhook`;

    // Create NOWPayments invoice
    const invoiceResponse = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: price_usd,
        price_currency: "usd",
        order_id: payment.id,
        order_description: `Unlock: ${content.title}`,
        ipn_callback_url: callbackUrl,
        success_url: successUrl,
        cancel_url: `${origin}/unlock/${content.share_token}`,
      }),
    });

    const invoiceData = await invoiceResponse.json();

    if (!invoiceResponse.ok) {
      throw new Error(
        `NOWPayments API error [${invoiceResponse.status}]: ${JSON.stringify(invoiceData)}`
      );
    }

    // Update payment with nowpayments ID
    await supabase
      .from("payments")
      .update({ nowpayments_id: invoiceData.id?.toString() })
      .eq("id", payment.id);

    return new Response(
      JSON.stringify({ invoice_url: invoiceData.invoice_url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error creating payment:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
