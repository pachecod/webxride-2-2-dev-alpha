# WebXRide Upgrade Guide

Complete guide for upgrading between WebXRide versions.

---

## 📦 Quick Version Finder

- **Upgrading from 1.x to 2.0?** → See [Upgrading to 2.0](#upgrading-to-20)
- **Upgrading from 2.0 to 2.1?** → See [Upgrading to 2.1](#upgrading-to-21)
- **Fresh Installation?** → See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)

---

# Upgrading to 2.1

**From Version:** 2.0  
**To Version:** 2.1  
**Time Required:** 5-10 minutes  
**Downtime:** None (backward compatible)

## What's New in 2.1 🎉

- **🏷️ File Tagging System** - Tag your files for easy organization
- **🔍 Smart Search** - Search by tags AND filenames across all categories
- **📚 Tag Browser** - Browse all tags with file counts
- **👥 User-Specific Tags** - Students see their own tags, admins see everyone's

## Upgrade Steps

### Step 1: Database Migration (Required)

1. Open **Supabase SQL Editor**
2. Run the file tags migration script:

```sql
-- Copy and paste contents from: scripts/setup-file-tags.sql
```

This creates the `file_tags` table with:
- File path tracking
- Tag name storage
- User ownership
- Fast search indexes

### Step 2: Deploy Code (Netlify/Vercel)

**For Netlify:**
1. Go to your site → **Site settings** → **Build & deploy**
2. Trigger a new deploy (uses latest code from your branch)
3. Or select branch: `main`, `development`, or `webxride-2-0`

**For Vercel:**
1. Go to your project → **Deployments**
2. Click **Redeploy** on latest deployment

### Step 3: Verify Installation

1. **Login** to your WebXRide site
2. **Upload a file** with tags (comma-separated)
3. **Click "Show Tags"** button to see tag browser
4. **Search** for a tag or filename
5. ✅ **Success!** Version 2.1 is live

## New User Features

### For Students:
- Add tags when uploading files
- Edit tags on existing files
- Search by tags or filename
- Browse your tag collection
- One-click tag filtering

### For Admins:
- All student features PLUS:
- See tags from all users
- Search across all students' files
- Browse organization-wide tags

## Rollback (If Needed)

If you encounter issues:

1. **Database:** The new `file_tags` table doesn't affect existing functionality
2. **Code:** Redeploy previous version from Netlify/Vercel
3. **Data:** No data is modified - only new features are added

## Troubleshooting

### Tags Not Saving?
- ✅ Confirm `file_tags` table exists in Supabase
- ✅ Check RLS policies were created
- ✅ Verify user is logged in

### Search Not Working?
- ✅ Clear browser cache
- ✅ Check browser console for errors
- ✅ Verify database indexes were created

### Migration Script Errors?
- ✅ Table might already exist (safe to ignore)
- ✅ Run: `DROP TABLE IF EXISTS file_tags CASCADE;` then retry

---

# Upgrading to 2.0

**From Version:** 1.x  
**To Version:** 2.0  
**Time Required:** 30-45 minutes  
**Downtime:** Minimal (if following best practices)

For complete 2.0 upgrade instructions, see: **[UPGRADE_TO_2.0.md](UPGRADE_TO_2.0.md)**

## What's New in 2.0

- ✅ Template rename functionality
- ✅ File rename with validation
- ✅ Blocked file extensions management
- ✅ Common Assets system (admin-managed shared files)
- ✅ Class-based student organization
- ✅ Code snippets library
- ✅ Customizable About page
- ✅ Fixed pagination bugs

## Quick Reference

### Database Migrations Required:
```sql
1. scripts/setup-classes-database.sql
2. scripts/setup-snippets.sql
3. scripts/setup-about-page.sql
4. scripts/setup-default-templates.sql
```

### Storage Migration Required:
```bash
node scripts/migrate-storage-structure.js
```

**See [UPGRADE_TO_2.0.md](UPGRADE_TO_2.0.md) for detailed instructions**

---

## Version History

### 2.1 (Current)
- File tagging system
- Smart search (tags + filenames)
- Tag browser

### 2.0
- Template/file renaming
- Common assets
- Class management
- Code snippets
- Custom About page

### 1.x
- Basic file management
- 3D preview
- Template system
- User management

---

## Support

- **Installation Issues:** [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- **Database Setup:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **General Questions:** Open an issue on GitHub

---

**Need Help?** Check the documentation or open an issue on GitHub! 🚀

