-- User Passwords System for WebXRide
-- Simple username/password authentication managed by admin

-- Add password column to students table if it doesn't exist
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Add password_set_at column to track when password was last changed
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

-- Add is_active column to enable/disable user accounts
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create index for faster login lookups
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);

-- Add comment to password column
COMMENT ON COLUMN students.password IS 'Plain text password for educational use. Admin can view and share with students.';

-- Optional: Create a view for admin to see all users with their passwords
CREATE OR REPLACE VIEW admin_user_passwords AS
SELECT 
  id,
  username,
  email,
  password,
  is_active,
  password_set_at,
  created_at
FROM students
WHERE username != 'admin'
ORDER BY username;

-- Grant access to authenticated users
GRANT SELECT ON admin_user_passwords TO authenticated;

COMMENT ON VIEW admin_user_passwords IS 'Admin view to manage student passwords. Shows plain text passwords for easy sharing with students.';

