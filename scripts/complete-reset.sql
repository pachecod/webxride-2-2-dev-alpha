-- Complete Database Reset Script
-- This script will safely remove all WebXRide tables and data
-- Run this BEFORE running the updated quick-setup.sql
-- ⚠️  WARNING: This will delete ALL data in your WebXRide tables!

-- ============================================================================
-- 1. DROP ALL VIEWS (must be done before dropping tables)
-- ============================================================================

DROP VIEW IF EXISTS students_with_classes CASCADE;
DROP VIEW IF EXISTS classes_with_students CASCADE;

-- ============================================================================
-- 2. DROP ALL TABLES (in correct order due to foreign key constraints)
-- ============================================================================

-- Drop tables that reference other tables first
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS student_classes CASCADE;

-- Drop independent tables
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS snippets CASCADE;
DROP TABLE IF EXISTS about_page CASCADE;

-- ============================================================================
-- 3. DROP ALL FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Drop triggers first (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'students') THEN
        DROP TRIGGER IF EXISTS update_students_updated_at ON students;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
        DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'classes') THEN
        DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets') THEN
        DROP TRIGGER IF EXISTS update_snippets_updated_at ON snippets;
    END IF;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- 4. CLEAN UP STORAGE (OPTIONAL - comment out if you want to keep files)
-- ============================================================================

-- Uncomment the following lines if you want to delete all uploaded files
-- WARNING: This will delete ALL files in the storage bucket!

-- DELETE FROM storage.objects WHERE bucket_id = 'files';
-- DROP POLICY IF EXISTS "Public Access" ON storage.objects;
-- DROP POLICY IF EXISTS "Anonymous users can upload to user folders" ON storage.objects;
-- DROP POLICY IF EXISTS "Anonymous users can update user folders" ON storage.objects;
-- DROP POLICY IF EXISTS "Anonymous users can delete from user folders" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can upload to common assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can update common assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can delete from common assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Anyone can read student_classes" ON student_classes;
-- DROP POLICY IF EXISTS "Anyone can insert student_classes" ON student_classes;
-- DROP POLICY IF EXISTS "Anyone can update student_classes" ON student_classes;
-- DROP POLICY IF EXISTS "Anyone can delete student_classes" ON student_classes;

-- ============================================================================
-- 5. VERIFICATION
-- ============================================================================

-- Check that all tables are gone
SELECT 
  'Tables remaining:' as status,
  string_agg(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('students', 'classes', 'templates', 'snippets', 'about_page', 'student_classes');

-- Check that all views are gone
SELECT 
  'Views remaining:' as status,
  string_agg(table_name, ', ') as views
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name IN ('students_with_classes', 'classes_with_students');

-- Show final status
SELECT '✅ Database reset complete! Ready for fresh installation.' as status;
