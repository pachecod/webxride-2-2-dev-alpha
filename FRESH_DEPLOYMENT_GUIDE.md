# Fresh Deployment Guide - WebXRide with Password Authentication

This guide walks you through deploying WebXRide with the new password authentication system on a completely new Supabase and Netlify setup.

## 📋 Prerequisites

- [ ] Supabase account
- [ ] Netlify account
- [ ] GitHub repository with WebXRide code
- [ ] Node.js installed locally (for testing)

---

## Part 1: Create New Supabase Project

### Step 1: Create Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `webxride-auth` (or your choice)
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine to start
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to initialize

### Step 2: Get Project Credentials

Once project is ready:

1. Click **"Settings"** (gear icon, bottom left)
2. Click **"API"** in settings menu
3. **Copy these values** (you'll need them later):
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGc...` (long key)

### Step 3: Run Database Setup Scripts (IN ORDER)

Go to **SQL Editor** (left sidebar) and run these scripts **one at a time**:

#### 3.1: Classes Table
```sql
-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read classes (permissive for admin interface)
CREATE POLICY "Anyone can read classes"
  ON classes FOR SELECT
  USING (true);

-- Allow anyone to manage classes (permissive for admin interface)
CREATE POLICY "Anyone can manage classes"
  ON classes FOR ALL
  USING (true)
  WITH CHECK (true);

-- Insert a default class
INSERT INTO classes (name, description) 
VALUES ('Default Class', 'Default class for all students')
ON CONFLICT (name) DO NOTHING;
```

#### 3.2: Students Table with Passwords
```sql
-- Create students table with authentication fields
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  email TEXT,
  class_id UUID REFERENCES classes(id),
  password TEXT,
  password_set_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read students (permissive for admin interface)
CREATE POLICY "Anyone can read students"
  ON students FOR SELECT
  USING (true);

-- Allow anyone to manage students (permissive for admin interface)
CREATE POLICY "Anyone can manage students"
  ON students FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create view for students with class info
CREATE OR REPLACE VIEW students_with_classes AS
SELECT 
  s.id,
  s.name,
  s.username,
  s.email,
  s.class_id,
  s.password,
  s.password_set_at,
  s.is_active,
  s.created_at,
  c.name as class_name,
  c.description as class_description
FROM students s
LEFT JOIN classes c ON s.class_id = c.id;

-- Grant access to the view
GRANT SELECT ON students_with_classes TO authenticated;
```

#### 3.3: Storage Buckets
```sql
-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public)
VALUES ('files', 'files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for templates (used for config files)
INSERT INTO storage.buckets (id, name, public)
VALUES ('templates', 'templates', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for files bucket
CREATE POLICY "Allow authenticated users to upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Allow authenticated users to read files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated users to update files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated users to delete files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'files');

-- Allow public read access to files
CREATE POLICY "Allow public to read files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'files');

-- Storage policies for templates bucket
CREATE POLICY "Allow authenticated users to read templates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'templates');

CREATE POLICY "Allow authenticated users to upload templates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'templates');

CREATE POLICY "Allow authenticated users to update templates"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'templates');

CREATE POLICY "Allow authenticated users to delete templates"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'templates');
```

#### 3.4: Templates Table
```sql
-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  framework TEXT NOT NULL,
  description TEXT,
  files JSONB NOT NULL,
  creator_id TEXT,
  creator_email TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read templates (permissive for admin interface)
CREATE POLICY "Anyone can read templates"
  ON templates FOR SELECT
  USING (true);

-- Allow anyone to manage templates (permissive for admin interface)
CREATE POLICY "Anyone can manage templates"
  ON templates FOR ALL
  USING (true)
  WITH CHECK (true);
```

#### 3.5: File Tags Table
```sql
-- Create file tags table
CREATE TABLE IF NOT EXISTS file_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  tag TEXT NOT NULL,
  user_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(file_path, tag, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_file_tags_path ON file_tags(file_path);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag);
CREATE INDEX IF NOT EXISTS idx_file_tags_user ON file_tags(user_id);

-- Enable RLS
ALTER TABLE file_tags ENABLE ROW LEVEL SECURITY;

-- Allow anyone to manage file tags (permissive for admin interface)
CREATE POLICY "Anyone can manage file tags"
  ON file_tags FOR ALL
  USING (true)
  WITH CHECK (true);
```

#### 3.6: Snippets Table
```sql
-- Create snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read snippets (permissive for admin interface)
CREATE POLICY "Anyone can read snippets"
  ON snippets FOR SELECT
  USING (true);

