-- Test Source Metadata - Add metadata to existing file for testing
-- Replace 'your-file-path' with the actual file path from your upload

-- First, let's see what files exist with their current metadata
SELECT 
    name,
    metadata,
    created_at
FROM storage.objects 
WHERE bucket_id = 'files' 
  AND name LIKE '%cucumber%'  -- Replace with your file name pattern
ORDER BY created_at DESC
LIMIT 5;

-- Now let's add source metadata to a specific file
-- Replace 'Test Student/3d/cucumber_1754340883070.glb' with your actual file path
UPDATE storage.objects 
SET metadata = jsonb_set(
    COALESCE(metadata, '{}'::jsonb),
    '{sourceUrl}',
    '"https://example.com/cucumber-model"'
)
WHERE name = 'Test Student/3d/cucumber_1754340883070.glb' 
  AND bucket_id = 'files';

-- Also add source info
UPDATE storage.objects 
SET metadata = jsonb_set(
    metadata,
    '{sourceInfo}',
    '"3D model of a cucumber created by Example Artist. Licensed under Creative Commons."'
)
WHERE name = 'Test Student/3d/cucumber_1754340883070.glb' 
  AND bucket_id = 'files';

-- Add uploaded by info
UPDATE storage.objects 
SET metadata = jsonb_set(
    metadata,
    '{uploadedBy}',
    '"Test Student"'
)
WHERE name = 'Test Student/3d/cucumber_1754340883070.glb' 
  AND bucket_id = 'files';

-- Add uploaded at info
UPDATE storage.objects 
SET metadata = jsonb_set(
    metadata,
    '{uploadedAt}',
    '"2024-01-15T12:00:00.000Z"'
)
WHERE name = 'Test Student/3d/cucumber_1754340883070.glb' 
  AND bucket_id = 'files';

-- Verify the metadata was added
SELECT 
    name,
    metadata->>'sourceUrl' as source_url,
    metadata->>'sourceInfo' as source_info,
    metadata->>'uploadedBy' as uploaded_by,
    metadata->>'uploadedAt' as uploaded_at
FROM storage.objects 
WHERE name = 'Test Student/3d/cucumber_1754340883070.glb' 
  AND bucket_id = 'files'; 