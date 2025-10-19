-- Force PostgREST to reload its cached schema
-- This should immediately refresh the schema cache for the REST API

SELECT 'Forcing PostgREST schema reload...' as status;

-- This is the magic command to force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Verify the notification was sent
SELECT 'Schema reload notification sent to PostgREST' as status;

-- Test that the schema is now accessible
SELECT 'Testing schema access...' as status;

-- Try to query the file_tags table to verify it's accessible
SELECT * FROM file_tags LIMIT 1;

-- Test inserting with tag_name column
INSERT INTO file_tags (file_path, tag_name) 
VALUES ('test-postgrest-reload', 'test-tag');

-- Verify the insert worked
SELECT * FROM file_tags WHERE file_path = 'test-postgrest-reload';

-- Clean up test data
DELETE FROM file_tags WHERE file_path = 'test-postgrest-reload';

SELECT 'PostgREST schema reload complete - file_tags table should now be fully accessible' as status;
