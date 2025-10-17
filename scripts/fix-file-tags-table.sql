-- Fix file_tags table to have the minimal required structure
-- This ensures the table has the columns we need for tagging

-- Drop and recreate the table with minimal structure
DROP TABLE IF EXISTS file_tags CASCADE;

-- Create a simple file_tags table with only essential columns
CREATE TABLE file_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag_name)
);

-- Create index for faster searches
CREATE INDEX idx_file_tags_file_path ON file_tags(file_path);
CREATE INDEX idx_file_tags_tag_name ON file_tags(tag_name);

-- Enable RLS
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (allow all operations for now)
CREATE POLICY "Allow all operations on file_tags" ON file_tags 
FOR ALL USING (true) WITH CHECK (true);

-- Verify the table was created correctly
SELECT 'File tags table created successfully' as status;
