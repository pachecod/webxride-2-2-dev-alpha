-- Simple Storage Access Fix
-- Run this in your Supabase SQL editor
-- This approach works without requiring owner permissions

-- 1. First, let's see what policies currently exist
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- 2. Check if the files bucket exists and its current settings
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'files';

-- 3. Try to see what's actually in the user-html folder
SELECT name, bucket_id, created_at, updated_at
FROM storage.objects 
WHERE bucket_id = 'files' 
  AND name LIKE 'user-html/%'
ORDER BY name
LIMIT 10;

-- 4. Check specifically for metadata.json files
SELECT name, bucket_id, created_at, updated_at
FROM storage.objects 
WHERE bucket_id = 'files' 
  AND name LIKE 'user-html/%/metadata.json'
ORDER BY name;

-- 5. If the bucket is not public, try to make it public (this might work)
-- UPDATE storage.buckets SET public = true WHERE id = 'files';
