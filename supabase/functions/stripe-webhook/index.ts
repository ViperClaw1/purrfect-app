import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No stripe-signature header");
    
    const body = await req.text();
    
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logStep("Webhook signature verification failed", { message });
      return new Response(JSON.stringify({ error: `Webhook Error: ${message}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event received", { type: event.type, id: event.id });

    // Handle subscription events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id, customerEmail: session.customer_email });
        
        if (session.mode === "subscription" && session.customer_email) {
          await updatePremiumStatus(supabaseClient, session.customer_email, true, session.customer as string);
        }
        break;
      }
      
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        logStep("Subscription created/updated", { subscriptionId: subscription.id, status: subscription.status });
        
        const isActive = subscription.status === "active" || subscription.status === "trialing";
        const customerEmail = await getCustomerEmail(stripe, customerId);
        
        if (customerEmail) {
          await updatePremiumStatus(supabaseClient, customerEmail, isActive, customerId);
        }
        break;
      }
      
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        logStep("Subscription deleted", { subscriptionId: subscription.id });
        
        const customerEmail = await getCustomerEmail(stripe, customerId);
        
        if (customerEmail) {
          await updatePremiumStatus(supabaseClient, customerEmail, false, customerId);
        }
        break;
      }
      
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.customer_email) {
          logStep("Invoice payment succeeded", { invoiceId: invoice.id, email: invoice.customer_email });
          await updatePremiumStatus(supabaseClient, invoice.customer_email, true, invoice.customer as string);
        }
        break;
      }
      
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription && invoice.customer_email) {
          logStep("Invoice payment failed", { invoiceId: invoice.id, email: invoice.customer_email });
          // Don't immediately revoke premium on failed payment - Stripe will retry
          // Only revoke when subscription is actually canceled
        }
        break;
      }
      
      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getCustomerEmail(stripe: Stripe, customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted) return null;
    return customer.email;
  } catch {
    return null;
  }
}

async function updatePremiumStatus(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  email: string,
  isPremium: boolean,
  stripeCustomerId: string
) {
  logStep("Updating premium status", { email, isPremium, stripeCustomerId });
  
  // Find the user by email in auth.users
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  
  if (userError) {
    logStep("Error listing users", { error: userError.message });
    return;
  }
  
  // deno-lint-ignore no-explicit-any
  const user = users.users.find((u: any) => u.email === email);
  
  if (!user) {
    logStep("User not found for email", { email });
    return;
  }
  
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      is_premium: isPremium,
      stripe_customer_id: stripeCustomerId,
    })
    .eq("user_id", user.id);
  
  if (updateError) {
    logStep("Error updating profile", { error: updateError.message });
  } else {
    logStep("Profile updated successfully", { userId: user.id, isPremium });
  }
}
