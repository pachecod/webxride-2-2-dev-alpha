-- Check the actual structure of the file_tags table
-- This will show us exactly what columns exist

SELECT 'Checking actual file_tags table structure...' as status;

-- Show all columns in the file_tags table
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- Show any existing data to understand the current structure
SELECT 'Showing existing data in file_tags table:' as status;
SELECT * FROM file_tags LIMIT 5;

-- Check if there are any constraints or indexes
SELECT 'Checking constraints and indexes:' as status;
SELECT 
  tc.constraint_name, 
  tc.constraint_type,
  ccu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'file_tags';

SELECT 'File_tags table structure check complete' as status;
