-- ============================================================================
-- Make sender_email and sender_name nullable in company_verification_settings
-- ============================================================================
-- This allows the update flow to save only sender_id before OTP validation,
-- and then save email/name after successful OTP validation.

ALTER TABLE company_verification_settings
  ALTER COLUMN sender_email DROP NOT NULL,
  ALTER COLUMN sender_name DROP NOT NULL;

-- Note: Existing records will remain unchanged. New records can have NULL
-- values for sender_email and sender_name until OTP validation is complete.
