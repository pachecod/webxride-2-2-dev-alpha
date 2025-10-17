-- Check the actual structure of the file_tags table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;
