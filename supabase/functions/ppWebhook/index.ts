// Supabase Edge Function: ppWebhook
// Deploy to: https://caycnwaspoqsdnypobzb.supabase.co/functions/v1/ppWebhook
//
// This is the updated version using 'profiles' table, monthly billing only,
// with correct plan pricing ($9.95, $24.95, $49.95)

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

// ========================================================================================
// Interfaces
// ========================================================================================

interface PayPalWebhookEvent {
  id: string
  event_type: string
  resource_type: string
  resource: PayPalResource
  create_time: string
  summary?: string
}

interface PayPalResource {
  id: string
  status?: string
  status_update_time?: string
  plan_id?: string
  start_time?: string
  quantity?: string
  shipping_amount?: {
    currency_code: string
    value: string
  }
  subscriber?: {
    email_address?: string
    payer_id?: string
    name?: {
      given_name?: string
      surname?: string
    }
  }
  billing_info?: {
    next_billing_time?: string
    last_payment?: {
      amount?: {
        currency_code: string
        value: string
      }
      time?: string
    }
    cycle_executions?: Array<{
      tenure_type: string
      sequence: number
      cycles_completed: number
      cycles_remaining: number
    }>
  }
  custom_id?: string  // User ID passed from subscription creation
  // For PAYMENT.SALE.COMPLETED
  amount?: {
    total: string
    currency: string
  }
  billing_agreement_id?: string
  parent_payment?: string
  transaction_fee?: {
    value: string
    currency: string
  }
}

interface PlanConfig {
  name: string
  websiteLimit: number
  keywordLimit: number
  monthlyPrice: number
}

// ========================================================================================
// Constants
// ========================================================================================

const PAYPAL_API_URL = Deno.env.get("PAYPAL_MODE") === "live" 
  ? "https://api-m.paypal.com" 
  : "https://api-m.sandbox.paypal.com"

// Plan configurations - map PayPal plan IDs to your plans
// Replace these with your actual PayPal Plan IDs from environment variables
const PLAN_CONFIGS: Record<string, PlanConfig> = {}

// Dynamically add plan configurations from environment
const starterPlanId = Deno.env.get("PAYPAL_PLAN_ID_STARTER")
const proPlanId = Deno.env.get("PAYPAL_PLAN_ID_PRO")
const advancedPlanId = Deno.env.get("PAYPAL_PLAN_ID_ADVANCED")

if (starterPlanId) {
  PLAN_CONFIGS[starterPlanId] = { name: "starter", websiteLimit: 3, keywordLimit: 500, monthlyPrice: 9.95 }
}
if (proPlanId) {
  PLAN_CONFIGS[proPlanId] = { name: "pro", websiteLimit: 10, keywordLimit: 2000, monthlyPrice: 24.95 }
}
if (advancedPlanId) {
  PLAN_CONFIGS[advancedPlanId] = { name: "advanced", websiteLimit: 999999, keywordLimit: 999999, monthlyPrice: 49.95 }
}

// ========================================================================================
// Helper Functions
// ========================================================================================

function debug(label: string, data?: unknown) {
  console.log(`[DEBUG] ${label}`)
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2))
  }
}

function getEnvVars() {
  const supabaseUrl = Deno.env.get("PROJECT_URL") || Deno.env.get("SUPABASE_URL") || ""
  const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  const paypalClientId = Deno.env.get("PAYPAL_CLIENT_ID") || ""
  const paypalClientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET") || ""
  const paypalWebhookId = Deno.env.get("PAYPAL_WEBHOOK_ID") || ""

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing required Supabase environment variables")
  }

  return { supabaseUrl, supabaseServiceKey, paypalClientId, paypalClientSecret, paypalWebhookId }
}

// Get PayPal access token for API calls
async function getPayPalAccessToken(clientId: string, clientSecret: string): Promise<string> {
  const auth = btoa(`${clientId}:${clientSecret}`)
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    throw new Error(`Failed to get PayPal access token: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

// Verify PayPal webhook signature
async function verifyWebhookSignature(
  webhookId: string,
  accessToken: string,
  headers: Headers,
  body: string
): Promise<boolean> {
  const verifyPayload = {
    auth_algo: headers.get("paypal-auth-algo"),
    cert_url: headers.get("paypal-cert-url"),
    transmission_id: headers.get("paypal-transmission-id"),
    transmission_sig: headers.get("paypal-transmission-sig"),
    transmission_time: headers.get("paypal-transmission-time"),
    webhook_id: webhookId,
    webhook_event: JSON.parse(body),
  }

  const response = await fetch(`${PAYPAL_API_URL}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verifyPayload),
  })

  if (!response.ok) {
    console.log("Webhook verification failed:", await response.text())
    return false
  }

  const result = await response.json()
  return result.verification_status === "SUCCESS"
}

