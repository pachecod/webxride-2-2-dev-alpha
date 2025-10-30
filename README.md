# WebXRide - Advanced WebXR Development Platform

**Version 2.2** - A powerful, performance-optimized platform for creating and managing WebXR experiences, 3D content, and interactive web applications.

## Performance Highlights

- **6x Faster File Loading** - Parallel category loading with smart pagination
- **Progressive Image Loading** - Thumbnails → Preview → Full-size optimization
- **Enhanced 3D Preview** - Advanced camera controls and model handling
- **Smart Caching** - Efficient file management and user experience

## What's New in 2.2 🎉

- **🔐 Admin Password Report System** - Comprehensive student password management with modal interface
- **📊 Enhanced Password Generation** - Stronger, more secure passwords with expanded vocabulary
- **📥 Download & Export** - Export password reports as TXT or CSV files for easy distribution
- **🔄 Reliable Refresh System** - Fixed Tools and Templates pane refresh issues
- **🎯 Improved Admin Interface** - Better default tab selection and consistent behavior
- **📱 Modal UX** - Professional full-screen interfaces with keyboard shortcuts

## What's New in 2.1 🎉

- **🏷️ File Tagging System** - Tag your files for easy organization and discovery
- **🔍 Smart Search** - Search by tags AND filenames across all categories
- **📚 Tag Browser** - Browse all your tags with file counts and one-click filtering
- **👥 User-Specific Tags** - Students see their own tags, admins see everyone's
- **💾 Database-Powered** - Fast, reliable tag storage and search

## Quick Start

For a **complete fresh installation**, see our comprehensive guide:

**[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Complete setup from scratch

## Quick Setup (Existing Users)

```bash
# Clone and setup
git clone https://github.com/pachecod/webxride.git
cd webxride
npm install

# Environment setup
cp env.example .env
# Edit .env with your Supabase credentials

# Database setup (run in Supabase SQL Editor)
# Use scripts/setup-dev-database.sql for development
# Use scripts/setup-fresh-installation.sql for production

# Start development
npm run dev
```

## Public Playground (Feature-flagged)

- Enable anonymous, local-only editing of templates via a public route.
- No upload/save/submit; only local edits and export as ZIP.

Enable:

```bash
# .env
VITE_ENABLE_PUBLIC_PLAYGROUND=true
```

Usage:

- Visit `/play/{templateId}` which loads from `public/templates/{templateId}/index.html` by default.
- Edits persist to `localStorage` only and can be exported via "Export Local Site".

Rollback:

- Set `VITE_ENABLE_PUBLIC_PLAYGROUND=false` (or remove it) and rebuild. No other changes required.


## Key Features

- **File Management** - Organized by type with smart categorization
- **Admin Password Management** ⭐NEW - Comprehensive student password reports with export functionality
- **File Tagging** - Tag files, search across tags and names, browse tag collections
- **3D Model Support** - GLTF, OBJ, Collada with enhanced preview
- **User Management** - Role-based access control with enhanced admin tools
- **Template System** - Reusable project templates with rename capability
- **Performance Optimized** - Fast loading for users with many files
- **AI-Powered Code Assistant** - "Ridey" provides intelligent code suggestions (optional)
- **Modal Interfaces** ⭐NEW - Professional full-screen modals with keyboard shortcuts
- **Enhanced Preview Controls** - Intuitive Small/Medium/Large preview sizing
- **File Renaming** - Rename uploaded files with validation
- **Blocked Extensions** - Admin control over allowed file types

## Documentation

### Setup & Installation
- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Complete setup guide (includes 2.2 features)
- **[UPGRADE_GUIDE.md](UPGRADE_GUIDE.md)** - Upgrade from 2.0 to 2.1
- **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** - Development environment
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Database configuration

### User Guides
- **[PASSWORD_REPORT_GUIDE.md](PASSWORD_REPORT_GUIDE.md)** ⭐NEW - Complete guide to admin password management
- **[USER_GUIDE_TAGGING.md](USER_GUIDE_TAGGING.md)** - Complete guide to file tagging and search
- **[ENHANCED_3D_PREVIEW.md](ENHANCED_3D_PREVIEW.md)** - 3D features
- **[ENHANCED_PREVIEW_CONTROLS.md](ENHANCED_PREVIEW_CONTROLS.md)** - Preview and resizing system

### Advanced
- **[STORAGE_MIGRATION.md](STORAGE_MIGRATION.md)** - Storage setup
- **[AI_ASSISTANT_SETUP.md](AI_ASSISTANT_SETUP.md)** - AI Assistant (Ridey) setup guide
- **[CHANGELOG.md](CHANGELOG.md)** - Complete changelog of all features and updates

## Performance Improvements

### Before vs After
- **File Loading**: 12+ seconds → 2-3 seconds (6x faster)
- **Image Loading**: Full-size everywhere → Progressive optimization
- **Category Loading**: Sequential → Parallel processing
- **User Experience**: Slow and frustrating → Fast and responsive

### Technical Optimizations
- Parallel database queries using `Promise.all()`
- Progressive image loading (thumb → preview → full)
- Smart pagination with 100-file caps
- Optimized storage policies and folder structure

## Deployment

- **Netlify**: Recommended with automatic deployments
- **Vercel**: Alternative deployment option
- **Custom**: Serve `dist` folder from any web server

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

**What that means:**
- You can use, copy, modify, and distribute this code — even commercially  
- You can include it in proprietary software  
- You can create derivative works  
- You must preserve the copyright notice: Copyright (c) 2025 Daniel Román Pacheco  
- You must include the MIT license text with any copy you share  
- No warranty is provided  

**In short:** you have maximum freedom to use this code however you want, just give credit.

See the [LICENSE](LICENSE) file for the complete legal terms.

## Support

- **Installation Issues**: Check [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- **Performance Questions**: Review [ENHANCED_3D_PREVIEW.md](ENHANCED_3D_PREVIEW.md)
- **Database Setup**: See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **GitHub Issues**: Open an issue for bugs or feature requests

---

**Built for the WebXR community** # Force Netlify rebuild - Thu Oct 16 17:52:50 EDT 2025
