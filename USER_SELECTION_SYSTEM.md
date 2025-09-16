# User Selection System

## Overview

The WebXR Code Editor now supports a simplified user experience for students that eliminates the need for authentication. Instead of signing in, students can simply select their name from a predefined list and immediately access their personal workspace.

## How It Works

### For Students
1. **Select Your Name**: Click the user selector dropdown in the header and choose your name from the list
2. **Start Coding**: Immediately begin working with templates and creating projects
3. **Save Your Work**: Click "Save HTML to Cloud" to save your project with a custom name
4. **Load Previous Work**: Your saved projects appear in the sidebar under "[Your Name]'s Saved Work"

### For Admins
1. **Authentication Required**: Admins still need to sign in to access template management features
2. **Template Management**: Create, edit, and delete templates that students can use
3. **User Management**: Edit the `STUDENT_NAMES` array in `src/components/UserSelector.tsx` to add/remove students

## File Structure

Student work is stored in Supabase Storage using the following structure:
```
user-html/
├── alice-johnson-1234567890/
│   ├── metadata.json
│   ├── index.html
│   ├── style.css
│   └── script.js
├── bob-smith-1234567891/
│   ├── metadata.json
│   └── index.html
└── ...
```

## Configuration

### Adding/Removing Students

To modify the list of available students, edit the `STUDENT_NAMES` array in `src/components/UserSelector.tsx`:

```typescript
const STUDENT_NAMES = [
  'Alice Johnson',
  'Bob Smith',
  'Charlie Brown',
  // Add or remove names here
];
```

### Admin Access

Admins can access template management by:
1. Signing in with admin credentials
2. Navigating to `/admin-tools` for full admin features
3. Using the "Save as Template" button to create new templates

## Benefits

- **No Authentication Barriers**: Students can start coding immediately
- **Personal Workspaces**: Each student has their own isolated workspace
- **Simple Management**: Easy to add/remove students without database changes
- **Template Sharing**: Admins can create templates for all students to use
- **Persistent Storage**: Student work is automatically saved and can be loaded later

## Technical Details

- Uses Supabase Storage for file persistence
- Folder names are generated as `{name-lowercase}-{timestamp}`
- Metadata files track project information and file structure
- No database tables required for student data
- Admin features still use authentication for security

## Migration from Auth System

The new system is backward compatible:
- Existing authenticated users can still sign in for admin features
- Student data is now stored by name instead of user ID
- Templates continue to work as before
- No data migration required 