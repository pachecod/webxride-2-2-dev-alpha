-- Fix Storage Policies for WebxRide AgriQuest
-- This script fixes the RLS policies to match the actual folder structure used by the application

-- 1. Drop existing policies (if any)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload to user folders" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update user folders" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete from user folders" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to common assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update common assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete from common assets" ON storage.objects;

-- 2. Create new policies that match the actual folder structure

-- Allow anyone to read files from any folder
CREATE POLICY "Public Access" ON storage.objects 
FOR SELECT USING (bucket_id = 'files');

-- Allow anyone to upload files to user-specific folders
-- Structure: {username}/{fileType}/{filename}
-- Examples: admin/images/photo.jpg, student1/videos/video.mp4
CREATE POLICY "Anyone can upload to user folders" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'files' AND (
    -- Allow uploads to user folders (any username/folder structure)
    name ~ '^[^/]+/(images|audio|3d|other)/' OR
    -- Allow uploads to common-assets
    name ~ '^common-assets/(images|audio|3d|other)/' OR
    -- Allow uploads to user-html folders
    name ~ '^user-html/' OR
    -- Allow uploads to templates
    name ~ '^templates/'
  )
);

-- Allow anyone to update files in user-specific folders
CREATE POLICY "Anyone can update user folders" ON storage.objects 
FOR UPDATE USING (
  bucket_id = 'files' AND (
    -- Allow updates to user folders
    name ~ '^[^/]+/(images|audio|3d|other)/' OR
    -- Allow updates to common-assets
    name ~ '^common-assets/(images|audio|3d|other)/' OR
    -- Allow updates to user-html folders
    name ~ '^user-html/' OR
    -- Allow updates to templates
    name ~ '^templates/'
  )
);

-- Allow anyone to delete files from user-specific folders
CREATE POLICY "Anyone can delete from user folders" ON storage.objects 
FOR DELETE USING (
  bucket_id = 'files' AND (
    -- Allow deletes from user folders
    name ~ '^[^/]+/(images|audio|3d|other)/' OR
    -- Allow deletes from common-assets
    name ~ '^common-assets/(images|audio|3d|other)/' OR
    -- Allow deletes from user-html folders
    name ~ '^user-html/' OR
    -- Allow deletes from templates
    name ~ '^templates/'
  )
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
SELECT 'files/{username}/images/' as folder UNION ALL
SELECT 'files/{username}/audio/' UNION ALL
SELECT 'files/{username}/3d/' UNION ALL
SELECT 'files/{username}/other/' UNION ALL
SELECT 'files/common-assets/images/' UNION ALL
SELECT 'files/common-assets/audio/' UNION ALL
SELECT 'files/common-assets/3d/' UNION ALL
SELECT 'files/common-assets/other/' UNION ALL
SELECT 'files/user-html/' UNION ALL
SELECT 'files/templates/';
