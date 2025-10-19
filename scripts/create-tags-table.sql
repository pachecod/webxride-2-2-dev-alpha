-- Create a completely new table called 'tags' (different name)
-- This should bypass any schema cache issues

-- 1. Create the new table with a completely different name
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag_name)
);

-- 2. Create indexes
CREATE INDEX idx_tags_file_path ON tags(file_path);
CREATE INDEX idx_tags_tag_name ON tags(tag_name);
CREATE INDEX idx_tags_created_at ON tags(created_at);

-- 3. Enable RLS
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive RLS policies
CREATE POLICY "Allow all operations on tags" ON tags 
FOR ALL USING (true) WITH CHECK (true);

-- 5. Test the table immediately
INSERT INTO tags (file_path, tag_name) 
VALUES ('test-file', 'test-tag');

-- 6. Verify the insert worked
SELECT * FROM tags WHERE file_path = 'test-file';

-- 7. Clean up test data
DELETE FROM tags WHERE file_path = 'test-file';

-- 8. Show final structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'tags' 
ORDER BY ordinal_position;

-- 9. Final verification
SELECT 'tags table created successfully' as status;
