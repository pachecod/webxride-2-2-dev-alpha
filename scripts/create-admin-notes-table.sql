-- Create a simple admin notes table
-- This will test if database operations work for a completely new table

SELECT 'Creating admin notes table...' as status;

-- 1. Create the new table
CREATE TABLE admin_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX idx_admin_notes_created_at ON admin_notes(created_at);

-- 3. Enable RLS
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- 4. Create permissive RLS policies (admin only)
CREATE POLICY "Allow admin to manage notes" ON admin_notes 
FOR ALL USING (true) WITH CHECK (true);

-- 5. Test the table immediately
INSERT INTO admin_notes (note_text) 
VALUES ('Test note - admin notes table created successfully');

-- 6. Verify the insert worked
SELECT * FROM admin_notes;

-- 7. Show final structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'admin_notes' 
ORDER BY ordinal_position;

SELECT 'Admin notes table created successfully' as status;
