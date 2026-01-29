-- ============================================================================
-- Update Domain DNS Records Storage
-- ============================================================================
-- This migration:
-- 1. Removes domain_notification_email column (no longer needed)
-- 2. Adds domain_dns_records JSONB column to store all DNS records

-- Remove domain_notification_email column
ALTER TABLE company_verification_settings
  DROP COLUMN IF EXISTS domain_notification_email;

-- Add domain_dns_records JSONB column to store all DNS records
ALTER TABLE company_verification_settings
  ADD COLUMN IF NOT EXISTS domain_dns_records JSONB;

-- Note: domain_dns_records will store all 4 DNS records:
-- 1. DKIM TXT record (from Brevo POST response)
-- 2. Brevo Code TXT record (from Brevo POST response)
-- 3. DKIM 1 CNAME record (constructed)
-- 4. DKIM 2 CNAME record (constructed)
-- 5. DMARC TXT record (constructed)
