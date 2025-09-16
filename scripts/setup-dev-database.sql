-- Development Database Setup Script
-- Run this in your development Supabase project's SQL Editor

-- 1. Create Storage Bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies (if any)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update" ON storage.objects;

-- 3. Create Anonymous Access Policies for Storage
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

-- 4. Create students table for anonymous user management
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create RLS policies for students table
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

-- 6. Insert some default students for testing
INSERT INTO students (name) VALUES 
  ('admin'),
  ('student1'),
  ('student2'),
  ('student3')
ON CONFLICT (name) DO NOTHING;

-- 7. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 8. Create trigger for students table
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at 
    BEFORE UPDATE ON students 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Create templates table
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

-- 10. Add RLS policies for templates table
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read templates" ON templates FOR SELECT USING (true);
CREATE POLICY "Anyone can insert templates" ON templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update templates" ON templates FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete templates" ON templates FOR DELETE USING (true);

-- 11. Create trigger for templates table
DROP TRIGGER IF EXISTS update_templates_updated_at ON templates;
CREATE TRIGGER update_templates_updated_at 
    BEFORE UPDATE ON templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 12. Verify setup
SELECT 'Storage bucket created' as status WHERE EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'files'
);

SELECT 'Storage policies created' as status WHERE EXISTS (
  SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
);

SELECT 'Students table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'students'
);

SELECT 'Default students inserted' as status WHERE EXISTS (
  SELECT 1 FROM students WHERE name = 'admin'
);

SELECT 'Templates table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'templates'
);
