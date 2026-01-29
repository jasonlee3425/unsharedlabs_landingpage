-- Add logo_url column to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment to column
COMMENT ON COLUMN companies.logo_url IS 'URL to company logo stored in Supabase Storage';
