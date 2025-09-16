-- Manual Metadata Test for WebxRide
-- This script manually adds metadata to test if the storage system supports custom metadata

-- First, let's see the current state of the cucumber file
SELECT 
    name,
    metadata,
    created_at,
    updated_at
FROM storage.objects 
WHERE bucket_id = 'files' 
  AND name = 'Test Student/3d/cucumber_1754341119852.glb';

-- Now let's manually add the source metadata
UPDATE storage.objects 
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{sourceUrl}',
    '"https://sketchfab.com"'
)
WHERE bucket_id = 'files' 
  AND name = 'Test Student/3d/cucumber_1754341119852.glb';

-- Add source info
UPDATE storage.objects 
SET metadata = jsonb_set(
    metadata,
    '{sourceInfo}',
    '"Source info test"'
)
WHERE bucket_id = 'files' 
  AND name = 'Test Student/3d/cucumber_1754341119852.glb';

-- Add uploaded by info
UPDATE storage.objects 
SET metadata = jsonb_set(
    metadata,
    '{uploadedBy}',
    '"Test Student"'
)
WHERE bucket_id = 'files' 
  AND name = 'Test Student/3d/cucumber_1754341119852.glb';

-- Add uploaded at info
UPDATE storage.objects 
SET metadata = jsonb_set(
    metadata,
    '{uploadedAt}',
    '"2025-08-04T20:58:39.852Z"'
)
WHERE bucket_id = 'files' 
  AND name = 'Test Student/3d/cucumber_1754341119852.glb';

-- Verify the metadata was added
SELECT 
    name,
    metadata->>'sourceUrl' as source_url,
    metadata->>'sourceInfo' as source_info,
    metadata->>'uploadedBy' as uploaded_by,
    metadata->>'uploadedAt' as uploaded_at,
    metadata
FROM storage.objects 
WHERE bucket_id = 'files' 
  AND name = 'Test Student/3d/cucumber_1754341119852.glb';

-- If this works, then the issue is with the upload process, not the storage system
-- If this doesn't work, then there's a fundamental issue with metadata storage 