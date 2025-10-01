
-- SQL for Supabase snippets table
CREATE TABLE IF NOT EXISTS snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Preload with initial snippets
INSERT INTO snippets (title, code) VALUES
  ('Paragraph', '<p>A paragrah.</p>'),
  ('Headline', '<h1>A Headline</h1>'),
  ('Subheadline', '<h2>A Subheadline</h2>'),
  ('Image', '<img src="" width="300"/> <!-- An image. Put your image URL inside ""-->')
ON CONFLICT DO NOTHING;

