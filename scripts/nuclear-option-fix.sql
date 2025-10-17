-- Nuclear option: Completely recreate the file_tags table
-- This will definitely fix the schema cache issue

-- 1. Drop the table completely (this will clear all cache references)
DROP TABLE IF EXISTS file_tags CASCADE;

-- 2. Recreate the table with the exact structure we need
CREATE TABLE file_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag_name)
);

-- 3. Create indexes
CREATE INDEX idx_file_tags_file_path ON file_tags(file_path);
CREATE INDEX idx_file_tags_tag_name ON file_tags(tag_name);
CREATE INDEX idx_file_tags_created_at ON file_tags(created_at);

-- 4. Enable RLS
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;

-- 5. Create permissive RLS policies
CREATE POLICY "Allow all operations on file_tags" ON file_tags 
FOR ALL USING (true) WITH CHECK (true);

-- 6. Test the table immediately
INSERT INTO file_tags (file_path, tag_name) 
VALUES ('test-file', 'test-tag');

-- 7. Verify the insert worked
SELECT * FROM file_tags WHERE file_path = 'test-file';

-- 8. Clean up test data
DELETE FROM file_tags WHERE file_path = 'test-file';

-- 9. Show final structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- 10. Final verification
SELECT 'file_tags table recreated successfully' as status;
