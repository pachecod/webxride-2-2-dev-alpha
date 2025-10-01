-- Test script to check metadata upload and storage
-- Run this in your Supabase SQL editor

-- First, let's see what metadata is currently stored for files
SELECT 
  name,
  metadata,
  created_at,
  updated_at
FROM storage.objects 
WHERE bucket_id = 'files' 
  AND name LIKE '%cucumber%'
ORDER BY created_at DESC
LIMIT 5;

-- Let's also check what the metadata structure looks like for recent uploads
SELECT 
  name,
  metadata,
  jsonb_typeof(metadata) as metadata_type,
  metadata ? 'sourceUrl' as has_source_url,
  metadata ? 'sourceInfo' as has_source_info,
  metadata ? 'uploadedBy' as has_uploaded_by,
  metadata ? 'uploadedAt' as has_uploaded_at
FROM storage.objects 
WHERE bucket_id = 'files' 
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any storage policies that might be blocking metadata
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
WHERE tablename = 'objects' 
  AND schemaname = 'storage'; 