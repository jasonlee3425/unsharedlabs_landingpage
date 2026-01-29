-- ============================================================================
-- Add Domain Setup Fields to company_verification_settings
-- ============================================================================
-- This adds fields to store domain and notification email for DNS record setup
-- The domain is configured once per company for Brevo domain authentication

ALTER TABLE company_verification_settings
  ADD COLUMN IF NOT EXISTS domain TEXT,
  ADD COLUMN IF NOT EXISTS domain_notification_email TEXT,
  ADD COLUMN IF NOT EXISTS domain_brevo_id TEXT; -- ID returned from Brevo API

-- Note: domain and domain_notification_email are nullable since they're optional
-- and only needed if the company wants to set up domain authentication
