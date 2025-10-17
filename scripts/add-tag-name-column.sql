-- Add the missing tag_name column to the existing file_tags table
-- This is safer than dropping and recreating the table

-- 1. First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- 2. Add the missing tag_name column
ALTER TABLE file_tags 
ADD COLUMN IF NOT EXISTS tag_name TEXT;

-- 3. Make tag_name NOT NULL (we'll need to handle existing rows)
-- First, let's see if there are any existing rows
SELECT COUNT(*) as existing_rows FROM file_tags;

-- 4. If there are existing rows, we need to populate tag_name with a default value
-- For now, let's set a default value for any existing rows
UPDATE file_tags 
SET tag_name = 'untagged' 
WHERE tag_name IS NULL;

-- 5. Now make the column NOT NULL
ALTER TABLE file_tags 
ALTER COLUMN tag_name SET NOT NULL;

-- 6. Add a unique constraint on (file_path, tag_name) if it doesn't exist
-- First, drop the existing unique constraint if it exists
ALTER TABLE file_tags DROP CONSTRAINT IF EXISTS file_tags_file_path_tag_name_key;

-- Add the new unique constraint
ALTER TABLE file_tags 
ADD CONSTRAINT file_tags_file_path_tag_name_key UNIQUE (file_path, tag_name);

-- 7. Create an index on tag_name for better performance
CREATE INDEX IF NOT EXISTS idx_file_tags_tag_name ON file_tags(tag_name);

-- 8. Verify the final table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- 9. Test the table with a sample insert
INSERT INTO file_tags (file_path, tag_name) 
VALUES ('test/path', 'test-tag')
ON CONFLICT (file_path, tag_name) DO NOTHING;

-- 10. Verify the insert worked
SELECT * FROM file_tags WHERE file_path = 'test/path';

-- 11. Clean up test data
DELETE FROM file_tags WHERE file_path = 'test/path';

-- 12. Final verification
SELECT 'tag_name column added successfully' as status;
