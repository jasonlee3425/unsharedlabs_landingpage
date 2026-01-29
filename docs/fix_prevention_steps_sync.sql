-- ============================================================================
-- Fix Prevention Steps Sync
-- ============================================================================
-- This script ensures that prevention_steps.step1 is set to true
-- for all records where is_verified is true
-- This fixes the issue where step 1 appears complete but step 2 can't be marked

-- Update all records where is_verified is true but prevention_steps.step1 is false
UPDATE company_verification_settings
SET 
  prevention_steps = jsonb_set(
    COALESCE(prevention_steps, '{"step1": false, "step2": false, "step3": false}'::jsonb),
    '{step1}',
    'true'::jsonb
  ),
  updated_at = NOW()
WHERE 
  is_verified = TRUE 
  AND (
    prevention_steps IS NULL 
    OR (prevention_steps->>'step1')::boolean IS DISTINCT FROM TRUE
  );

-- Verify the fix
SELECT 
  id,
  company_id,
  is_verified,
  prevention_steps->>'step1' as step1,
  prevention_steps->>'step2' as step2,
  prevention_steps->>'step3' as step3
FROM company_verification_settings
WHERE is_verified = TRUE;
