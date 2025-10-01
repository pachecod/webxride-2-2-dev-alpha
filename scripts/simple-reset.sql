-- Simple Database Reset Script
-- This script will safely remove all WebXRide tables and data
-- Run this BEFORE running the updated quick-setup.sql
-- ⚠️  WARNING: This will delete ALL data in your WebXRide tables!

-- ============================================================================
-- 1. DROP ALL VIEWS (must be done before dropping tables)
-- ============================================================================

DROP VIEW IF EXISTS students_with_classes CASCADE;
DROP VIEW IF EXISTS classes_with_students CASCADE;

-- ============================================================================
-- 2. DROP ALL TABLES (using CASCADE to handle dependencies)
-- ============================================================================

-- Drop all tables with CASCADE to handle foreign key constraints
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS student_classes CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS snippets CASCADE;
DROP TABLE IF EXISTS about_page CASCADE;

-- ============================================================================
-- 3. DROP FUNCTIONS
-- ============================================================================

-- Drop functions (CASCADE will handle any dependencies)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================

-- Check that all tables are gone
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All WebXRide tables removed successfully!'
    ELSE '⚠️  Some tables still exist: ' || string_agg(table_name, ', ')
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'classes', 'templates', 'snippets', 'about_page', 'student_classes');

-- Show final status
SELECT '🎯 Ready for fresh installation! Run quick-setup.sql next.' as next_step;
