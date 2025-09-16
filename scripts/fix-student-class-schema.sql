-- Fix Student-Class Schema
-- This script fixes the database schema to match the application expectations
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. ADD class_id COLUMN TO students TABLE
-- ============================================================================

-- Add class_id column to students table (if it doesn't exist)
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. MIGRATE EXISTING DATA FROM JUNCTION TABLE (if any exists)
-- ============================================================================

-- If there's existing data in student_classes table, migrate it
-- Note: This assumes one student can only be in one class at a time
-- If a student is in multiple classes, we'll take the most recent one
UPDATE students 
SET class_id = (
  SELECT sc.class_id 
  FROM student_classes sc 
  WHERE sc.student_id = students.id 
  ORDER BY sc.created_at DESC 
  LIMIT 1
)
WHERE class_id IS NULL 
AND EXISTS (
  SELECT 1 FROM student_classes sc WHERE sc.student_id = students.id
);

-- ============================================================================
-- 3. CLEAN UP JUNCTION TABLE (OPTIONAL)
-- ============================================================================

-- Drop the junction table since we're using direct foreign key approach
-- Comment out the next line if you want to keep the junction table for future use
DROP TABLE IF EXISTS student_classes CASCADE;

-- ============================================================================
-- 4. UPDATE THE students_with_classes VIEW
-- ============================================================================

-- Recreate the students_with_classes view to use the new schema
CREATE OR REPLACE VIEW students_with_classes AS
SELECT 
  s.id,
  s.name,
  s.created_at,
  s.updated_at,
  s.class_id,
  c.name as class_name,
  c.description as class_description
FROM students s
LEFT JOIN classes c ON s.class_id = c.id;

-- ============================================================================
-- 5. UPDATE THE classes_with_students VIEW
-- ============================================================================

-- Recreate the classes_with_students view to use the new schema
CREATE OR REPLACE VIEW classes_with_students AS
SELECT 
  c.id,
  c.name,
  c.description,
  c.created_at,
  c.updated_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', s.id,
        'name', s.name
      )
    ) FILTER (WHERE s.id IS NOT NULL),
    '[]'::json
  ) as students,
  COUNT(s.id) as student_count
FROM classes c
LEFT JOIN students s ON c.id = s.class_id
GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at;

-- ============================================================================
-- 6. VERIFY THE FIX
-- ============================================================================

-- Check that the class_id column exists
SELECT '✅ class_id column added to students table' as status 
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'students' AND column_name = 'class_id'
);

-- Show the updated students table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Show students with their class assignments
SELECT 
  s.name as student_name,
  COALESCE(c.name, 'No class assigned') as class_name
FROM students s
LEFT JOIN classes c ON s.class_id = c.id
ORDER BY s.name;
