-- About Page Database Setup Script
-- Run this in your Supabase project's SQL Editor

-- 1. Create about_page table
CREATE TABLE IF NOT EXISTS about_page (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'About WebxRide',
  content TEXT NOT NULL,
  css_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by TEXT
);

-- 2. Insert default content
INSERT INTO about_page (title, content, css_content, updated_by) VALUES (
  'About WebxRide',
  '<h1>Welcome to WebxRide</h1>
<p>WebxRide is an innovative web development platform designed for educational environments. It provides students and teachers with powerful tools to create, edit, and share web content including HTML, CSS, JavaScript, and immersive 3D experiences using A-Frame and Babylon.js.</p>

<h2>Features</h2>
<ul>
  <li><strong>Multi-User Support:</strong> Each student can have their own workspace</li>
  <li><strong>Template Library:</strong> Pre-built templates for quick project starts</li>
  <li><strong>Real-time Preview:</strong> See your changes instantly as you code</li>
  <li><strong>3D Web Support:</strong> Create immersive VR/AR experiences</li>
  <li><strong>File Management:</strong> Organize HTML, CSS, and JavaScript files</li>
  <li><strong>Export Options:</strong> Download your projects as local sites</li>
</ul>

<h2>Getting Started</h2>
<p>To begin using WebxRide:</p>
<ol>
  <li>Select your username from the dropdown in the top right</li>
  <li>Click the "Templates and Files" slider on the left</li>
  <li>Choose a template to start with</li>
  <li>Edit your files using the built-in editor</li>
  <li>Preview your work in real-time</li>
  <li>Save your progress when ready</li>
</ol>

<h2>Support</h2>
<p>For questions or support, please contact your teacher or administrator.</p>',
  'body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2563eb;
  border-bottom: 3px solid #2563eb;
  padding-bottom: 10px;
  margin-bottom: 30px;
}

h2 {
  color: #374151;
  margin-top: 40px;
  margin-bottom: 20px;
}

p {
  margin-bottom: 20px;
  text-align: justify;
}

ul, ol {
  background: #f8fafc;
  padding: 20px 30px;
  border-radius: 8px;
  border-left: 4px solid #2563eb;
  margin: 20px 0;
}

li {
  margin-bottom: 10px;
}

strong {
  color: #059669;
  font-weight: 600;
}',
  'system'
) ON CONFLICT DO NOTHING;

-- 3. Enable RLS
ALTER TABLE about_page ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
-- Allow anyone to read the about page
CREATE POLICY "Anyone can read about page" ON about_page 
FOR SELECT USING (true);

-- Allow authenticated users to update the about page (admin functionality)
CREATE POLICY "Authenticated users can update about page" ON about_page 
FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert about page content
CREATE POLICY "Authenticated users can insert about page" ON about_page 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_about_page_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update timestamp
CREATE TRIGGER update_about_page_updated_at
  BEFORE UPDATE ON about_page
  FOR EACH ROW
  EXECUTE FUNCTION update_about_page_updated_at(); 