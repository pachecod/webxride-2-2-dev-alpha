-- Force Supabase to recognize the filetags table
-- This should refresh the schema cache

-- 1. Simple query to trigger schema recognition
SELECT 'Forcing schema refresh for filetags table...' as status;

-- 2. Query the table directly to force cache refresh
SELECT * FROM filetags LIMIT 1;

-- 3. Check if table is accessible
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'filetags' 
ORDER BY ordinal_position;

-- 4. Test insert to verify permissions
INSERT INTO filetags (file_path, tag_name) 
VALUES ('test-schema-refresh', 'test-tag');

-- 5. Verify the insert worked
SELECT * FROM filetags WHERE file_path = 'test-schema-refresh';

-- 6. Clean up test data
DELETE FROM filetags WHERE file_path = 'test-schema-refresh';

-- 7. Final verification
SELECT 'Schema refresh complete - filetags table should now be accessible' as status;
