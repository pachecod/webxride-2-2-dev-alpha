-- Complete fix for file_tags table
-- This will ensure the table has the correct structure regardless of current state

-- 1. Drop the table completely to start fresh
DROP TABLE IF EXISTS file_tags CASCADE;

-- 2. Create the file_tags table with the correct structure
CREATE TABLE file_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag_name)
);

-- 3. Create indexes for better performance
CREATE INDEX idx_file_tags_file_path ON file_tags(file_path);
CREATE INDEX idx_file_tags_tag_name ON file_tags(tag_name);
CREATE INDEX idx_file_tags_created_at ON file_tags(created_at);

-- 4. Enable Row Level Security
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (allow all operations for now)
DROP POLICY IF EXISTS "Allow all operations on file_tags" ON file_tags;
CREATE POLICY "Allow all operations on file_tags" ON file_tags 
FOR ALL USING (true) WITH CHECK (true);

-- 6. Verify the table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- 7. Test insert to make sure it works
INSERT INTO file_tags (file_path, tag_name) 
VALUES ('test/path', 'test-tag');

-- 8. Verify the insert worked
SELECT * FROM file_tags WHERE file_path = 'test/path';

-- 9. Clean up test data
DELETE FROM file_tags WHERE file_path = 'test/path';

-- 10. Final verification
SELECT 'File tags table created and tested successfully' as status;
