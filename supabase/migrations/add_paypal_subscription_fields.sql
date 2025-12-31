-- SQL Migration: Add PayPal subscription fields to profiles table
-- Run this in Supabase SQL Editor

-- Add subscription-related columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'cancelled', 'suspended', 'expired')),
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Update plan check constraint to include 'starter'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check 
  CHECK (plan IN ('free', 'starter', 'pro', 'advanced'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_paypal_subscription_id 
  ON profiles(paypal_subscription_id) 
  WHERE paypal_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status 
  ON profiles(subscription_status);

-- Update payment_transactions table to support upsert on subscription_id
-- First, make subscription_id unique
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'payment_transactions_subscription_id_key'
  ) THEN
    ALTER TABLE payment_transactions 
    ADD CONSTRAINT payment_transactions_subscription_id_key UNIQUE (subscription_id);
  END IF;
END $$;

-- Add missing columns to payment_transactions if needed
ALTER TABLE payment_transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger for updated_at on payment_transactions
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at 
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Grant service role access for webhook updates
GRANT ALL ON profiles TO service_role;
GRANT ALL ON payment_transactions TO service_role;

COMMENT ON COLUMN profiles.paypal_subscription_id IS 'PayPal subscription ID for active subscriptions';
COMMENT ON COLUMN profiles.subscription_status IS 'Current status of the subscription: none, active, cancelled, suspended, expired';
COMMENT ON COLUMN profiles.next_billing_date IS 'Next billing date for active subscriptions';
