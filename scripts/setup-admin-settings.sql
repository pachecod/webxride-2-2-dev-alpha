-- Create admin_settings table for global application settings
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ridey_enabled BOOLEAN DEFAULT false NOT NULL,
  aframe_inspector_enabled BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings if none exist
INSERT INTO admin_settings (ridey_enabled, aframe_inspector_enabled)
SELECT false, false
WHERE NOT EXISTS (SELECT 1 FROM admin_settings);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to admin_settings table
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read settings
CREATE POLICY "Allow authenticated users to read admin settings" ON admin_settings
FOR SELECT TO authenticated
USING (true);

-- Policy for anyone to update settings (since this database doesn't have admin roles)
CREATE POLICY "Allow anyone to update admin settings" ON admin_settings
FOR UPDATE TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for anyone to insert settings
CREATE POLICY "Allow anyone to insert admin settings" ON admin_settings
FOR INSERT TO authenticated
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON admin_settings TO authenticated;
GRANT ALL ON admin_settings TO anon;
