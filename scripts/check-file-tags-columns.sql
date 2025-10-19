-- Check what columns actually exist in the file_tags table

SELECT 'Checking file_tags table structure...' as status;

SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- Try a simple query to see what works
SELECT 'Testing simple query...' as status;
SELECT * FROM file_tags LIMIT 1;

-- Check if we can insert with minimal columns
SELECT 'Testing insert with minimal columns...' as status;
INSERT INTO file_tags (file_path, tag_name) 
VALUES ('test-simple', 'test-tag');

-- Verify the insert worked
SELECT * FROM file_tags WHERE file_path = 'test-simple';

-- Clean up test data
DELETE FROM file_tags WHERE file_path = 'test-simple';

SELECT 'Test complete - file_tags table is accessible' as status;
