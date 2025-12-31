# PayPal Subscription Testing Guide

## Prerequisites

1. **PayPal Developer Account**: https://developer.paypal.com
2. **Sandbox Accounts**: Create buyer and seller test accounts
3. **PayPal Plan IDs**: Create subscription plans in the PayPal dashboard

---

## Step 1: Configure PayPal Developer Dashboard

### 1.1 Create a Sandbox Application
1. Go to https://developer.paypal.com/dashboard/applications/sandbox
2. Click "Create App"
3. Name: "SEO Analytics SaaS"
4. Select "Merchant" as app type
5. Copy **Client ID** and **Secret**

### 1.2 Create Subscription Plans
1. Go to https://developer.paypal.com/dashboard/applications/sandbox
2. Click your app → "Subscriptions" tab
3. Create a Product first:
   - Name: "SEO Analytics"
   - Type: "SERVICE"
   - Category: "SOFTWARE"
4. Create Plans for each tier:

| Plan Name | Price | Billing Cycle |
|-----------|-------|---------------|
| Starter Monthly | $9.95 | Monthly |
| Pro Monthly | $24.95 | Monthly |
| Advanced Monthly | $49.95 | Monthly |

5. Copy each **Plan ID** (starts with `P-`)

### 1.3 Configure Webhook
1. In your app, go to "Webhooks" tab
2. Add Webhook URL: `https://caycnwaspoqsdnypobzb.supabase.co/functions/v1/ppWebhook`
3. Subscribe to these events:
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`
   - `BILLING.SUBSCRIPTION.SUSPENDED`
   - `BILLING.SUBSCRIPTION.EXPIRED`
   - `PAYMENT.SALE.COMPLETED`
4. Copy the **Webhook ID**

---

## Step 2: Configure Environment Variables

### 2.1 Local `.env.local`
```env
# PayPal Sandbox
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_SECRET=your_sandbox_secret
PAYPAL_API_URL=https://api-m.sandbox.paypal.com

# PayPal Plan IDs
PAYPAL_PLAN_ID_STARTER=P-xxxxxxxxxxxxx
PAYPAL_PLAN_ID_PRO=P-xxxxxxxxxxxxx
PAYPAL_PLAN_ID_ADVANCED=P-xxxxxxxxxxxxx

# PayPal Webhook
PAYPAL_WEBHOOK_ID=your_webhook_id
```

### 2.2 Supabase Edge Function Secrets
Run these commands in your terminal:

```bash
supabase secrets set PAYPAL_MODE=sandbox
supabase secrets set PAYPAL_CLIENT_ID=your_sandbox_client_id
supabase secrets set PAYPAL_CLIENT_SECRET=your_sandbox_secret
supabase secrets set PAYPAL_WEBHOOK_ID=your_webhook_id
supabase secrets set PAYPAL_PLAN_ID_STARTER=P-xxxxxxxxxxxxx
supabase secrets set PAYPAL_PLAN_ID_PRO=P-xxxxxxxxxxxxx
supabase secrets set PAYPAL_PLAN_ID_ADVANCED=P-xxxxxxxxxxxxx
```

---

## Step 3: Run Database Migration

Execute the SQL migration in Supabase SQL Editor:

```sql
-- File: supabase/migrations/add_paypal_subscription_fields.sql
-- Copy and run the contents of this file
```

---

## Step 4: Deploy Edge Function

```bash
cd c:\xampp8.2\htdocs\sea
supabase functions deploy ppWebhook --project-ref caycnwaspoqsdnypobzb
```

---

## Step 5: Test the Complete Flow

### 5.1 Create a Test User
1. Go to your app: http://localhost:3001
2. Sign up with a new account
3. Note the user ID from Supabase dashboard (profiles table)

### 5.2 Subscribe to a Plan
1. Go to http://localhost:3001/pricing
2. Click on a paid plan (Starter, Pro, or Advanced)
3. PayPal popup should appear
4. Log in with **Sandbox Buyer Account**:
   - Email: Check PayPal Developer Dashboard → Sandbox → Accounts
   - Password: Usually the one you set during sandbox account creation
5. Complete the subscription

### 5.3 Verify Subscription Activated
1. Check browser console for "Subscription approved" message
2. Check Supabase `profiles` table:
   - `plan` should be updated (starter/pro/advanced)
   - `paypal_subscription_id` should have the subscription ID
   - `subscription_status` should be "active"
   - `member_start` and `member_end` should be set
3. Check `payment_transactions` table for the payment record

### 5.4 Verify Webhook Received
1. Go to Supabase Dashboard → Edge Functions → ppWebhook → Logs
2. You should see log entries for `BILLING.SUBSCRIPTION.ACTIVATED`
3. (Optional) Check PayPal Developer Dashboard → Webhooks for delivery status

---

## Step 6: Test Webhook Events Manually

### 6.1 Using PayPal Webhook Simulator
1. Go to https://developer.paypal.com/dashboard/webhooksSimulator
2. Select your webhook URL
3. Select event type (e.g., `BILLING.SUBSCRIPTION.ACTIVATED`)
4. Modify the payload to include your test user's ID in `custom_id`
5. Send the event

### 6.2 Using cURL
```bash
curl -X POST https://caycnwaspoqsdnypobzb.supabase.co/functions/v1/ppWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "id": "WH-TEST-123",
    "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
    "resource": {
      "id": "I-TEST123456789",
      "plan_id": "P-YOUR_PLAN_ID",
      "custom_id": "YOUR_USER_UUID",
      "status": "ACTIVE",
      "subscriber": {
        "email_address": "test@example.com"
      },
      "billing_info": {
        "next_billing_time": "2025-01-14T00:00:00Z"
      }
    }
  }'
```

---

## Step 7: Test Cancellation Flow

### 7.1 Cancel via PayPal
1. Log into PayPal Sandbox as the buyer
2. Go to Settings → Payments → Manage Automatic Payments
3. Cancel the subscription

### 7.2 Verify Cancellation
1. Check Supabase Edge Function logs for `BILLING.SUBSCRIPTION.CANCELLED`
2. Check `profiles` table:
   - `subscription_status` should be "cancelled"
   - `plan` should still be the paid plan (access until end of period)

---

## Troubleshooting

### Webhook Not Receiving Events
1. Check webhook URL is correct and accessible
2. Check Supabase Edge Function is deployed
3. Check PayPal Webhook Simulator for errors
4. Check Edge Function logs in Supabase Dashboard

### Subscription Not Activating
1. Check browser console for errors
2. Check `/api/paypal/activate` endpoint is working
3. Verify user is logged in before subscribing
4. Check network tab for API response

### Profile Not Updating
1. Check SQL migration was run
2. Verify `profiles` table has required columns
3. Check service role key is set correctly

---

## Production Checklist

Before going live:

1. [ ] Create PayPal **Live** application
2. [ ] Create **Live** subscription plans
3. [ ] Configure **Live** webhook URL
4. [ ] Update all environment variables to Live values
5. [ ] Set `PAYPAL_MODE=live` in Edge Function secrets
6. [ ] Change `PAYPAL_API_URL` to `https://api-m.paypal.com`
7. [ ] Test with a real $1 transaction (create a $1 test plan)
8. [ ] Enable webhook signature verification (uncomment in Edge Function)