// Get plan config from PayPal plan ID
function getPlanFromPayPalPlanId(planId: string): PlanConfig | null {
  return PLAN_CONFIGS[planId] || null
}

// ========================================================================================
// Event Handlers
// ========================================================================================

async function handleSubscriptionActivated(
  supabase: ReturnType<typeof createClient>,
  resource: PayPalResource
): Promise<void> {
  console.log("Processing BILLING.SUBSCRIPTION.ACTIVATED")
  
  const subscriptionId = resource.id
  const userId = resource.custom_id
  const planId = resource.plan_id || ""
  const payerEmail = resource.subscriber?.email_address
  const startTime = resource.start_time
  const nextBillingTime = resource.billing_info?.next_billing_time
  
  if (!userId) {
    console.log("Warning: No custom_id (user_id) found in subscription")
    // Try to find user by email as fallback
    if (payerEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", payerEmail)
        .single()
      
      if (!profile) {
        console.log("Could not find user by email either")
        return
      }
      // Use found profile id
      await updateUserProfile(supabase, profile.id, subscriptionId, planId, startTime, nextBillingTime)
    }
    return
  }

  await updateUserProfile(supabase, userId, subscriptionId, planId, startTime, nextBillingTime)
}

async function updateUserProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  subscriptionId: string,
  planId: string,
  startTime?: string,
  nextBillingTime?: string
): Promise<void> {
  const planConfig = getPlanFromPayPalPlanId(planId)
  const planName = planConfig?.name || "starter"

  // Update profiles table
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      plan: planName,
      paypal_subscription_id: subscriptionId,
      subscription_status: "active",
      website_limit: planConfig?.websiteLimit || 3,
      keyword_limit: planConfig?.keywordLimit || 500,
      member_start: startTime || new Date().toISOString(),
      member_end: nextBillingTime || null,
      next_billing_date: nextBillingTime || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (profileError) {
    debug("Error updating profile", profileError)
  } else {
    console.log(`Subscription activated for user ${userId}, plan: ${planName}`)
  }

  // Record in payment_transactions
  const { error: txError } = await supabase
    .from("payment_transactions")
    .upsert({
      user_id: userId,
      subscription_id: subscriptionId,
      plan: planName,
      amount: planConfig?.monthlyPrice || 9.95,
      currency: "USD",
      status: "completed",
      transaction_date: new Date().toISOString(),
    }, {
      onConflict: "subscription_id"
    })

  if (txError) {
    debug("Error recording transaction", txError)
  }
}

