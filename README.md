# WebXRide AgriQuest - Advanced WebXR Development Platform

A powerful, performance-optimized platform for creating and managing WebXR experiences, 3D content, and interactive web applications.

## 🚀 **Performance Highlights**

- **6x Faster File Loading** - Parallel category loading with smart pagination
- **Progressive Image Loading** - Thumbnails → Preview → Full-size optimization
- **Enhanced 3D Preview** - Advanced camera controls and model handling
- **Smart Caching** - Efficient file management and user experience

## 📖 **Quick Start**

For a **complete fresh installation**, see our comprehensive guide:

**[🚀 INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Complete setup from scratch

## 🏃‍♂️ **Quick Setup (Existing Users)**

```bash
# Clone and setup
git clone https://github.com/pachecod/webxride.git
cd webxride
npm install

# Environment setup
cp env.example .env
# Edit .env with your Supabase credentials

# Start development
npm run dev
```

## 🔧 **Key Features**

- **File Management** - Organized by type with smart categorization
- **3D Model Support** - GLTF, OBJ, Collada with enhanced preview
- **User Management** - Role-based access control
- **Template System** - Reusable project templates
- **Performance Optimized** - Fast loading for users with many files

## 📚 **Documentation**

- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Complete setup guide
- **[DEVELOPMENT_SETUP.md](DEVELOPMENT_SETUP.md)** - Development environment
- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Database configuration
- **[ENHANCED_3D_PREVIEW.md](ENHANCED_3D_PREVIEW.md)** - 3D features
- **[STORAGE_MIGRATION.md](STORAGE_MIGRATION.md)** - Storage setup

## 🚀 **Performance Improvements**

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

## 🌐 **Deployment**

- **Netlify**: Recommended with automatic deployments
- **Vercel**: Alternative deployment option
- **Custom**: Serve `dist` folder from any web server

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Installation Issues**: Check [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
- **Performance Questions**: Review [ENHANCED_3D_PREVIEW.md](ENHANCED_3D_PREVIEW.md)
- **Database Setup**: See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **GitHub Issues**: Open an issue for bugs or feature requests

---

**Built with ❤️ for the WebXR community** 