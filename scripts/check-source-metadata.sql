-- Check and Fix Source Metadata Access
-- This script helps debug and fix issues with source metadata not appearing

-- 1. Check current storage policies
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
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 2. Check if metadata is being stored (run this after uploading a file with source data)
-- Replace 'your-file-path' with the actual file path
SELECT 
    name,
    metadata,
    created_at,
    updated_at
FROM storage.objects 
WHERE name LIKE '%your-file-path%'
ORDER BY created_at DESC
LIMIT 5;

-- 3. If metadata is not accessible, ensure these policies exist:

-- Allow reading metadata for all files
CREATE POLICY "Allow reading file metadata" ON storage.objects 
FOR SELECT USING (bucket_id = 'files');

-- Allow updating metadata for authenticated users
CREATE POLICY "Allow updating file metadata" ON storage.objects 
FOR UPDATE USING (bucket_id = 'files' AND auth.role() = 'authenticated');

-- 4. Test metadata access (run this to see if metadata is accessible)
SELECT 
    name,
    metadata->>'sourceUrl' as source_url,
    metadata->>'sourceInfo' as source_info,
    metadata->>'uploadedBy' as uploaded_by,
    metadata->>'uploadedAt' as uploaded_at
FROM storage.objects 
WHERE bucket_id = 'files' 
  AND metadata IS NOT NULL
  AND (metadata->>'sourceUrl' IS NOT NULL OR metadata->>'sourceInfo' IS NOT NULL)
ORDER BY created_at DESC
LIMIT 10;

-- 5. If you need to manually update metadata for testing:
-- UPDATE storage.objects 
-- SET metadata = jsonb_set(
--     COALESCE(metadata, '{}'::jsonb),
--     '{sourceUrl}',
--     '"https://example.com/source"'
-- )
-- WHERE name = 'your-file-path' AND bucket_id = 'files'; 