-- Allow anyone to manage snippets (permissive for admin interface)
CREATE POLICY "Anyone can manage snippets"
  ON snippets FOR ALL
  USING (true)
  WITH CHECK (true);
```

#### 3.7: About Page Table
```sql
-- Create about_page table for the About page feature
CREATE TABLE IF NOT EXISTS about_page (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'About WebXRide',
  content TEXT NOT NULL,
  css_content TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the about page
CREATE POLICY "Anyone can read about page" ON about_page 
FOR SELECT USING (true);

-- Allow anyone to manage about page (permissive for admin interface)
CREATE POLICY "Anyone can manage about page" ON about_page 
FOR ALL USING (true);

-- Insert default content
INSERT INTO about_page (title, content, css_content, updated_by) VALUES (
  'About WebXRide',
  '<h1>Welcome to WebXRide</h1>
<p>WebXRide is an innovative web development platform designed for educational environments.</p>

<h2>Features</h2>
<ul>
  <li><strong>Multi-User Support:</strong> Each student can have their own workspace</li>
  <li><strong>Template Library:</strong> Pre-built templates for quick project starts</li>
  <li><strong>Real-time Preview:</strong> See your changes instantly as you code</li>
  <li><strong>3D Web Support:</strong> Create immersive VR/AR experiences</li>
  <li><strong>File Management:</strong> Organize HTML, CSS, and JavaScript files</li>
  <li><strong>Password Authentication:</strong> Secure login for each student</li>
</ul>

<h2>Getting Started</h2>
<ol>
  <li>Log in with your username and password (provided by your teacher)</li>
  <li>Click the "Templates and Files" slider on the left</li>
  <li>Choose a template to start with</li>
  <li>Edit your files using the built-in editor</li>
  <li>Preview your work in real-time</li>
  <li>Save your progress when ready</li>
</ol>

<h2>Support</h2>
<p>For questions or support, please contact your teacher or administrator.</p>',
  'body { font-family: "Segoe UI", sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
h2 { color: #374151; margin-top: 30px; }
ul, ol { background: #f8fafc; padding: 20px 30px; border-radius: 8px; }
strong { color: #059669; font-weight: 600; }',
  'system'
) ON CONFLICT DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_about_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_about_page_updated_at
  BEFORE UPDATE ON about_page
  FOR EACH ROW
  EXECUTE FUNCTION update_about_page_updated_at();
```

#### 3.8: Add Admin User
```sql
-- Get the default class ID
DO $$
DECLARE
  default_class_id UUID;
BEGIN
  SELECT id INTO default_class_id FROM classes WHERE name = 'General' LIMIT 1;
  
  -- Insert admin user
  INSERT INTO students (name, username, email, class_id, password, is_active)
  VALUES ('admin', 'admin', 'admin@webxride.com', default_class_id, 'admin123', true)
  ON CONFLICT (username) DO NOTHING;
END $$;
```

### Step 4: Verify Database Setup

Run this query to check everything is created:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should show: about_page, classes, file_tags, snippets, students, templates

-- Check students with passwords
SELECT name, username, password, is_active FROM students;

-- Check storage buckets (should have 'files' and 'templates')
SELECT id, name, public FROM storage.buckets ORDER BY name;

-- Check about page
SELECT title, updated_by FROM about_page;

-- Check views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should show: students_with_classes
```

---

## Part 2: Configure Netlify Deployment

### Step 1: Push Code to GitHub

Make sure your WebXRide code is in a GitHub repository:

```bash
git add .
git commit -m "Add password authentication system"
git push origin auth-development
```

### Step 2: Create Netlify Site

1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub**
4. Authorize Netlify if needed
5. Select your **webxride repository**
6. Configure build settings:
   - **Branch to deploy**: `auth-development` (or your branch)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **"Show advanced"** → **"New variable"**

### Step 3: Set Environment Variables

Add these environment variables in Netlify:

| Variable Name | Value | Example |
|--------------|-------|---------|
| `VITE_SUPABASE_URL` | Your Supabase Project URL | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGc...` |
| `VITE_ADMIN_PASSWORD` | Admin password for admin tools | `YourSecretAdminPass123` |
| `VITE_STUDENT_PASSWORD` | *(Optional)* Keep password gates | `YourStudentPass123` |

**Important:** Use the Supabase credentials from Step 2 above!

### Step 4: Deploy

1. Click **"Deploy site"**
2. Wait for build to complete (2-3 minutes)
3. You'll get a URL like `https://random-name-123.netlify.app`

### Step 5: Configure Custom Domain (Optional)

1. Click **"Domain settings"**
2. Click **"Add custom domain"**
3. Follow instructions to point your domain to Netlify

---

## Part 3: Initial Setup

### Step 1: Access Admin Tools

1. Go to your Netlify URL: `https://your-site.netlify.app/admin-tools`
2. Enter the **Admin Password** you set in environment variables
3. You should see the admin interface

### Step 2: Create Student Accounts

1. Go to **Admin Panel** → **Manage Settings** → **Student Management**
2. Add students one by one:
   - Enter student name
   - Click **"Add Student"**
3. Or bulk create via SQL:

```sql
INSERT INTO students (name, username, class_id, is_active)
VALUES 
  ('John Doe', 'john-doe', (SELECT id FROM classes WHERE name = 'General'), true),
  ('Jane Smith', 'jane-smith', (SELECT id FROM classes WHERE name = 'General'), true),
  ('Bob Johnson', 'bob-johnson', (SELECT id FROM classes WHERE name = 'General'), true);
```

### Step 3: Set Student Passwords

For each student in Student Management:
1. Click the **🔄 green refresh button**
2. Note the generated password (e.g., "HappyLion42")
3. Click **📋 copy button** to copy password
4. Share password with student

### Step 4: Create Classes (Optional)

1. Go to **Admin Panel** → **Classes**
2. Click **"Add Class"**
3. Enter class name and description
4. Assign students to classes

### Step 5: Test Student Login

1. Open an incognito/private browser window
2. Go to your site URL (not /admin-tools)
3. You'll see the password gate OR login screen
4. Log in as a student with their username + password

---

## Part 4: Post-Deployment

### Enable Simple Login (Optional)

To replace password gates with the login screen:

1. Update `.env` variables in Netlify:
   ```
   VITE_USE_SIMPLE_AUTH=true
   ```
2. Redeploy site

### Monitor Usage

Check Supabase dashboard:
- **Database**: View students, check passwords
- **Storage**: See uploaded files
- **Logs**: Debug any issues

### Backup Database

Periodically backup your database:

1. Supabase Dashboard → **Database** → **Backups**
2. Or export via SQL:
   ```sql
   -- Export students
   SELECT * FROM students;
   
   -- Export classes
   SELECT * FROM classes;
   ```

---

## 🎯 Quick Checklist

### Supabase Setup
- [ ] Created new Supabase project
- [ ] Copied Supabase URL and anon key
- [ ] Ran all 8 SQL setup scripts in order:
  - [ ] 3.1: Classes table
  - [ ] 3.2: Students table (with password fields)
  - [ ] 3.3: Storage buckets (files + templates)
  - [ ] 3.4: Templates table
  - [ ] 3.5: File tags table
  - [ ] 3.6: Snippets table
  - [ ] 3.7: About page table
  - [ ] 3.8: Admin user
- [ ] Verified all tables exist (6 tables + 1 view)
- [ ] Verified both storage buckets exist

### Netlify Deployment
- [ ] Pushed code to GitHub
- [ ] Created Netlify site
- [ ] Set all environment variables in Netlify
- [ ] Deployed site successfully
- [ ] Site is accessible

### Post-Deployment Testing
- [ ] Accessed admin tools with admin password
- [ ] Added student accounts
- [ ] Set student passwords (generate with 🔄 button)
- [ ] Tested student login
- [ ] About page works
- [ ] File upload works
- [ ] Templates load correctly

---

## 🐛 Troubleshooting

### Students Can't Log In
- Check password was set (not "No password set")
- Verify username is correct (lowercase with hyphens)
- Check `is_active = true` in database

### Admin Tools Won't Load
- Verify `VITE_ADMIN_PASSWORD` in Netlify environment variables
- Check browser console for errors
- Verify Supabase credentials are correct

### Build Fails on Netlify
- Check build logs for errors
- Verify `npm run build` works locally
- Check all dependencies are in package.json

### Database Errors
- Verify all SQL scripts ran successfully
- Check RLS policies are enabled
- Test queries in Supabase SQL editor

---

## 📚 Next Steps

After deployment:
1. Read **SIMPLE_AUTH_GUIDE.md** for password management
2. Review **USER_GUIDE_TAGGING.md** for file organization
3. Check **AI_ASSISTANT_SETUP.md** for optional AI features

---

**You're ready to deploy!** 🚀

