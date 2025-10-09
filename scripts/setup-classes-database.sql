-- Class Management Database Setup Script
-- Run this in your development Supabase project's SQL Editor

-- 1. Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Drop existing view if it exists (so we can alter the table)
DROP VIEW IF EXISTS students_with_classes CASCADE;

-- 3. Update students table to include class_id
ALTER TABLE students ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE CASCADE;

-- 4. Create RLS policies for classes table
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read classes" ON classes;
DROP POLICY IF EXISTS "Anyone can insert classes" ON classes;
DROP POLICY IF EXISTS "Anyone can update classes" ON classes;
DROP POLICY IF EXISTS "Anyone can delete classes" ON classes;

-- Allow anyone to read classes (for class selection)
CREATE POLICY "Anyone can read classes" ON classes 
FOR SELECT USING (true);

-- Allow anyone to insert classes (for admin adding classes)
CREATE POLICY "Anyone can insert classes" ON classes 
FOR INSERT WITH CHECK (true);

-- Allow anyone to update classes (for admin editing classes)
CREATE POLICY "Anyone can update classes" ON classes 
FOR UPDATE USING (true);

-- Allow anyone to delete classes (for admin removing classes)
CREATE POLICY "Anyone can delete classes" ON classes 
FOR DELETE USING (true);

-- 5. Update RLS policies for students table to include class context
DROP POLICY IF EXISTS "Anyone can read students" ON students;
DROP POLICY IF EXISTS "Anyone can insert students" ON students;
DROP POLICY IF EXISTS "Anyone can update students" ON students;
DROP POLICY IF EXISTS "Anyone can delete students" ON students;

-- Allow anyone to read students (for user selection within class)
CREATE POLICY "Anyone can read students" ON students 
FOR SELECT USING (true);

-- Allow anyone to insert students (for admin adding students to class)
CREATE POLICY "Anyone can insert students" ON students 
FOR INSERT WITH CHECK (true);

-- Allow anyone to update students (for admin editing students)
CREATE POLICY "Anyone can update students" ON students 
FOR UPDATE USING (true);

-- Allow anyone to delete students (for admin removing students)
CREATE POLICY "Anyone can delete students" ON students 
FOR DELETE USING (true);

-- 6. Create trigger for classes table
DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Insert some default classes for testing
INSERT INTO classes (name, description) VALUES 
  ('Web Development 101', 'Introduction to web development'),
  ('Advanced WebXR', 'Advanced WebXR development'),
  ('Computer Science Fundamentals', 'Basic programming concepts')
ON CONFLICT (name) DO NOTHING;

-- 8. Update existing students to be in the first class (if any exist)
UPDATE students 
SET class_id = (SELECT id FROM classes WHERE name = 'Web Development 101' LIMIT 1)
WHERE class_id IS NULL;

-- 9. Insert some default students for testing (if they don't exist)
INSERT INTO students (name, class_id) VALUES 
  ('admin', (SELECT id FROM classes WHERE name = 'Web Development 101' LIMIT 1)),
  ('student1', (SELECT id FROM classes WHERE name = 'Web Development 101' LIMIT 1)),
  ('student2', (SELECT id FROM classes WHERE name = 'Advanced WebXR' LIMIT 1)),
  ('student3', (SELECT id FROM classes WHERE name = 'Computer Science Fundamentals' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- 10. Create views for easier querying (recreate after table modification)
CREATE OR REPLACE VIEW students_with_classes AS
SELECT 
  s.id,
  s.name,
  s.class_id,
  c.name as class_name,
  c.description as class_description,
  s.created_at,
  s.updated_at
FROM students s
LEFT JOIN classes c ON s.class_id = c.id;

-- 11. Verify setup
SELECT 'Classes table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'classes'
);

SELECT 'Students table updated' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'students' AND column_name = 'class_id'
);

SELECT 'Default classes inserted' as status WHERE EXISTS (
  SELECT 1 FROM classes WHERE name = 'Web Development 101'
);

SELECT 'Students assigned to classes' as status WHERE EXISTS (
  SELECT 1 FROM students WHERE class_id IS NOT NULL
); 