-- Quick Setup Script for WebXRide
-- Run this single script in your Supabase SQL Editor for a complete setup
-- This combines all essential database and storage setup steps

-- ============================================================================
-- 1. STORAGE BUCKET SETUP
-- ============================================================================

-- Create storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. STORAGE POLICIES SETUP
-- ============================================================================

-- Drop existing policies (if any) - comprehensive cleanup
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload to user folders" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update user folders" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete from user folders" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to common assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update common assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete from common assets" ON storage.objects;

-- Allow anyone to read files from any folder
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'files');

-- Allow anyone to upload to user-specific folders
CREATE POLICY "Anonymous users can upload to user folders" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'files' AND (
    name LIKE 'images/%' OR
    name LIKE 'videos/%' OR
    name LIKE 'audio/%' OR
    name LIKE '3d/%' OR
    name LIKE 'other/%' OR
    name LIKE 'public_html/%'
  )
);

-- Allow anyone to update files in user-specific folders
CREATE POLICY "Anonymous users can update user folders" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'files' AND (
    name LIKE 'images/%' OR
    name LIKE 'videos/%' OR
    name LIKE 'audio/%' OR
    name LIKE '3d/%' OR
    name LIKE 'other/%' OR
    name LIKE 'public_html/%'
  )
);

-- Allow anyone to delete files from user-specific folders
CREATE POLICY "Anonymous users can delete from user folders" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'files' AND (
    name LIKE 'images/%' OR
    name LIKE 'videos/%' OR
    name LIKE 'audio/%' OR
    name LIKE '3d/%' OR
    name LIKE 'other/%' OR
    name LIKE 'public_html/%'
  )
);

-- Allow anyone to upload to common-assets (admin check handled in app)
CREATE POLICY "Anyone can upload to common assets" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'files' AND name LIKE 'common-assets/%'
);

-- Allow anyone to update common assets (admin check handled in app)
CREATE POLICY "Anyone can update common assets" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'files' AND name LIKE 'common-assets/%'
);

-- Allow anyone to delete from common assets (admin check handled in app)
CREATE POLICY "Anyone can delete from common assets" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'files' AND name LIKE 'common-assets/%'
);

-- ============================================================================
-- 3. DATABASE TABLES SETUP
-- ============================================================================

-- Create classes table first (needed for foreign key reference)
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table for anonymous user management
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  framework TEXT,
  files JSONB,
  creator_id TEXT,
  creator_email TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: Using direct foreign key approach instead of junction table
-- Each student can belong to one class via class_id column

-- Create snippets table for admin snippets management
CREATE TABLE IF NOT EXISTS snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create about_page table for admin about page management
CREATE TABLE IF NOT EXISTS about_page (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'About WebXRide',
  content TEXT NOT NULL DEFAULT 'Welcome to WebXRide!',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS) SETUP
-- ============================================================================

-- Enable RLS on students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read students (for user selection)
CREATE POLICY "Anyone can read students" ON students 
FOR SELECT USING (true);

-- Allow anyone to insert students (for admin adding students)
CREATE POLICY "Anyone can insert students" ON students 
FOR INSERT WITH CHECK (true);

-- Allow anyone to update students (for admin editing students)
CREATE POLICY "Anyone can update students" ON students 
FOR UPDATE USING (true);

-- Allow anyone to delete students (for admin removing students)
CREATE POLICY "Anyone can delete students" ON students 
FOR DELETE USING (true);

-- Enable RLS on templates table
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read templates
CREATE POLICY "Anyone can read templates" ON templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert templates" ON templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update templates" ON templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete templates" ON templates FOR DELETE USING (true);

-- Enable RLS on classes table
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert classes" ON classes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update classes" ON classes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete classes" ON classes FOR DELETE USING (true);

-- Note: No junction table policies needed - using direct foreign key approach

-- Enable RLS on snippets
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read snippets" ON snippets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert snippets" ON snippets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update snippets" ON snippets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete snippets" ON snippets FOR DELETE USING (true);

-- Enable RLS on about_page
ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read about_page" ON about_page FOR SELECT USING (true);
CREATE POLICY "Anyone can insert about_page" ON about_page FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update about_page" ON about_page FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete about_page" ON about_page FOR DELETE USING (true);

-- ============================================================================
-- 5. TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for templates table
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for classes table
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for snippets table
CREATE TRIGGER update_snippets_updated_at 
    BEFORE UPDATE ON snippets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. SEED DEFAULT DATA
-- ============================================================================

-- Insert default students for testing
INSERT INTO students (name) VALUES 
  ('admin'),
  ('student1'),
  ('student2'),
  ('student3')
ON CONFLICT (name) DO NOTHING;

-- Insert default snippets for admin management
INSERT INTO snippets (name, content, category) VALUES 
  ('Basic HTML', '<!DOCTYPE html>\n<html>\n<head>\n  <title>My Page</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>', 'HTML'),
  ('Basic CSS', 'body {\n  font-family: Arial, sans-serif;\n  margin: 0;\n  padding: 20px;\n  background-color: #f0f0f0;\n}', 'CSS'),
  ('Basic JavaScript', 'console.log("Hello, World!");\n\ndocument.addEventListener("DOMContentLoaded", function() {\n  // Your code here\n});', 'JavaScript')
ON CONFLICT (name) DO NOTHING;

-- Insert default about page content
INSERT INTO about_page (title, content) VALUES 
  ('About WebXRide', 'WebXRide is a powerful platform for creating and managing WebXR experiences, 3D content, and interactive web applications.')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 7. DATABASE VIEWS FOR ADMIN FEATURES
-- ============================================================================

-- Create students_with_classes view (using direct foreign key approach)
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

-- Create classes_with_students view (using direct foreign key approach)
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

-- Grant access to the views
GRANT SELECT ON students_with_classes TO anon;
GRANT SELECT ON students_with_classes TO authenticated;
GRANT SELECT ON classes_with_students TO anon;
GRANT SELECT ON classes_with_students TO authenticated;

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

-- Verify storage bucket
SELECT '✅ Storage bucket created' as status WHERE EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'files'
);

-- Verify storage policies
SELECT '✅ Storage policies created' as status WHERE EXISTS (
  SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
);

-- Verify students table
SELECT '✅ Students table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'students'
);

-- Verify default students
SELECT '✅ Default students inserted' as status WHERE EXISTS (
  SELECT 1 FROM students WHERE name = 'admin'
);

-- Verify templates table
SELECT '✅ Templates table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'templates'
);

-- Verify classes table
SELECT '✅ Classes table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'classes'
);

-- Note: Using direct foreign key approach, no junction table needed

-- Verify snippets table
SELECT '✅ Snippets table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets'
);

-- Verify about_page table
SELECT '✅ About_page table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'about_page'
);

-- Verify database views
SELECT '✅ Students_with_classes view created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.views WHERE table_name = 'students_with_classes' AND table_schema = 'public'
);

SELECT '✅ Classes_with_students view created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.views WHERE table_name = 'classes_with_students' AND table_schema = 'public'
);

-- Show expected folder structure
SELECT '📁 Expected folder structure:' as info;
SELECT 'files/images/' as folder UNION ALL
SELECT 'files/videos/' UNION ALL
SELECT 'files/audio/' UNION ALL
SELECT 'files/3d/' UNION ALL
SELECT 'files/other/' UNION ALL
SELECT 'files/public_html/' UNION ALL
SELECT 'files/common-assets/';

-- Show all created policies
SELECT 
  '🔒 Storage Policy: ' || policyname as policy_info,
  cmd as operation,
  qual as condition
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname; 