-- SQL for Supabase snippets table

-- Handle existing snippets table structure migration
DO $$ 
BEGIN
  -- Check if snippets table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'snippets') THEN
    -- Check if it has 'name' column instead of 'title'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'snippets' AND column_name = 'name') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'snippets' AND column_name = 'title') THEN
      -- Rename 'name' to 'title'
      ALTER TABLE snippets RENAME COLUMN name TO title;
      RAISE NOTICE 'Renamed snippets.name to snippets.title';
    END IF;
    
    -- Check if it has 'content' column instead of 'code'
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'snippets' AND column_name = 'content') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'snippets' AND column_name = 'code') THEN
      -- Rename 'content' to 'code'
      ALTER TABLE snippets RENAME COLUMN content TO code;
      RAISE NOTICE 'Renamed snippets.content to snippets.code';
    END IF;
    
    -- Ensure title column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'snippets' AND column_name = 'title') THEN
      ALTER TABLE snippets ADD COLUMN title text NOT NULL DEFAULT '';
      RAISE NOTICE 'Added title column to snippets table';
    END IF;
    
    -- Ensure code column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'snippets' AND column_name = 'code') THEN
      ALTER TABLE snippets ADD COLUMN code text NOT NULL DEFAULT '';
      RAISE NOTICE 'Added code column to snippets table';
    END IF;
  ELSE
    -- Table doesn't exist, create it
    CREATE TABLE snippets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      code text NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    RAISE NOTICE 'Created snippets table';
  END IF;
END $$;

-- Preload with initial snippets
INSERT INTO snippets (title, code) VALUES
  ('Paragraph', '<p>A paragrah.</p>'),
  ('Headline', '<h1>A Headline</h1>'),
  ('Subheadline', '<h2>A Subheadline</h2>'),
  ('Image', '<img src="" width="300"/> <!-- An image. Put your image URL inside ""-->')
ON CONFLICT DO NOTHING;