async function handleSubscriptionCancelled(
  supabase: ReturnType<typeof createClient>,
  resource: PayPalResource
): Promise<void> {
  console.log("Processing BILLING.SUBSCRIPTION.CANCELLED")
  
  const subscriptionId = resource.id
  const userId = resource.custom_id

  // Find user by subscription ID if custom_id not present
  let targetUserId = userId
  if (!targetUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("paypal_subscription_id", subscriptionId)
      .single()
    
    targetUserId = profile?.id
  }

  if (!targetUserId) {
    console.log("Could not find user for cancelled subscription")
    return
  }

  // Update profile - keep current plan until end of period
  const { error } = await supabase
    .from("profiles")
    .update({
      subscription_status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", targetUserId)

  if (error) {
    debug("Error updating profile", error)
  } else {
    console.log(`Subscription cancelled for user ${targetUserId}`)
  }

  // Update payment transaction
  await supabase
    .from("payment_transactions")
    .update({ status: "cancelled" })
    .eq("subscription_id", subscriptionId)
}

async function handleSubscriptionSuspended(
  supabase: ReturnType<typeof createClient>,
  resource: PayPalResource
): Promise<void> {
  console.log("Processing BILLING.SUBSCRIPTION.SUSPENDED")
  
  const subscriptionId = resource.id

  // Find user by subscription ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("paypal_subscription_id", subscriptionId)
    .single()

  if (profile?.id) {
    await supabase
      .from("profiles")
      .update({
        subscription_status: "suspended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
    
    console.log(`Subscription suspended for user ${profile.id}`)
  }
}

async function handleSubscriptionExpired(
  supabase: ReturnType<typeof createClient>,
  resource: PayPalResource
): Promise<void> {
  console.log("Processing BILLING.SUBSCRIPTION.EXPIRED")
  
  const subscriptionId = resource.id

  // Find user by subscription ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("paypal_subscription_id", subscriptionId)
    .single()

  if (profile?.id) {
    // Downgrade to free plan
    await supabase
      .from("profiles")
      .update({
        plan: "free",
        subscription_status: "expired",
        member_end: new Date().toISOString(),
        website_limit: 1,
        keyword_limit: 100,
        paypal_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)
    
    console.log(`Subscription expired, user ${profile.id} downgraded to free`)
  }
}

async function handlePaymentCompleted(
  supabase: ReturnType<typeof createClient>,
  resource: PayPalResource
): Promise<void> {
  console.log("Processing PAYMENT.SALE.COMPLETED")
  
  const transactionId = resource.id
  const subscriptionId = resource.billing_agreement_id
  const amount = parseFloat(resource.amount?.total || "0")
  const currency = resource.amount?.currency || "USD"

  if (!subscriptionId) {
    console.log("No subscription ID in payment")
    return
  }

  // Find user by subscription ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, plan")
    .eq("paypal_subscription_id", subscriptionId)
    .single()

  if (profile) {
    // Record payment
    await supabase
      .from("payment_transactions")
      .insert({
        user_id: profile.id,
        subscription_id: subscriptionId,
        plan: profile.plan,
        amount: amount,
        currency: currency,
        status: "completed",
        transaction_date: new Date().toISOString(),
      })

    console.log(`Payment recorded: ${transactionId}, amount: ${amount} ${currency}`)
  }
}

// ========================================================================================
// Main Handler
// ========================================================================================

Deno.serve(async (req: Request): Promise<Response> => {
  console.log("PayPal Webhook received")
  console.log(`Method: ${req.method}`)

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json" } }
    )
  }

  try {
    const { supabaseUrl, supabaseServiceKey, paypalClientId, paypalClientSecret, paypalWebhookId } = getEnvVars()
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get raw body for signature verification
    const body = await req.text()
    debug("Webhook body", JSON.parse(body))

    // Verify webhook signature (skip in development if credentials not set)
    if (paypalClientId && paypalClientSecret && paypalWebhookId) {
      try {
        const accessToken = await getPayPalAccessToken(paypalClientId, paypalClientSecret)
        const isValid = await verifyWebhookSignature(paypalWebhookId, accessToken, req.headers, body)
        
        if (!isValid) {
          console.log("Warning: Webhook signature verification failed")
          // In production, you might want to reject the request
          // return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401 })
        } else {
          console.log("Webhook signature verified successfully")
        }
      } catch (verifyError) {
        console.log("Signature verification error:", String(verifyError))
        // Continue processing - verification is optional during development
      }
    } else {
      console.log("Skipping signature verification - credentials not configured")
    }

    // Parse the webhook event
    const event: PayPalWebhookEvent = JSON.parse(body)
    const eventType = event.event_type
    const resource = event.resource

    console.log(`Event Type: ${eventType}`)
    console.log(`Event ID: ${event.id}`)

    // Route to appropriate handler
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(supabase, resource)
        break

      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(supabase, resource)
        break

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionSuspended(supabase, resource)
        break

      case "BILLING.SUBSCRIPTION.EXPIRED":
        await handleSubscriptionExpired(supabase, resource)
        break

      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentCompleted(supabase, resource)
        break

      default:
        console.log(`Unhandled event type: ${eventType}`)
    }

    // Always return 200 to acknowledge receipt
    return new Response(
      JSON.stringify({ 
        received: true, 
        event_type: eventType,
        event_id: event.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.log("Webhook processing error:", String(error))
    
    // Still return 200 to prevent PayPal from retrying
    return new Response(
      JSON.stringify({ 
        received: true, 
        error: "Processing error logged" 
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  }
})
