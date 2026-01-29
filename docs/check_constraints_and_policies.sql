-- ============================================================================
-- SQL Queries to Check Database Constraints and RLS Policies
-- Run these in Supabase SQL Editor to diagnose issues
-- ============================================================================

-- ============================================================================
-- 1. Check table structure and constraints for companies table
-- ============================================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'companies'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. Check all constraints on companies table
-- ============================================================================
SELECT
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'companies'::regclass
ORDER BY contype, conname;

-- ============================================================================
-- 3. Check all indexes on companies table
-- ============================================================================
SELECT
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE tablename = 'companies';

-- ============================================================================
-- 4. Check RLS policies on companies table
-- ============================================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'companies'
ORDER BY policyname;

-- ============================================================================
-- 5. Check if RLS is enabled on companies table
-- ============================================================================
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename = 'companies';

-- ============================================================================
-- 6. Check foreign key constraints referencing companies table
-- ============================================================================
SELECT
    tc.table_name AS referencing_table,
    kcu.column_name AS referencing_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE ccu.table_name = 'companies'
    AND tc.constraint_type = 'FOREIGN KEY';

-- ============================================================================
-- 7. Check for any CHECK constraints
-- ============================================================================
SELECT
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'companies'::regclass
    AND contype = 'c';
