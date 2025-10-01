-- Fix Supabase Storage Policies to Allow Custom Metadata
-- Run this in your Supabase SQL editor

-- First, let's see what policies currently exist
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

-- Drop any existing restrictive policies that might block metadata
DROP POLICY IF EXISTS "Allow reading files and metadata" ON storage.objects;
DROP POLICY IF EXISTS "Allow inserting files with metadata" ON storage.objects;
DROP POLICY IF EXISTS "Allow updating files and metadata" ON storage.objects;
DROP POLICY IF EXISTS "Allow deleting files" ON storage.objects;

-- Create comprehensive policies that allow all operations including custom metadata
CREATE POLICY "Allow reading files and metadata" ON storage.objects
  FOR SELECT USING (bucket_id = 'files');

CREATE POLICY "Allow inserting files with metadata" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'files');

CREATE POLICY "Allow updating files and metadata" ON storage.objects
  FOR UPDATE USING (bucket_id = 'files');

CREATE POLICY "Allow deleting files" ON storage.objects
  FOR DELETE USING (bucket_id = 'files');

-- Also ensure the same for other buckets if they exist
CREATE POLICY "Allow reading templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'templates');

CREATE POLICY "Allow inserting templates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'templates');

CREATE POLICY "Allow updating templates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'templates');

CREATE POLICY "Allow deleting templates" ON storage.objects
  FOR DELETE USING (bucket_id = 'templates');

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname; 