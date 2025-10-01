# About Page Setup Guide

This guide explains how to set up and use the About page feature in WebxRide.

## Overview

The About page feature allows administrators to create and edit a custom About page that users can access by clicking the "About" link in the header. The content is stored in the Supabase database and can be edited through the admin panel.

## Setup Instructions

### 1. Database Setup

Run the SQL script to create the required database table:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `scripts/setup-about-page.sql`
4. Execute the script

This will create:
- An `about_page` table to store the content
- Default About page content
- Appropriate RLS (Row Level Security) policies
- Automatic timestamp updates

### 2. Features

#### For Users:
- Click the "About" link next to the WebxRide logo in the header
- The About page opens in a new tab
- View information about WebxRide and how to use it

#### For Administrators:
- Access the About page management through the admin panel
- Click "Manage Settings" → "About Page"
- View current content and last update information
- Edit the About page content with a rich HTML editor
- Preview changes before saving

### 3. Admin Panel Integration

The About page management is integrated into the existing admin panel:

1. Log in as admin
2. Click "Manage Settings" in the header
3. Click "About Page" in the admin panel navigation
4. Use the provided buttons to:
   - View the current About page
   - Edit the About page content

### 4. Content Management

The About page editor supports:
- HTML content editing
- Real-time preview
- Title and content management
- Automatic saving with user attribution
- Last updated timestamps

### 5. Default Content

The setup script includes default content that covers:
- Welcome message
- Feature overview
- Getting started guide
- Support information

### 6. Security

- Public read access to the About page content
- Admin-only write access for content updates
- RLS policies ensure proper access control
- Content is sanitized for safe display

## File Structure

```
src/
├── components/
│   ├── AboutPage.tsx           # About page display component
│   ├── AboutPageEditor.tsx     # About page editing component
│   └── AboutPageManagement.tsx # Admin panel management component
├── lib/
│   └── supabase.ts            # Database functions for About page
└── scripts/
    └── setup-about-page.sql   # Database setup script
```

## Usage Examples

### Viewing the About Page
Users can access the About page by clicking the "About" link in the header, which opens `/about` in a new tab.

### Editing the About Page
1. Log in as admin
2. Open the admin panel
3. Navigate to "About Page"
4. Click "Edit Page"
5. Make changes in the editor
6. Use the preview feature to see changes
7. Save the changes

### Customizing Content
The About page supports HTML content, so you can include:
- Headers and paragraphs
- Lists and tables
- Links and images
- Custom styling
- Instructions and guides

## Troubleshooting

### Common Issues

1. **About page not loading**: Check that the database setup script was run successfully
2. **Cannot edit content**: Ensure you're logged in as admin
3. **Changes not saving**: Check your internet connection and try again
4. **Preview not working**: Make sure the content is valid HTML

### Database Issues

If you encounter database-related issues:
1. Check the Supabase dashboard for any error messages
2. Verify the RLS policies are correctly set up
3. Ensure the `about_page` table exists and has the correct structure
4. Check that the default content was inserted properly

## Future Enhancements

Potential improvements for the About page feature:
- Rich text editor with formatting toolbar
- Image upload and management
- Version history and rollback
- Multiple language support
- Custom styling options
- Analytics and usage tracking 