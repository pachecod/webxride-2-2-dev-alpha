# Simple Authentication System for WebXRide

## Overview

WebXRide now includes a simple username/password authentication system designed for educational environments. The admin sets passwords for each student, and students log in using their username and password.

## Key Features

- ✅ **Admin-Managed Passwords**: Admin sets and resets passwords for all students
- ✅ **No Email Required**: Students don't need email accounts  
- ✅ **Password Visibility**: Admin can view and share passwords with students
- ✅ **One-Click Password Generation**: Auto-generate memorable passwords
- ✅ **Copy to Clipboard**: Easy password sharing
- ✅ **Account Status**: Enable/disable student accounts
- ✅ **Simple Login**: Clean login interface for students

## Setup Instructions

### 1. Run Database Migration

First, add the password columns to the students table:

```bash
# Connect to your Supabase database and run:
psql -U postgres -d your_database -f scripts/setup-user-passwords.sql
```

Or execute in Supabase SQL Editor:

```sql
-- Add password columns
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password TEXT;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS password_set_at TIMESTAMPTZ;

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add username column if not exists
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS username TEXT;

-- Set username to lowercase name by default
UPDATE students 
SET username = LOWER(REPLACE(name, ' ', '-'))
WHERE username IS NULL;

-- Create index for faster login
CREATE INDEX IF NOT EXISTS idx_students_username ON students(username);
```

### 2. Set Student Passwords

1. Go to **Admin Tools** → **Manage Settings** → **Student Management**
2. For each student, click the **🔄 Refresh** button (green icon)
3. A random memorable password will be generated (e.g., "HappyLion42")
4. The password is displayed in a popup - share this with the student
5. Click the **👁️ Eye** icon to show/hide passwords
6. Click the **📋 Copy** icon to copy password to clipboard

### 3. Passwords are shown in the Student list

Each student row shows:
- **Name** and **Class**
- **🔑 Password status**: "No password set" or masked password (••••••••)
- **👁️ Show/Hide**: Toggle password visibility
- **📋 Copy**: Copy password to clipboard
- **🔄 Generate/Reset**: Create new random password

## How It Works

### For Admins

1. **Student signs up** (or admin creates account)
2. **Admin clicks refresh icon** next to student name
3. **Random password is generated** (e.g., "SunnyEagle78")
4. **Admin shares password** with student (via email, print, etc.)
5. **Student logs in** using their username + password

### For Students

1. **Visit WebXRide** URL
2. **Enter username** (usually lowercase version of their name)
3. **Enter password** (provided by teacher)
4. **Click Log In**
5. **Session persists** until they log out or clear browser data

## Password Generation

Passwords are auto-generated using a simple memorable format:

```
[Adjective][Noun][Number]
```

Examples:
- HappyLion42
- SunnyEagle78
- BrightTiger15
- LuckyWolf91
- SwiftBear33

This format is:
- **Easy to remember** for students
- **Easy to type** (no special characters)
- **Reasonably secure** for classroom use
- **Unique** for each generation

## Security Considerations

### ⚠️ Important Notes

1. **Plain Text Passwords**: Passwords are stored in plain text in the database
   - This is intentional for educational use
   - Admin needs to see and share passwords with students
   - NOT recommended for production systems with sensitive data

2. **Classroom Use Only**: This system is designed for:
   - Educational environments
   - Non-sensitive student projects
   - Teacher-supervised access

3. **Not for Production**: For production systems, use:
   - Hashed passwords (bcrypt, argon2)
   - Email-based authentication
   - OAuth providers (Google, Microsoft)
   - The experimental auth system in `AUTH_TESTING_GUIDE.md`

## Admin Controls

### View All Passwords

In Student Management, passwords are:
- **Masked by default** (••••••••)
- **Click eye icon** to reveal
- **Click again** to hide
- **All passwords** can be viewed at once

### Reset Password

1. Click the **🔄 Refresh** button next to any student
2. New password is generated automatically
3. Previous password is overwritten
4. Student must use the new password

### Disable Account

```sql
-- Disable a student account
UPDATE students 
SET is_active = false 
WHERE username = 'john-doe';

-- Re-enable account
UPDATE students 
SET is_active = true 
WHERE username = 'john-doe';
```

## Sharing Passwords with Students

### Method 1: Print Password Sheet

1. View all passwords in Student Management
2. Click eye icons to reveal all passwords
3. Take screenshot or print the page
4. Distribute to students physically

### Method 2: Copy Individual Passwords

1. Click copy icon next to password
2. Paste into email/message to student
3. Use secure channel (school email system)

### Method 3: Reset on First Day

1. Have students present on first day
2. Generate password while student is there
3. Student writes it down immediately
4. Student logs in to confirm it works

## Troubleshooting

### Student Can't Log In

1. **Check username format**:
   - Usually lowercase name with hyphens
   - John Doe → john-doe
   - Jane Smith → jane-smith

2. **Verify password**:
   - Check in Student Management
   - Click eye icon to reveal
   - Generate new password if needed

3. **Check account status**:
   ```sql
   SELECT username, is_active, password 
   FROM students 
   WHERE username = 'student-name';
   ```

### Password Not Set

If password shows "No password set":
1. Click the refresh icon (🔄)
2. New password will be generated
3. Share with student

### Login Errors

Check browser console for errors:
- Database connection issues
- Missing columns
- Permission problems

## Migration from Old System

If upgrading from password gates:

1. **Run database migration** (adds password columns)
2. **Generate passwords for all students**
3. **Share passwords** with students
4. **Remove old password gates**
5. **Students log in** with new system

## API Reference

### Functions Available

```typescript
// Set a specific password
await setUserPassword('john-doe', 'MyPassword123');

// Generate random password
const password = generateRandomPassword(); // Returns: "HappyLion42"

// Authenticate user
const { data, error } = await authenticateUser('john-doe', 'HappyLion42');

// Get user's password (admin only)
const { data, error } = await getUserPassword('john-doe');
```

## Future Enhancements

Possible improvements:
- ✅ Password expiration (force reset after X days)
- ✅ Password strength requirements
- ✅ Login attempt limits
- ✅ Password history (prevent reuse)
- ✅ Bulk password generation/export
- ✅ Email notifications
- ✅ Two-factor authentication

## Support

For issues or questions:
1. Check browser console for errors
2. Verify database columns exist
3. Check Supabase permissions
4. Review this guide

---

**Built for educational environments** 🎓

