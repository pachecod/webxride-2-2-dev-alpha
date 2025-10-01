-- Default Templates Database Setup Script
-- Run this in your development Supabase project's SQL Editor

-- 1. Create default_templates table
CREATE TABLE IF NOT EXISTS default_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  set_by_user TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add RLS policies for default_templates table
ALTER TABLE default_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read default templates" ON default_templates;
DROP POLICY IF EXISTS "Anyone can insert default templates" ON default_templates;
DROP POLICY IF EXISTS "Anyone can update default templates" ON default_templates;
DROP POLICY IF EXISTS "Anyone can delete default templates" ON default_templates;

-- Allow anyone to read default templates (for loading default template)
CREATE POLICY "Anyone can read default templates" ON default_templates 
FOR SELECT USING (true);

-- Allow anyone to insert default templates (for admin setting default)
CREATE POLICY "Anyone can insert default templates" ON default_templates 
FOR INSERT WITH CHECK (true);

-- Allow anyone to update default templates (for admin changing default)
CREATE POLICY "Anyone can update default templates" ON default_templates 
FOR UPDATE USING (true);

-- Allow anyone to delete default templates (for admin removing default)
CREATE POLICY "Anyone can delete default templates" ON default_templates 
FOR DELETE USING (true);

-- 3. Create trigger for updated_at column
DROP TRIGGER IF EXISTS update_default_templates_updated_at ON default_templates;
CREATE TRIGGER update_default_templates_updated_at 
    BEFORE UPDATE ON default_templates 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 4. Insert a default template (optional - can be set via admin interface)
-- INSERT INTO default_templates (template_id, template_name, set_by_user) VALUES 
--   ('basic-template', 'Basic Template', 'admin')
-- ON CONFLICT DO NOTHING;

-- 5. Verify setup
SELECT 'Default templates table created' as status WHERE EXISTS (
  SELECT 1 FROM information_schema.tables WHERE table_name = 'default_templates'
);

SELECT 'RLS enabled' as status WHERE EXISTS (
  SELECT 1 FROM pg_tables WHERE tablename = 'default_templates' AND rowsecurity = true
);

SELECT 'Policies created' as status WHERE EXISTS (
  SELECT 1 FROM pg_policies WHERE tablename = 'default_templates'
); 