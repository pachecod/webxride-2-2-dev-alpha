-- Force Supabase schema cache refresh
-- This script helps refresh the schema cache by making queries that force Supabase to reload the schema

-- 1. Query the table structure to force schema reload
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

-- 2. Make a simple query to the table to force API recognition
SELECT COUNT(*) as row_count FROM file_tags;

-- 3. Query the table with a limit to ensure it's accessible
SELECT id, file_path, tag_name, created_at 
FROM file_tags 
LIMIT 1;

-- 4. Check if RLS is properly enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'file_tags';

-- This should help refresh the schema cache
SELECT 'Schema refresh queries completed' as status;
