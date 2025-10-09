-- SQL for Supabase snippets table
-- Drop existing table if needed to recreate with correct structure
-- WARNING: Only run this if you don't have important snippets already
-- DROP TABLE IF EXISTS snippets CASCADE;

-- Create table (will skip if already exists with correct structure)
CREATE TABLE IF NOT EXISTS snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add columns if table exists but is missing them
DO $$ 
BEGIN
  -- Add title column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'snippets' AND column_name = 'title') THEN
    ALTER TABLE snippets ADD COLUMN title text NOT NULL DEFAULT '';
  END IF;
  
  -- Add code column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'snippets' AND column_name = 'code') THEN
    ALTER TABLE snippets ADD COLUMN code text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Preload with initial snippets
INSERT INTO snippets (title, code) VALUES
  ('Paragraph', '<p>A paragrah.</p>'),
  ('Headline', '<h1>A Headline</h1>'),
  ('Subheadline', '<h2>A Subheadline</h2>'),
  ('Image', '<img src="" width="300"/> <!-- An image. Put your image URL inside ""-->')
ON CONFLICT DO NOTHING;

