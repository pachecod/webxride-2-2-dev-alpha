# Supabase Storage Migration

This project has been migrated from database-stored templates to Supabase Storage for better scalability and performance.

## What Changed

- **Templates are now stored in Supabase Storage** instead of database tables
- **Files are organized in folders** (e.g., `templates/basic-html/index.html`)
- **Metadata is stored in JSON files** (e.g., `templates/basic-html/metadata.json`)
- **Better performance** for template loading and file management

## Setup Instructions

### 1. Create Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

You can find these values in your Supabase dashboard under **Settings > API**.

### 2. Create Storage Bucket

1. Go to your Supabase dashboard
2. Navigate to **Storage**
3. Create a new bucket called `templates`
4. Set the bucket to **private** (templates should not be publicly accessible)
5. Configure RLS (Row Level Security) policies

### 3. Storage Bucket Policies

Add these policies to your `templates` bucket:

**For authenticated read access:**
```sql
CREATE POLICY "Authenticated users can read templates" ON storage.objects 
FOR SELECT USING (bucket_id = 'templates' AND auth.role() = 'authenticated');
```

**For admin uploads (optional):**
```sql
CREATE POLICY "Admin users can upload templates" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'templates' AND auth.role() = 'authenticated');
```

### 4. Upload Sample Templates

Run the template upload script:

```bash
npm run upload-templates
```

This will create:
- `templates/basic-html/` - Basic HTML project with CSS and JS
- `templates/a-frame-basic/` - Simple A-Frame VR scene
- `templates/babylon-basic/` - Basic Babylon.js 3D scene

### 5. Test the Migration

1. Start your development server: `npm run dev`
2. Open the app in your browser
3. Click on the sidebar to expand it
4. You should see the templates loaded from Storage
5. Click on a template to load it

## Template Structure

Each template in Storage follows this structure:

```
templates/
  template-id/
    metadata.json          # Template metadata
    index.html            # Main HTML file
    style.css             # CSS file (optional)
    script.js             # JavaScript file (optional)
    ...                   # Other files
```

### Metadata Format

```json
{
  "name": "Template Name",
  "framework": "html|aframe|babylon",
  "description": "Template description"
}
```

## Benefits of Storage Migration

1. **Better Performance**: Files are served directly from CDN
2. **Scalability**: No database size limits for file content
3. **Cost Effective**: Storage is cheaper than database storage
4. **Version Control**: Easy to manage template versions
5. **CDN Caching**: Automatic caching for faster loading

## Troubleshooting

### Templates Not Loading

1. Check browser console for errors
2. Verify your `.env` file has correct values
3. Ensure the `templates` bucket exists in Supabase
4. Check RLS policies allow authenticated access

### Upload Script Fails

1. Verify environment variables are set
2. Check Supabase dashboard for bucket permissions
3. Ensure you're using the correct API keys

### Template Files Missing

1. Run the upload script again: `npm run upload-templates`
2. Check Supabase Storage dashboard for uploaded files
3. Verify file paths match the expected structure

## Adding New Templates

To add new templates:

1. Create a new folder in the `templates` bucket
2. Add a `metadata.json` file with template info
3. Upload your template files (HTML, CSS, JS, etc.)
4. The app will automatically detect and load the new template

## Migration from Database Templates

If you had templates in the database:

1. Export them from the database
2. Convert them to the Storage format
3. Upload them using the upload script
4. The app will now use Storage templates instead

The database `templates` table can be removed if no longer needed. 