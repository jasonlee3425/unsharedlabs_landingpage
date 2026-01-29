-- ============================================================================
-- Add Prevention Step Tracking to company_verification_settings
-- ============================================================================

-- Add JSONB column to track prevention step completion
-- Similar to how onboarding progress is tracked
ALTER TABLE company_verification_settings
ADD COLUMN IF NOT EXISTS prevention_steps JSONB DEFAULT '{"step1": false, "step2": false, "step3": false}'::jsonb;

-- Step 1 is tracked by is_verified field (but also stored in prevention_steps for consistency)
-- Step 2 is DNS setup (prevention_steps.step2)
-- Step 3 is email configuration (prevention_steps.step3)

-- Example structure:
-- {
--   "step1": true,  // Account verification (synced with is_verified)
--   "step2": false, // Domain Set Up
--   "step3": false  // Configure Email
-- }
