-- Simple script to add tag_name column to file_tags table
-- This is the most direct approach

-- 1. Add the tag_name column
ALTER TABLE file_tags ADD COLUMN tag_name TEXT;

-- 2. Set a default value for any existing rows
UPDATE file_tags SET tag_name = 'untagged' WHERE tag_name IS NULL;

-- 3. Make the column NOT NULL
ALTER TABLE file_tags ALTER COLUMN tag_name SET NOT NULL;

-- 4. Add a unique constraint on (file_path, tag_name)
ALTER TABLE file_tags ADD CONSTRAINT file_tags_file_path_tag_name_key UNIQUE (file_path, tag_name);

-- 5. Create an index for better performance
CREATE INDEX idx_file_tags_tag_name ON file_tags(tag_name);

-- 6. Test the table
INSERT INTO file_tags (file_path, tag_name) VALUES ('test', 'test-tag');
SELECT * FROM file_tags WHERE file_path = 'test';
DELETE FROM file_tags WHERE file_path = 'test';

-- 7. Show final structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;
