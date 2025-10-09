-- Backup Script for WebXRide Database
-- Run this in Supabase SQL Editor and save the output

-- 1. Backup students table
SELECT 'students' as table_name;
SELECT * FROM students;

-- 2. Backup classes table (if exists)
SELECT 'classes' as table_name;
SELECT * FROM classes WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'classes'
);

-- 3. Backup snippets table (if exists)
SELECT 'snippets' as table_name;
SELECT * FROM snippets WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets'
);

-- 4. Backup about_page table (if exists)
SELECT 'about_page' as table_name;
SELECT * FROM about_page WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'about_page'
);

-- 5. Backup default_templates table (if exists)
SELECT 'default_templates' as table_name;
SELECT * FROM default_templates WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'default_templates'
);

-- 6. List all tables for reference
SELECT 'All Tables' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

