-- Add website_url column to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS website_url TEXT;

COMMENT ON COLUMN companies.website_url IS 'Company website URL';
