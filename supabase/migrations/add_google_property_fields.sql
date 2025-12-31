-- SQL Migration: Add GA4 and GSC property fields to users table
-- Run this migration in your Supabase SQL Editor

-- Add new columns for storing selected Google properties
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ga4_property_id TEXT,
ADD COLUMN IF NOT EXISTS ga4_property_name TEXT,
ADD COLUMN IF NOT EXISTS gsc_site_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN users.ga4_property_id IS 'Selected Google Analytics 4 property ID (e.g., 123456789)';
COMMENT ON COLUMN users.ga4_property_name IS 'Display name of the selected GA4 property';
COMMENT ON COLUMN users.gsc_site_url IS 'Selected Google Search Console site URL (e.g., https://example.com or sc-domain:example.com)';

-- Create index for faster lookups (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_users_ga4_property ON users(ga4_property_id) WHERE ga4_property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_gsc_site ON users(gsc_site_url) WHERE gsc_site_url IS NOT NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('ga4_property_id', 'ga4_property_name', 'gsc_site_url');
