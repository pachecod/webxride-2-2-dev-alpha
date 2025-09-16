# Version Management Guide

## Current Status
- **Stable Release**: v1.0.0 (tagged and deployed)
- **Development Branch**: `develop` (for future features)
- **Main Branch**: `main` (keeps stable releases)

## Version History

### v1.0.0 (Current Stable Release)
**Released**: [Current Date]
**Features**:
- ✅ Anonymous student access with name selection
- ✅ Admin tools with password protection
- ✅ Student management (add/remove students)
- ✅ File upload and management per student
- ✅ Code editor with syntax highlighting
- ✅ Live preview with iframe injection
- ✅ Template system with save/load
- ✅ Responsive design with resizable panels
- ✅ Supabase integration for file storage
- ✅ User selection persistence
- ✅ Admin panel for student management

**Deployment**: Netlify (production)

## Workflow for Future Development

### For New Features:
1. **Start from develop branch**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/new-feature-name
   ```

3. **Develop and test** your feature

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "Add new feature: description"
   git push origin feature/new-feature-name
   ```

5. **Merge to develop** (via GitHub PR or locally):
   ```bash
   git checkout develop
   git merge feature/new-feature-name
   git push origin develop
   ```

### For Stable Releases:
1. **Test on develop branch** thoroughly

2. **Merge to main**:
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

3. **Create release tag**:
   ```bash
   git tag -a v1.1.0 -m "Release v1.1.0: new features"
   git push origin v1.1.0
   ```

4. **Deploy to production** (Netlify)

## Branch Strategy
- `main`: Production-ready code only
- `develop`: Integration branch for features
- `feature/*`: Individual feature development
- `hotfix/*`: Critical bug fixes for production

## Rollback Strategy
If you need to rollback to v1.0.0:
```bash
git checkout v1.0.0
git checkout -b rollback-v1.0.0
# Make any necessary fixes
git checkout main
git merge rollback-v1.0.0
git tag -a v1.0.1 -m "Rollback to stable v1.0.0"
```

## Notes
- Always test thoroughly on develop before merging to main
- Keep main branch stable and deployable
- Use semantic versioning (major.minor.patch)
- Document all releases in this file 