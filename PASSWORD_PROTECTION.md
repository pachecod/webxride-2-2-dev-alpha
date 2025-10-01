# Password Protection System

This application now has a dual password protection system to secure both student and admin access.

## 🔐 Password Protection Overview

### Two Separate Passwords:
1. **Student Password** (`VITE_STUDENT_PASSWORD`) - Protects the main application
2. **Admin Password** (`VITE_ADMIN_PASSWORD`) - Protects the admin-tools portal

### Access Flow:
- **Main Application** (`/`) → Requires Student Password
- **Admin Tools** (`/admin-tools`) → Requires Admin Password

## 🛡️ Security Features

### Student Password Gate
- **Location**: Main application (all routes except `/admin-tools`)
- **Purpose**: Prevents unauthorized access to the WebXR code editor
- **Storage**: Uses `localStorage` with key `studentUnlocked`
- **Persistence**: Password remains valid until browser cache is cleared

### Admin Password Gate
- **Location**: Admin tools portal (`/admin-tools`)
- **Purpose**: Protects administrative functions
- **Storage**: Uses `localStorage` with key `adminUnlocked`
- **Persistence**: Password remains valid until browser cache is cleared

## 🔧 Environment Variables

Add these to your `.env` file:

```bash
# Password Protection
VITE_ADMIN_PASSWORD=your_admin_password_here
VITE_STUDENT_PASSWORD=your_student_password_here

# Existing variables
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🚀 Deployment Configuration

### Netlify Environment Variables:
1. Go to your Netlify dashboard
2. Site settings → Environment variables
3. Add both password variables:
   - `VITE_ADMIN_PASSWORD` = Your admin password
   - `VITE_STUDENT_PASSWORD` = Your student password

### Development Setup:
1. Create `.env.development` with both passwords
2. Create `.env.production` with both passwords
3. Use `cp .env.development .env` for local development

## 📱 User Experience

### For Students:
1. Visit the main application URL
2. Enter the student password
3. Select their name from the dropdown
4. Start coding and creating WebXR projects

### For Admins:
1. Visit `/admin-tools` URL
2. Enter the admin password
3. Access administrative functions:
   - Student management
   - Class management
   - Template management
   - Full code editor with admin privileges

## 🔄 Password Management

### Changing Passwords:
1. Update the environment variable
2. Redeploy the application
3. Users will need to re-enter the password (localStorage is cleared)

### Password Reset:
- Clear browser localStorage to force re-authentication
- Or wait for the next deployment with new passwords

## ⚠️ Security Considerations

1. **Strong Passwords**: Use complex passwords for both student and admin access
2. **Separate Passwords**: Never use the same password for both roles
3. **Environment Variables**: Keep passwords secure and never commit them to git
4. **HTTPS**: Always use HTTPS in production for secure password transmission
5. **Regular Updates**: Consider changing passwords periodically

## 🧪 Testing

### Test Student Access:
1. Visit main application
2. Enter student password
3. Verify student functionality works
4. Verify admin user is not visible in dropdown

### Test Admin Access:
1. Visit `/admin-tools`
2. Enter admin password
3. Verify admin functionality works
4. Verify admin user is visible in dropdown

### Test Security:
1. Try accessing admin-tools without password
2. Try accessing main app without password
3. Verify both are properly protected 