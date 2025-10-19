-- Create a brand new table called 'filetags' (no underscore)
-- This will test if the issue is caching or code-related

-- 1. Create the new table with a different name
CREATE TABLE filetags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag_name)
);

-- 2. Create indexes
CREATE INDEX idx_filetags_file_path ON filetags(file_path);
CREATE INDEX idx_filetags_tag_name ON filetags(tag_name);
CREATE INDEX idx_filetags_created_at ON filetags(created_at);

-- 3. Enable RLS
ALTER TABLE filetags ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive RLS policies
CREATE POLICY "Allow all operations on filetags" ON filetags 
FOR ALL USING (true) WITH CHECK (true);

-- 5. Test the table immediately
INSERT INTO filetags (file_path, tag_name) 
VALUES ('test-file', 'test-tag');

-- 6. Verify the insert worked
SELECT * FROM filetags WHERE file_path = 'test-file';

-- 7. Clean up test data
DELETE FROM filetags WHERE file_path = 'test-file';

-- 8. Show final structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'filetags' 
ORDER BY ordinal_position;

-- 9. Final verification
SELECT 'filetags table created successfully' as status;
