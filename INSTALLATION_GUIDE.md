# WebXRide Complete Installation Guide

This guide will walk you through installing and running a **fresh instance** of WebXRide from scratch, including all the latest performance optimizations and features.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Git** for cloning the repository
- **Supabase account** (free tier works)
- **Modern browser** (Chrome, Firefox, Safari, Edge)

---

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone https://github.com/pachecod/webxride.git
cd webxride

# Install dependencies
npm install
```

---

## Step 2: Environment Configuration

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

# Optional: AI Assistant (Ridey) - Only add if you want AI features
# VITE_OPENAI_API_KEY=your_openai_api_key_here
# VITE_OPENAI_MODEL=gpt-4o-mini
# VITE_OPENAI_TEMPERATURE=0.2
# VITE_OPENAI_MAX_TOKENS=1500
# VITE_OPENAI_TOP_P=1
# VITE_RIDEY_PERSONA="Style: concise, upbeat, coach-like. Focus on WebXR. Provide step-by-step fixes. Ask one clarifying question if uncertain."
```

**Get Supabase credentials:**
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Go to **Settings** → **API**
4. Copy **Project URL** and **anon public key**

---

## Step 3: Supabase Database Setup

### 3.1 Create Storage Bucket

1. In your Supabase project, go to **Storage**
2. Click **"New Bucket"**
3. Name: `files`
4. Set to **Public** (for file access)
5. Click **Create bucket**

### 3.2 Run Database Setup Scripts

**For a fresh installation**, use the comprehensive setup script:

#### Option 1: Complete Fresh Installation (Recommended)
```sql
-- Copy and paste the entire contents of: scripts/setup-fresh-installation.sql
-- This includes ALL tables, policies, and default data for a complete setup
```

#### Option 2: Development Setup
```sql
-- Copy and paste the entire contents of: scripts/setup-dev-database.sql
-- This includes all tables and policies with test data
```

#### Option 3: Manual Setup (Alternative)
If you prefer to run individual scripts, you can also use:

```sql
-- Basic setup
-- Copy and paste: scripts/setup-dev-database.sql

-- Additional features (if needed)
-- Copy and paste: scripts/setup-classes-database.sql
-- Copy and paste: scripts/setup-snippets.sql
-- Copy and paste: scripts/setup-about-page.sql
-- Copy and paste: scripts/setup-default-templates.sql
-- Copy and paste: scripts/setup-file-tags.sql
```

### What These Scripts Include:

✅ **Storage Setup** - File upload/download policies  
✅ **Students Table** - User management with passwords and admin roles  
✅ **Templates Table** - Template storage and management  
✅ **Snippets Table** - Code snippets with language support  
✅ **File Tags Table** - File tagging system for organization  
✅ **RLS Policies** - Row Level Security for all tables  
✅ **Indexes** - Performance optimizations  
✅ **Triggers** - Automatic timestamp updates  
✅ **Default Data** - Admin user and sample snippets  
✅ **Testing** - Verification that everything works

#### E. Seed Default Data (Optional)
```bash
# Set your environment variables first
export VITE_SUPABASE_URL=your_url
export VITE_SUPABASE_ANON_KEY=your_key

# Run the seed script
npm run seed-templates
```

### 3.3 Verify Setup

After running the setup script, you should see these tables:
- ✅ Storage bucket `files` created
- ✅ Storage policies configured
- ✅ `students` table with default users (including admin)
- ✅ `templates` table ready
- ✅ `snippets` table with default snippets
- ✅ `file_tags` table ready for tagging system
- ✅ All RLS policies active
- ✅ Indexes created for performance
- ✅ Triggers set up for automatic timestamps

The setup script will also run verification tests to ensure everything is working correctly.

---

## Step 4: Start Development Server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Step 4.5: Configure Optional Features (Optional)

### AI Assistant (Ridey) Setup

If you want to enable the AI-powered code assistant:

1. **Get OpenAI API Key**: Visit [OpenAI Platform](https://platform.openai.com/)
2. **Add to .env**: Uncomment and configure the AI settings:
   ```bash
   VITE_OPENAI_API_KEY=your_actual_api_key_here
   VITE_OPENAI_MODEL=gpt-4o-mini
   VITE_OPENAI_TEMPERATURE=0.2
   VITE_OPENAI_MAX_TOKENS=1500
   ```
3. **Enable in Admin**: Log in as admin and toggle "Enable Ridey AI Assistant"
4. **Restart Server**: `npm run dev`

**Note**: The AI Assistant is completely optional. WebXRide works perfectly without it.

### Enhanced Preview Controls

The new preview system includes:
- **Small Preview**: Focus on coding (80% editor, 20% preview)
- **Medium Preview**: Balanced view (50% editor, 50% preview)  
- **Large Preview**: Focus on testing (20% editor, 80% preview)

Controls are located at the bottom of the preview pane with intuitive labels.

---

## Step 5: Test Your Installation

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

## Troubleshooting

### Common Issues

#### "Cannot access storage"
- Verify bucket name is exactly `files`
- Check environment variables are correct
- Ensure storage policies are applied

#### "Upload failed"
- Check file size limits (default 50MB)
- Verify storage policies allow uploads
- Check browser console for specific errors

#### "Files not showing"
- Run the storage policies script
- Check RLS policies are active
- Verify folders exist in storage

#### "Slow loading"
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

## Deployment

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

## Additional Resources

- **Development Setup**: `DEVELOPMENT_SETUP.md`
- **Supabase Details**: `SUPABASE_SETUP.md`
- **Storage Migration**: `STORAGE_MIGRATION.md`
- **Performance Features**: `ENHANCED_3D_PREVIEW.md`
- **AI Assistant Setup**: `AI_ASSISTANT_SETUP.md`
- **Preview Controls**: `ENHANCED_PREVIEW_CONTROLS.md`

---

## Need Help?

1. **Check the troubleshooting section** above
2. **Review Supabase logs** in your project dashboard
3. **Check browser console** for JavaScript errors
4. **Open an issue** on GitHub with error details

---

## What You Get

After successful installation, you'll have:

- **Lightning-fast file loading** (6x faster than before)
- **Smart image optimization** (thumbnails → previews → full-size)
- **Enhanced 3D preview** with camera controls
- **User management system** with admin controls
- **Organized file structure** by type and user
- **Secure access control** with password protection
- **Responsive design** that works on all devices
- **AI-Powered Code Assistant** (optional) - "Ridey" for intelligent code suggestions
- **Enhanced Preview Controls** - Intuitive Small/Medium/Large preview sizing
- **Improved Resizing System** - Reliable preset-based layout controls

**Happy coding!** 