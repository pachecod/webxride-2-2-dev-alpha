# Common Assets Feature

## Overview

The Common Assets feature allows administrators to upload and manage files that are available to all users in the WebxRide platform. This provides a centralized location for shared resources like images, audio files, 3D models, and other assets that can be used across multiple projects.

## Features

- **Tabbed Interface**: The file manager now has two tabs:
  - **My Files**: User-specific uploaded files (existing functionality)
  - **Common Assets**: Admin-managed shared assets (new functionality)

- **Admin-Only Upload**: Only administrators can upload files to Common Assets
- **Universal Access**: All users can view and use Common Assets
- **Organized Structure**: Files are automatically categorized by type
- **Preview Support**: Images get automatic preview and thumbnail generation

## File Structure

Common Assets are stored in the following structure in Supabase storage:

```
files/common-assets/
├── images/          # Image files (JPG, PNG, GIF, etc.)
├── audio/           # Audio files (MP3, WAV, etc.)
├── 3d/             # 3D model files (GLB, GLTF, OBJ, etc.)
└── other/          # Other file types
```

## Setup Instructions

### 1. Database Setup

The Common Assets feature uses the existing Supabase storage bucket. No additional database setup is required.

### 2. Storage Policies

Ensure your Supabase storage has the following policies for the `files` bucket:

```sql
-- Allow anyone to read common assets
CREATE POLICY "Anyone can read common assets" ON storage.objects 
FOR SELECT USING (bucket_id = 'files' AND (storage.foldername(name))[1] = 'common-assets');

-- Allow authenticated users to upload to common assets (admin check handled in app)
CREATE POLICY "Authenticated users can upload to common assets" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'files' AND (storage.foldername(name))[1] = 'common-assets');

-- Allow authenticated users to delete from common assets (admin check handled in app)
CREATE POLICY "Authenticated users can delete from common assets" ON storage.objects 
FOR DELETE USING (bucket_id = 'files' AND (storage.foldername(name))[1] = 'common-assets');
```

### 3. Application Setup

The Common Assets feature is automatically available once the code is deployed. No additional configuration is required.

## Usage

### For Administrators

1. **Access Common Assets**: Click on the "Common Assets" tab in the file manager
2. **Upload Files**: Click the "Upload to Common Assets" button
3. **Manage Files**: View, copy URLs, and delete files as needed
4. **Organize Content**: Files are automatically categorized by type

### For Users

1. **Access Common Assets**: Click on the "Common Assets" tab in the file manager
2. **View Files**: Browse through available shared assets
3. **Use Assets**: Copy file URLs to use in your projects
4. **No Upload Access**: Users cannot upload to Common Assets (upload button is hidden)

## Technical Implementation

### Components

- **FileList.tsx**: Modified to include tabbed interface
- **CommonFileUpload.tsx**: New component for admin uploads to common assets
- **supabase.ts**: Updated getFiles function to handle common-assets folder

### Key Features

- **Conditional Rendering**: Upload button only shows for admins
- **Separate State**: My Files and Common Assets have separate state management
- **Automatic Categorization**: Files are categorized by extension
- **Image Processing**: Automatic preview and thumbnail generation for images
- **Error Handling**: Comprehensive error handling for uploads and file operations

### File Upload Process

1. **File Selection**: Admin selects files through drag-and-drop or file picker
2. **Categorization**: Files are automatically categorized by extension
3. **Processing**: Images get preview and thumbnail generation
4. **Upload**: Files are uploaded to appropriate common-assets subfolder
5. **URL Generation**: Public URLs are generated for immediate use

## Security Considerations

- **Admin-Only Upload**: Upload functionality is restricted to administrators
- **Universal Read Access**: All users can view and use Common Assets
- **App-Level Security**: Admin checks are handled in the application layer
- **Storage Policies**: Supabase storage policies provide additional security

## Troubleshooting

### Common Issues

1. **Upload Button Not Visible**: Ensure you're logged in as an administrator
2. **Files Not Loading**: Check Supabase storage policies and connection
3. **Upload Failures**: Verify file size limits and supported file types
4. **Permission Errors**: Ensure storage policies are correctly configured

### Debug Steps

1. Check browser console for error messages
2. Verify Supabase connection and storage access
3. Test with smaller files first
4. Check network tab for failed requests

## File Type Support

### Supported Categories

- **Images**: JPG, PNG, GIF, SVG, WebP, etc.
- **Audio**: MP3, WAV, OGG, AAC, etc.
- **3D Models**: GLB, GLTF, OBJ, FBX, etc.
- **Other**: Any other file types

### File Size Limits

- Default Supabase storage limits apply
- Large files may take longer to upload
- Consider file optimization for better performance

## Best Practices

### For Administrators

1. **Organize Content**: Use descriptive filenames
2. **Optimize Files**: Compress images when possible
3. **Regular Maintenance**: Clean up unused files periodically
4. **Documentation**: Consider adding README files for complex assets

### For Users

1. **Check Before Upload**: Look for existing assets before uploading personal files
2. **Use URLs**: Copy file URLs to use in your projects
3. **Report Issues**: Contact administrators for missing or broken assets

## Future Enhancements

Potential improvements for the Common Assets feature:

- **Search Functionality**: Add search and filtering capabilities
- **Collections**: Organize assets into themed collections
- **Usage Tracking**: Track which assets are most frequently used
- **Bulk Operations**: Support for bulk upload and management
- **Version Control**: Track changes to shared assets
- **Access Control**: More granular permissions for different asset types 