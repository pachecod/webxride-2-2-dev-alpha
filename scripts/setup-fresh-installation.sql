-- Complete Database Setup Script for Fresh WebXRide Installation
-- Run this in your Supabase project's SQL Editor for a fresh installation

SELECT 'Starting fresh WebXRide database setup...' as status;

-- =============================================================================
-- 1. STORAGE SETUP
-- =============================================================================

-- Create Storage Bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies (if any)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update" ON storage.objects;

-- Create Anonymous Access Policies for Storage
-- Allow anyone to read files
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'files');

-- Allow anyone to upload files (for anonymous access)
CREATE POLICY "Anonymous users can upload" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'files');

-- Allow anyone to update files (for anonymous access)
CREATE POLICY "Anonymous users can update" ON storage.objects 
FOR UPDATE USING (bucket_id = 'files');

-- Allow anyone to delete files (for anonymous access)
CREATE POLICY "Anonymous users can delete" ON storage.objects 
FOR DELETE USING (bucket_id = 'files');

-- =============================================================================
-- 2. STUDENTS TABLE SETUP
-- =============================================================================

-- Create students table for user management
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  password TEXT,
  password_set_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for students table
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- Enable RLS for students table
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for students table
CREATE POLICY "Anyone can read students" ON students 
FOR SELECT USING (true);

CREATE POLICY "Anyone can insert students" ON students 
FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update students" ON students 
FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete students" ON students 
FOR DELETE USING (true);

-- Insert default admin user
INSERT INTO students (name, username, is_admin) VALUES 
  ('admin', 'admin', true)
ON CONFLICT (name) DO NOTHING;

-- Insert some default students for testing
INSERT INTO students (name, username, password, is_active) VALUES 
  ('student1', 'student1', 'password123', true),
  ('student2', 'student2', 'password123', true),
  ('student3', 'student3', 'password123', true)
ON CONFLICT (name) DO NOTHING;

-- =============================================================================
-- 3. TEMPLATES TABLE SETUP
-- =============================================================================

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

-- Enable RLS for templates table
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for templates table
CREATE POLICY "Anyone can read templates" ON templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert templates" ON templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update templates" ON templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete templates" ON templates FOR DELETE USING (true);

-- =============================================================================
-- 4. SNIPPETS TABLE SETUP
-- =============================================================================

-- Create snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'html',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for snippets table
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for snippets table
CREATE POLICY "Anyone can read snippets" ON snippets FOR SELECT USING (true);
CREATE POLICY "Anyone can insert snippets" ON snippets FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update snippets" ON snippets FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete snippets" ON snippets FOR DELETE USING (true);

-- Insert default snippets
INSERT INTO snippets (title, code, language) VALUES
  ('Paragraph', '<p>A paragraph.</p>', 'html'),
  ('Headline', '<h1>A Headline</h1>', 'html'),
  ('Subheadline', '<h2>A Subheadline</h2>', 'html'),
  ('Image', '<img src="" width="300"/> <!-- An image. Put your image URL inside ""-->', 'html'),
  ('Basic HTML Structure', '<!DOCTYPE html>\n<html>\n<head>\n    <title>My Page</title>\n</head>\n<body>\n    <h1>Hello World!</h1>\n</body>\n</html>', 'html')
ON CONFLICT (title) DO NOTHING;

-- =============================================================================
-- 5. FILE TAGS TABLE SETUP
-- =============================================================================

-- Create file_tags table for the tagging system
CREATE TABLE IF NOT EXISTS file_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag)
);

-- Create indexes for file_tags
CREATE INDEX IF NOT EXISTS idx_file_tags_file_path ON file_tags(file_path);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag);
CREATE INDEX IF NOT EXISTS idx_file_tags_created_at ON file_tags(created_at);

-- Enable RLS for file_tags
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_tags
CREATE POLICY "Allow all operations for authenticated users" ON file_tags
FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow read access for anon users" ON file_tags
FOR SELECT TO anon USING (true);

-- =============================================================================
-- 6. UTILITY FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at columns
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_snippets_updated_at ON snippets;
CREATE TRIGGER update_snippets_updated_at 
    BEFORE UPDATE ON snippets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 7. VERIFICATION AND TESTING
-- =============================================================================

-- Test file_tags table
INSERT INTO file_tags (file_path, tag) 
VALUES ('test-file-path', 'test-tag');

-- Verify the insert worked
SELECT 'file_tags test:' as table_name, * FROM file_tags WHERE file_path = 'test-file-path';

-- Clean up test data
DELETE FROM file_tags WHERE file_path = 'test-file-path';

-- =============================================================================
-- 8. FINAL VERIFICATION
-- =============================================================================

-- Verify all tables exist and have correct structure
SELECT 'Storage bucket created' as status WHERE EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'files'
);

SELECT 'Students table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'students'
);

SELECT 'Templates table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'templates'
);

SELECT 'Snippets table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets'
);

SELECT 'File tags table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'file_tags'
);

SELECT 'Default admin user created' as status WHERE EXISTS (
  SELECT 1 FROM students WHERE username = 'admin' AND is_admin = true
);

SELECT 'Default snippets created' as status WHERE EXISTS (
  SELECT 1 FROM snippets WHERE title = 'Paragraph'
);

-- Show final table structures
SELECT 'Students table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

SELECT 'File tags table structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

SELECT '🎉 Fresh WebXRide installation setup complete! All tables and policies are ready.' as status;
