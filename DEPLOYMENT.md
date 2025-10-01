# WebXRide Deployment Guide

## 🚀 Deployment Options

### Safety-First Deployment Strategy

WebXRide uses a **safety-first** deployment approach that defaults to development and requires explicit confirmation for production deployments.

## 📋 Available Commands

### Default Deployment (Development)
```bash
npm run deploy
```
- **Target**: Development (webxride-dev.netlify.app)
- **Behavior**: Always deploys to development by default
- **Safety**: ✅ Safe - no confirmation needed

### Development Deployment
```bash
npm run deploy:dev
```
- **Target**: Development (webxride-dev.netlify.app)
- **Behavior**: Explicitly deploys to development
- **Safety**: ✅ Safe - no confirmation needed

### Production Deployment
```bash
npm run deploy:prod
```
- **Target**: Production (webxride.netlify.app)
- **Behavior**: Prompts for confirmation before deploying to production
- **Safety**: ⚠️ Requires explicit confirmation

## 🔒 Safety Features

1. **Default to Development**: All deployments default to development unless explicitly specified
2. **Production Confirmation**: Production deployments require explicit "yes" confirmation
3. **Fallback Option**: If production is cancelled, offers to deploy to development instead
4. **Clear Warnings**: Production deployments show clear warnings about affecting live site

## 🎯 Deployment Flow

### For Development:
```bash
npm run deploy
# or
npm run deploy:dev
```
✅ **Result**: Deploys to webxride-dev.netlify.app

### For Production:
```bash
npm run deploy:prod
```
⚠️ **Prompts**: "Are you sure you want this to go to the live production server? (yes/no):"

- **If "yes"**: Deploys to webxride.netlify.app
- **If "no"**: Offers to deploy to development instead

## 🌐 Site URLs

- **Development**: https://webxride-dev.netlify.app
- **Production**: https://webxride.netlify.app

## 📝 Environment Variables

Make sure to set the following environment variables in your Netlify dashboard:

### Development Site (webxride-dev)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PASSWORD`
- `VITE_STUDENT_PASSWORD`

### Production Site (webxride)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_PASSWORD`
- `VITE_STUDENT_PASSWORD`

## 🔧 Manual Deployment

If you need to deploy manually:

### Development
```bash
npm run build
npx netlify deploy --prod --dir=dist --site=webxride-dev
```

### Production
```bash
npm run build
npx netlify deploy --prod --dir=dist --site=webxride
```

## ⚠️ Important Notes

1. **Always test on development first** before deploying to production
2. **Production affects live users** - use with caution
3. **Development is safe** - feel free to deploy frequently for testing
4. **Environment variables** must be set in both Netlify sites

## 🚨 Emergency Rollback

If you need to rollback production:

1. Go to your Netlify dashboard
2. Navigate to the production site (webxride)
3. Go to Deploys tab
4. Find the previous working deployment
5. Click "Publish deploy" to rollback

## 📊 Monitoring

- **Development**: Monitor webxride-dev.netlify.app for testing
- **Production**: Monitor webxride.netlify.app for live issues
- **Logs**: Check Netlify function logs for any errors 