-- Force Supabase to recognize the existing tags table
-- This should refresh the schema cache

-- 1. Simple query to trigger schema recognition
SELECT 'Activating tags table...' as status;

-- 2. Query the table directly to force cache refresh
SELECT * FROM tags LIMIT 1;

-- 3. Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tags' 
ORDER BY ordinal_position;

-- 4. Test insert to verify permissions
INSERT INTO tags (file_path, tag_name) 
VALUES ('test-activation', 'test-tag');

-- 5. Verify the insert worked
SELECT * FROM tags WHERE file_path = 'test-activation';

-- 6. Clean up test data
DELETE FROM tags WHERE file_path = 'test-activation';

-- 7. Final verification
SELECT 'Tags table activated successfully' as status;
