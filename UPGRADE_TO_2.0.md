# Upgrading to WebXRide 2.0 - Complete Guide

This guide will help you safely upgrade your existing WebXRide installation to version 2.0 while preserving all your data.

---

## 📋 Pre-Upgrade Checklist

- [ ] Current deployment is working
- [ ] You have access to Supabase dashboard
- [ ] You have access to Netlify dashboard
- [ ] Environment variables documented
- [ ] Read this entire guide

**Time Estimate:** 30-45 minutes

---

## 🔄 What's Changed in 2.0

### New Features:
- ✅ Template rename functionality
- ✅ File rename with validation
- ✅ Blocked file extensions management
- ✅ Common Assets system (admin-managed shared files)
- ✅ Class-based student organization
- ✅ Code snippets library
- ✅ Customizable About page
- ✅ Fixed pagination bugs
- ✅ Improved file organization

### Storage Structure:
- **Old:** `files/username/file.jpg`
- **New:** `files/username/images/file.jpg` (categorized)
- **New:** `files/common-assets/` (shared assets)
- **New:** `templates/` bucket (templates moved from database)

---

## 🛡️ Step 1: BACKUP (Critical!)

### A. Backup Database

**Option 1: Supabase Dashboard**
1. Go to Supabase → **Database** → **Backups**
2. Click **"Create Backup"**
3. Wait for completion

**Option 2: Export Data**
1. Open Supabase → **SQL Editor**
2. Run `scripts/backup-database.sql`
3. Save the output to: `backup-[DATE].txt`

### B. Document Current State

Take screenshots of:
- Supabase Storage structure
- Your current student list
- Any important templates

**✅ Checkpoint:** Don't proceed until backup is complete!

---

## 🗄️ Step 2: Database Migrations

Run these SQL scripts in your Supabase **SQL Editor** in this order:

### Required Migrations:

```sql
-- 1. Classes table (organize students by class)
-- Copy/paste from: scripts/setup-classes-database.sql

-- 2. Snippets table (code snippet library)
-- Copy/paste from: scripts/setup-snippets.sql

-- 3. About page table (customizable about page)
-- Copy/paste from: scripts/setup-about-page.sql

-- 4. Default templates table (default template selection)
-- Copy/paste from: scripts/setup-default-templates.sql
```

### Verify Migrations:

Run this to check all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see: `about_page`, `classes`, `default_templates`, `snippets`, `students`

**✅ Checkpoint:** All 4 new tables created successfully

---

## 📦 Step 3: Storage Migration

This copies your files to the new categorized structure while keeping originals.

### A. Install Dependencies (if needed)

```bash
cd /Users/danielpacheco/Local\ Sites/Cursor/webxride-2_0
npm install
```

### B. Test Migration (Dry Run)

```bash
node scripts/migrate-storage-structure.js --dry-run
```

This shows what WOULD be migrated without actually doing it.

### C. Run Migration (Live)

When ready:

```bash
node scripts/migrate-storage-structure.js
```

This will:
- ✅ Scan all user folders
- ✅ Copy files to categorized folders (images/, audio/, 3d/, etc.)
- ✅ Keep originals in place
- ✅ Show detailed progress

**✅ Checkpoint:** Files copied to new structure, originals intact

---

## 🚀 Step 4: Deploy to Netlify

### Option A: Test on Separate Site (Recommended)

1. In Netlify Dashboard, click **"Add new site"**
2. Choose **"Import an existing project"**
3. Select GitHub → `webxride-agriqueset`
4. Choose branch: **`webxride-2-0`**
5. Configure:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **"Deploy site"**

### Option B: Update Existing Site

1. In Netlify → Your existing site → **Site settings**
2. Go to **Build & deploy** → **Continuous deployment**
3. Change **Production branch** to: `webxride-2-0`
4. Click **"Save"**
5. Go to **Deploys** → **Trigger deploy**

**✅ Checkpoint:** Site deployed and accessible

---

## ✅ Step 5: Verify Upgrade

### Test These Features:

1. **Login as admin**
   - Select "admin" from user dropdown

2. **Check existing files:**
   - Go to Files section
   - Your old files should appear in categorized folders
   - Upload a new file - should go to correct category

3. **Test new features:**
   - Admin Tools → Rename a template
   - Admin Tools → Blocked Extensions (add/remove)
   - Files → Rename a file
   - Files → Common Assets tab

4. **Verify students:**
   - Admin Tools → Classes
   - Check students are assigned to classes

### If Everything Works:
🎉 Success! Your upgrade is complete.

### If Something's Wrong:
⏪ Go to Step 6 (Rollback)

---

## ⏪ Step 6: Rollback (If Needed)

### Rollback Code:
1. In Netlify → **Site settings** → **Build & deploy**
2. Change branch back to your old branch
3. Or click **"Rollback to previous deploy"** in Deploys tab

### Rollback Database:
1. In Supabase → **Database** → **Backups**
2. Click **"Restore"** on your backup
3. Confirm restoration

### Your Data:
- ✅ Original files still in old locations
- ✅ Database can be restored from backup
- ✅ Zero data loss

---

## 🧹 Step 7: Cleanup (Optional)

**Only after confirming everything works for 1-2 weeks:**

You can optionally delete old files (but not required):

```bash
# Create a script to delete old structure files
# This is optional and can wait indefinitely
```

**Recommendation:** Keep old files for at least a month before cleanup.

---

## 🆘 Troubleshooting

### Files Not Showing:
- Run migration script again
- Check Supabase Storage policies
- Verify folder structure in Supabase dashboard

### Upload Errors:
- Check blocked extensions list
- Verify file size limits
- Check browser console for errors

### Template Issues:
- Verify `templates` bucket exists in Supabase
- Check storage policies allow read access
- Re-upload templates if needed

### Database Errors:
- Verify all 4 migration scripts ran successfully
- Check for policy conflicts
- Review Supabase logs

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12) for error messages
2. Review Supabase logs in dashboard
3. Check Netlify deploy logs
4. Refer to `BACKUP_GUIDE.md` for restore instructions

---

## 🎯 Summary

**What happens:**
1. ✅ New database tables added (doesn't affect existing data)
2. ✅ Files **copied** to new structure (originals kept)
3. ✅ New features available
4. ✅ Easy rollback if needed

**What doesn't happen:**
- ❌ No data is deleted
- ❌ No existing tables are modified
- ❌ No breaking changes to core functionality

**Your safety net:**
- Original files still in storage
- Database backup created
- Previous Netlify deployment available
- Can rollback at any time

---

**Good luck with your upgrade! 🚀**

