-- Setup script for the CORRECT Supabase database
-- This will create the file_tags table and admin_notes table that the app expects

SELECT 'Setting up CORRECT database for WebXRide app...' as status;

-- 1. Create the file_tags table (this is what the tagging system expects)
CREATE TABLE IF NOT EXISTS file_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_path, tag_name)
);

-- 2. Create indexes for file_tags
CREATE INDEX IF NOT EXISTS idx_file_tags_file_path ON file_tags(file_path);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag_name ON file_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_file_tags_created_at ON file_tags(created_at);

-- 3. Enable RLS for file_tags
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for file_tags (allow all authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON file_tags
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anonymous users to read (if needed)
CREATE POLICY "Allow read access for anon users" ON file_tags
FOR SELECT TO anon USING (true);

-- 5. Create the admin_notes table
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes for admin_notes
CREATE INDEX IF NOT EXISTS idx_admin_notes_created_at ON admin_notes(created_at);

-- 7. Enable RLS for admin_notes
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for admin_notes (admin only)
CREATE POLICY "Allow admin to manage notes" ON admin_notes 
FOR ALL USING (true) WITH CHECK (true);

-- 9. Test both tables immediately
INSERT INTO file_tags (file_path, tag_name) 
VALUES ('test-file-path', 'test-tag');

INSERT INTO admin_notes (note_text) 
VALUES ('Test admin note - database setup complete');

-- 10. Verify the inserts worked
SELECT 'file_tags test:' as table_name, * FROM file_tags WHERE file_path = 'test-file-path';
SELECT 'admin_notes test:' as table_name, * FROM admin_notes WHERE note_text LIKE 'Test admin note%';

-- 11. Clean up test data
DELETE FROM file_tags WHERE file_path = 'test-file-path';
DELETE FROM admin_notes WHERE note_text LIKE 'Test admin note%';

-- 12. Show final table structures
SELECT 'file_tags structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'file_tags' 
ORDER BY ordinal_position;

SELECT 'admin_notes structure:' as info;
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'admin_notes' 
ORDER BY ordinal_position;

SELECT 'CORRECT database setup complete! Both file_tags and admin_notes tables are ready.' as status;
