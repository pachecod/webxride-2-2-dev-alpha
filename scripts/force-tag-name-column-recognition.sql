-- Force Supabase to recognize the tag_name column in file_tags table
-- This should refresh the schema cache and make the column accessible to the REST API

-- 1. Simple query to trigger schema recognition
SELECT 'Forcing schema refresh for tag_name column...' as status;

-- 2. Query the column directly to force cache refresh
SELECT tag_name FROM file_tags LIMIT 1;

-- 3. Check column details to force schema recognition
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
  AND column_name = 'tag_name';

-- 4. Test insert with tag_name to verify permissions
INSERT INTO file_tags (file_path, tag_name) 
VALUES ('test-column-recognition', 'test-tag-name');

-- 5. Verify the insert worked
SELECT * FROM file_tags WHERE file_path = 'test-column-recognition';

-- 6. Clean up test data
DELETE FROM file_tags WHERE file_path = 'test-column-recognition';

-- 7. Final verification
SELECT 'Column recognition complete - tag_name should now be accessible to REST API' as status;
