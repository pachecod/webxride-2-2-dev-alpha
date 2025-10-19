-- Create a completely new table with a different name to bypass schema cache issues
-- This will be called 'filetags' (no underscore) to avoid any caching problems

SELECT 'Creating new filetags table to bypass schema cache issues...' as status;

-- 1. Create the new table with a different name
CREATE TABLE filetags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag_name)
);

-- 2. Create indexes for performance
CREATE INDEX idx_filetags_file_path ON filetags(file_path);
CREATE INDEX idx_filetags_tag_name ON filetags(tag_name);
CREATE INDEX idx_filetags_created_at ON filetags(created_at);

-- 3. Enable RLS
ALTER TABLE filetags ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive RLS policies (same as other tables)
CREATE POLICY "Allow all operations on filetags" ON filetags 
FOR ALL USING (true) WITH CHECK (true);

-- 5. Test the table immediately
INSERT INTO filetags (file_path, tag_name) 
VALUES ('test-new-table', 'test-tag');

-- 6. Verify the insert worked
SELECT * FROM filetags WHERE file_path = 'test-new-table';

-- 7. Clean up test data
DELETE FROM filetags WHERE file_path = 'test-new-table';

-- 8. Show final structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'filetags' 
ORDER BY ordinal_position;

SELECT 'New filetags table created successfully - this should bypass schema cache issues' as status;
