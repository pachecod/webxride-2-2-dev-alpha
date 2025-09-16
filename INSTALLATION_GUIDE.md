# 🚀 WebXRide Complete Installation Guide

This guide will walk you through installing and running a **fresh instance** of WebXRide from scratch, including all the latest performance optimizations and features.

---

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Git** for cloning the repository
- **Supabase account** (free tier works)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

---

## 🏗️ Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/pachecod/webxride.git
cd webxride

# Install dependencies
npm install
```

---

## 🔐 Step 2: Environment Configuration

Create a `.env` file in the project root:

```bash
# Supabase Configuration (REQUIRED)
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Password Protection (REQUIRED)
VITE_ADMIN_PASSWORD=your_admin_password_here
VITE_STUDENT_PASSWORD=your_student_password_here

# Optional: Teacher Code
VITE_TEACHER_CODE=your_teacher_code_here
```

**Get Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to **Settings** → **API**
4. Copy **Project URL** and **anon public key**

---

## 🗄️ Step 3: Supabase Database Setup

### 3.1 Create Storage Bucket

1. In your Supabase project, go to **Storage**
2. Click **"New Bucket"**
3. Name: `files`
4. Set to **Public** (for file access)
5. Click **Create bucket**

### 3.2 Run Database Setup Scripts

**Order matters!** Run these scripts in your Supabase SQL Editor:

#### A. Basic Database Setup
```sql
-- Copy and paste the contents of: scripts/setup-dev-database.sql
-- This creates: students table, templates table, and basic structure
```

#### B. Storage Policies Setup
```sql
-- Copy and paste the contents of: scripts/setup-storage-policies.sql
-- This sets up proper file access policies for all folders
```

#### C. Seed Default Data (Optional)
```bash
# Set your environment variables first
export VITE_SUPABASE_URL=your_url
export VITE_SUPABASE_ANON_KEY=your_key

# Run the seed script
npm run seed-templates
```

### 3.3 Verify Setup

After running the scripts, you should see:
- ✅ Storage bucket `files` created
- ✅ Storage policies configured
- ✅ `students` table with default users
- ✅ `templates` table ready
- ✅ All RLS policies active

---

## 🚀 Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🧪 Step 5: Test Your Installation

### 5.1 Basic Functionality
1. **Open** http://localhost:5173
2. **Select a user** from the dropdown (admin, student1, etc.)
3. **Upload a test file** to verify storage works
4. **Check file preview** and 3D model support

### 5.2 Performance Features
- **Fast loading**: File lists should load in 2-3 seconds
- **Progressive images**: Thumbnails load first, then previews
- **Parallel loading**: Categories load simultaneously
- **Smart pagination**: Choose 5, 10, 20, 50, 100, or All files

### 5.3 Admin Features
1. **Login as admin** using your admin password
2. **Access admin tools** from the sidebar
3. **Upload common assets** for all users
4. **Manage students** and user access

---

## 📁 Expected Folder Structure

Your Supabase storage will automatically create these folders as users upload files:

```
files/
├── images/          # User image uploads
├── audio/           # User audio uploads
├── 3d/             # User 3D model uploads
├── other/           # User other file uploads
├── public_html/     # User HTML drafts
└── common-assets/   # Admin-managed shared assets
```

---

## 🔧 Troubleshooting

### Common Issues

#### ❌ "Cannot access storage"
- Verify bucket name is exactly `files`
- Check environment variables are correct
- Ensure storage policies are applied

#### ❌ "Upload failed"
- Check file size limits (default 50MB)
- Verify storage policies allow uploads
- Check browser console for specific errors

#### ❌ "Files not showing"
- Run the storage policies script
- Check RLS policies are active
- Verify folders exist in storage

#### ❌ "Slow loading"
- Ensure you're using the latest code
- Check network tab for failed requests
- Verify parallel loading is working

### Debug Commands

```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test database connection
npm run test-dev-setup

# Regenerate template indexes
npm run generate-all-indexes
```

---

## 🌐 Deployment

### Netlify (Recommended)
1. **Connect** your GitHub repository
2. **Set environment variables** in Netlify dashboard
3. **Deploy** from `main` branch
4. **Build command**: `npm run build`
5. **Publish directory**: `dist`

### Other Platforms
- **Vercel**: Similar to Netlify
- **GitHub Pages**: Requires build step
- **Custom server**: Serve `dist` folder

---

## 📚 Additional Resources

- **Development Setup**: `DEVELOPMENT_SETUP.md`
- **Supabase Details**: `SUPABASE_SETUP.md`
- **Storage Migration**: `STORAGE_MIGRATION.md`
- **Performance Features**: `ENHANCED_3D_PREVIEW.md`

---

## 🆘 Need Help?

1. **Check the troubleshooting section** above
2. **Review Supabase logs** in your project dashboard
3. **Check browser console** for JavaScript errors
4. **Open an issue** on GitHub with error details

---

## ✨ What You Get

After successful installation, you'll have:

- 🚀 **Lightning-fast file loading** (6x faster than before)
- 🖼️ **Smart image optimization** (thumbnails → previews → full-size)
- 🎮 **Enhanced 3D preview** with camera controls
- 👥 **User management system** with admin controls
- 📁 **Organized file structure** by type and user
- 🔒 **Secure access control** with password protection
- 📱 **Responsive design** that works on all devices

**Happy coding! 🎉** 