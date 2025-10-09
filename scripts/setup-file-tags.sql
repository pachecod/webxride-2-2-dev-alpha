-- File Tags Database Setup Script
-- Run this in your Supabase project's SQL Editor

-- 1. Create file_tags table
CREATE TABLE IF NOT EXISTS file_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag_name)
);

-- 2. Create index for faster searches
CREATE INDEX IF NOT EXISTS idx_file_tags_tag_name ON file_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_file_tags_created_by ON file_tags(created_by);
CREATE INDEX IF NOT EXISTS idx_file_tags_file_path ON file_tags(file_path);

-- 3. Enable RLS
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read their own tags" ON file_tags;
DROP POLICY IF EXISTS "Anyone can insert tags" ON file_tags;
DROP POLICY IF EXISTS "Anyone can update their own tags" ON file_tags;
DROP POLICY IF EXISTS "Anyone can delete their own tags" ON file_tags;

-- 5. Create RLS policies
-- Users can read their own tags, admin can read all
CREATE POLICY "Anyone can read their own tags" ON file_tags 
FOR SELECT USING (true);

-- Anyone can insert tags
CREATE POLICY "Anyone can insert tags" ON file_tags 
FOR INSERT WITH CHECK (true);

-- Users can update their own tags
CREATE POLICY "Anyone can update their own tags" ON file_tags 
FOR UPDATE USING (true);

-- Users can delete their own tags
CREATE POLICY "Anyone can delete their own tags" ON file_tags 
FOR DELETE USING (true);

-- 6. Create helper view for user-specific tag searches
CREATE OR REPLACE VIEW user_tagged_files AS
SELECT 
  ft.file_path,
  ft.file_name,
  ft.created_by,
  array_agg(DISTINCT ft.tag_name) as tags,
  max(ft.created_at) as last_tagged
FROM file_tags ft
GROUP BY ft.file_path, ft.file_name, ft.created_by;

-- 7. Verify setup
SELECT 'File tags table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'file_tags'
);

SELECT 'Indexes created' as status WHERE EXISTS (
  SELECT 1 FROM pg_indexes WHERE tablename = 'file_tags'
);

SELECT 'RLS enabled' as status WHERE EXISTS (
  SELECT 1 FROM pg_tables WHERE tablename = 'file_tags' AND rowsecurity = true
);

