# WebXRide Database & Storage Backup Guide

## Before Upgrading to WebXRide 2.0

Follow these steps to create a complete backup of your data.

---

## Method 1: Supabase Dashboard (Easiest)

### Database Backup:
1. Go to your Supabase project dashboard
2. Click **Database** in the left sidebar
3. Click **Backups** tab
4. Click **"Create Backup"** button
5. Wait for backup to complete
6. Download the backup file (if available in your plan)

### Note: 
- Free tier: Daily automated backups (7-day retention)
- Pro tier: Point-in-Time Recovery available
- You can restore from backups in the same menu

---

## Method 2: SQL Export (Recommended for WebXRide)

### Step 1: Export Data
1. Open Supabase SQL Editor
2. Run the script: `scripts/backup-database.sql`
3. Copy the entire output
4. Save to a file: `backup-webxride-[DATE].txt`

### Step 2: Export Schema (Optional)
Run this in SQL Editor and save output:

```sql
-- Export table structures
SELECT 
  'CREATE TABLE ' || table_name || ' (' || 
  string_agg(
    column_name || ' ' || data_type || 
    CASE WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END,
    ', '
  ) || ');'
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name;
```

---

## Method 3: Storage Files Backup

### Manual Download:
1. Go to **Storage** in Supabase Dashboard
2. Navigate to each bucket (`files`, `templates`)
3. Download important folders/files manually

### Using Supabase CLI (Advanced):

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Download all storage files
supabase storage download --all --bucket files
supabase storage download --all --bucket templates
```

---

## Quick Backup Checklist

Before upgrading, make sure you have:

- [ ] Database backup created (Supabase Dashboard or SQL export)
- [ ] Students table data saved
- [ ] Templates in storage backed up (if critical)
- [ ] User files backed up (if critical)
- [ ] Environment variables documented (.env file)
- [ ] Current Netlify deployment URL recorded

---

## Restore from Backup (If Needed)

### Database:
1. In Supabase Dashboard → Database → Backups
2. Click **"Restore"** next to your backup
3. Confirm restoration

### Storage:
1. Re-upload files through the dashboard
2. Or use Supabase CLI to bulk upload

---

## What the Upgrade Adds (Safe)

These new tables/features won't affect existing data:

- `classes` table - For organizing students by class
- `snippets` table - Code snippet library
- `about_page` table - Customizable about page
- `default_templates` table - Default template settings

**Your existing data (`students` table, storage files) will NOT be modified.**

---

## Testing the Upgrade Safely

1. **Create backup** (use this guide)
2. **Run migrations** (new tables only)
3. **Test on separate Netlify site** (deploy `webxride-2-0` branch)
4. **Verify existing data** still works
5. **Deploy to production** when confident

---

## Emergency Rollback

If something goes wrong:

1. In Supabase: Restore from backup
2. In Netlify: Redeploy previous version or rollback deployment
3. In Git: `git checkout [previous-commit]`

---

## Support

- Check browser console for errors
- Review Supabase logs
- Test with a small dataset first
- Keep this backup guide for reference

