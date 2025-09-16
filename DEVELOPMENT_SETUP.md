# Development Environment Setup

This guide helps you set up a separate development environment for the `develop` branch.

## 🗄️ Setting Up Development Database

### Step 1: Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click **"New Project"**
3. Name: `webxride-dev` (or `webxride-development`)
4. Set up a new database with a strong password
5. Wait for the project to be created

### Step 2: Get Development Environment Variables
1. In your new Supabase project, go to **Settings** → **API**
2. Copy the **Project URL** and **anon public** key
3. Create a `.env.development` file in your project root:

```bash
# Development Environment Variables
VITE_SUPABASE_URL=your_development_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_development_supabase_anon_key
VITE_ADMIN_PASSWORD=your_admin_password_here
VITE_STUDENT_PASSWORD=your_student_password_here
VITE_TEACHER_CODE=your_admin_password_here
```

### Step 3: Set Up Development Database Schema
1. Go to your development Supabase project
2. Navigate to **SQL Editor**
3. Run the setup scripts from `SUPABASE_SETUP.md`:
   - Storage bucket creation
   - Storage policies
   - Any other database setup

### Step 4: Seed Development Data (Optional)
```bash
# Set development environment variables
export VITE_SUPABASE_URL=your_dev_url
export VITE_SUPABASE_ANON_KEY=your_dev_key

# Run seed script
npm run seed-templates
```

## 🔄 Switching Between Environments

### For Development Work:
```bash
# Use development environment
cp .env.development .env
npm run dev
```

### For Production Work:
```bash
# Use production environment
cp .env.production .env
npm run dev
```

## 🌐 Deployment Configuration

### Development Site (Netlify)
- **Site name**: `webxride-dev`
- **Branch**: `develop`
- **Environment variables**: Use development Supabase credentials

### Production Site (Netlify)
- **Site name**: `webxride` (or your main site)
- **Branch**: `main`
- **Environment variables**: Use production Supabase credentials

## 📁 Environment Files Structure

```
webxride/
├── .env                    # Current environment (gitignored)
├── .env.development        # Development variables (gitignored)
├── .env.production         # Production variables (gitignored)
└── .env.example           # Template (committed)
```

## ⚠️ Important Notes

1. **Never commit** `.env` files to git
2. **Always use separate databases** for dev and production
3. **Test thoroughly** on development before merging to main
4. **Keep environment variables** in sync between local and deployed environments

## 🚀 Quick Start for Development

```bash
# 1. Switch to development branch
git checkout develop

# 2. Set up development environment
cp .env.development .env

# 3. Start development server
npm run dev

# 4. Work on features...

# 5. When ready to deploy development version
git add .
git commit -m "Add new feature"
git push origin develop
# Netlify will automatically deploy from develop branch
```

## 🔧 Troubleshooting

### Database Connection Issues
- Verify environment variables are correct
- Check Supabase project is active
- Ensure storage policies are set up

### Deployment Issues
- Verify Netlify environment variables match your `.env.development`
- Check that the correct branch is being deployed
- Ensure build commands are correct 