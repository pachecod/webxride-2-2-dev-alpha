-- Student Management Database Setup
-- Run this in your Supabase SQL Editor

-- Create the students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on the name column for faster lookups
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update the updated_at column
CREATE TRIGGER update_students_updated_at 
  BEFORE UPDATE ON students 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Set up Row Level Security (RLS)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create policies for the students table
-- Allow all authenticated users to read students (for the dropdown)
CREATE POLICY "Allow authenticated users to read students" ON students
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow only admins to insert, update, and delete students
CREATE POLICY "Allow admins to manage students" ON students
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Insert some sample students (optional)
INSERT INTO students (name) VALUES 
  ('Alice Johnson'),
  ('Bob Smith'),
  ('Charlie Brown'),
  ('Diana Prince'),
  ('Eve Wilson')
ON CONFLICT (name) DO NOTHING;

-- Grant necessary permissions
GRANT SELECT ON students TO authenticated;
GRANT ALL ON students TO service_role; 