-- Add email_template column to company_verification_settings table
ALTER TABLE company_verification_settings
  ADD COLUMN IF NOT EXISTS email_template TEXT;

-- Add comment to column
COMMENT ON COLUMN company_verification_settings.email_template IS 'Custom HTML email template for verification emails';
