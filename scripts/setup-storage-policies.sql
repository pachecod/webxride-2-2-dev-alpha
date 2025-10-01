-- Storage Policies Setup Script
-- Run this after creating your storage bucket to set up proper access policies
-- This script handles the new folder structure: images/, videos/, audio/, 3d/, other/, common-assets/

-- 1. Drop existing policies (if any)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update" ON storage.objects;

-- 2. Create comprehensive storage policies for the new folder structure

-- Allow anyone to read files from any folder
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'files');

-- Allow anyone to upload to user-specific folders (images/, videos/, audio/, 3d/, other/)
-- These folders are created automatically when users upload files
CREATE POLICY "Anonymous users can upload to user folders" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'files' AND (
    storage.foldername(name)[1] IN ('images', 'videos', 'audio', '3d', 'other') OR
    storage.foldername(name)[1] = 'public_html'
  )
);

-- Allow anyone to update files in user-specific folders
CREATE POLICY "Anonymous users can update user folders" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'files' AND (
    storage.foldername(name)[1] IN ('images', 'videos', 'audio', '3d', 'other') OR
    storage.foldername(name)[1] = 'public_html'
  )
);

-- Allow anyone to delete files from user-specific folders
CREATE POLICY "Anonymous users can delete from user folders" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'files' AND (
    storage.foldername(name)[1] IN ('images', 'videos', 'audio', '3d', 'other') OR
    storage.foldername(name)[1] = 'public_html'
  )
);

-- Allow anyone to upload to common-assets (admin check handled in app)
CREATE POLICY "Anyone can upload to common assets" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'files' AND storage.foldername(name)[1] = 'common-assets'
);

-- Allow anyone to update common assets (admin check handled in app)
CREATE POLICY "Anyone can update common assets" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'files' AND storage.foldername(name)[1] = 'common-assets'
);

-- Allow anyone to delete from common assets (admin check handled in app)
CREATE POLICY "Anyone can delete from common assets" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'files' AND storage.foldername(name)[1] = 'common-assets'
);

-- 3. Verify policies were created
SELECT 
  policyname,
  tablename,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;

-- 4. Show expected folder structure
SELECT 'Expected folder structure:' as info;
SELECT 'files/images/' as folder UNION ALL
SELECT 'files/videos/' UNION ALL
SELECT 'files/audio/' UNION ALL
SELECT 'files/3d/' UNION ALL
SELECT 'files/other/' UNION ALL
SELECT 'files/public_html/' UNION ALL
SELECT 'files/common-assets/'; 