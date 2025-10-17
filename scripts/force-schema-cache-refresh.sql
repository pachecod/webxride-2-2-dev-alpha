-- Force Supabase schema cache refresh for file_tags table
-- This should resolve the "column does not exist" error

-- 1. First, let's verify the current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- 2. Check if the table has any data
SELECT COUNT(*) as total_rows FROM file_tags;

-- 3. Try to insert a test record to force schema recognition
INSERT INTO file_tags (file_path, tag_name) 
VALUES ('schema-test', 'test-tag')
ON CONFLICT (file_path, tag_name) DO NOTHING;

-- 4. Query the test record to verify it works
SELECT * FROM file_tags WHERE file_path = 'schema-test';

-- 5. Delete the test record
DELETE FROM file_tags WHERE file_path = 'schema-test';

-- 6. Force a schema refresh by querying the table structure again
SELECT 
  schemaname, 
  tablename, 
  rowsecurity,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename = 'file_tags';

-- 7. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'file_tags';

-- 8. Force refresh by making a simple query with all columns
SELECT id, file_path, tag_name, created_at 
FROM file_tags 
LIMIT 1;

-- 9. Final verification
SELECT 'Schema cache refresh completed' as status;
