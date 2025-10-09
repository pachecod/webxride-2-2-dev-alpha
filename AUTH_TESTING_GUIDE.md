# WebXRide 2.2 Auth System - Testing Guide

## 🎯 Current Status: Auth is **OFF** by Default

The auth system is built but **disabled** so you can continue using WebXRide normally with the existing username dropdown system.

---

## 🧪 How to Test the New Auth System

### **Step 1: Enable Auth in Your .env File**

Add this line to your `.env` file:

```bash
VITE_AUTH_ENABLED=true
VITE_AUTH_PROVIDER=mock
```

### **Step 2: Restart Vite Server**

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### **Step 3: Visit http://localhost:5173**

You'll now see the sign-in page instead of the normal app.

---

## 🔑 Test Users (Mock Provider)

Click the quick-select buttons or type these credentials:

### **Admin User**
- Email: `admin@webxride.com`
- Password: anything (mock doesn't check)
- Features: Unlimited storage, unlimited files, admin privileges

### **Student User**
- Email: `student@webxride.com`
- Password: anything
- Features: 1GB storage, 500 files max

### **Free User**
- Email: `free@webxride.com`
- Password: anything
- Features: 100MB storage, 50 files max

### **Create New User**
- Click "Sign up"
- Enter any email/password
- Creates a free tier account

---

## 🔄 Switch Back to Normal App

To disable auth and use the old system:

### **Option 1: Update .env**
```bash
VITE_AUTH_ENABLED=false
```
Then restart server.

### **Option 2: Remove from .env**
Just delete or comment out the `VITE_AUTH_ENABLED` line.

---

## 🧰 Testing Features

### **What Works Now:**
- ✅ Sign in / Sign up
- ✅ Session persistence (localStorage)
- ✅ User metadata (subscription tier, quotas)
- ✅ Auth state management
- ✅ Provider abstraction (ready to swap)

### **What's NOT Connected Yet:**
- ❌ File uploads don't check quotas
- ❌ Files not linked to auth user ID
- ❌ Supabase user table not created
- ❌ Clerk provider not implemented
- ❌ Stripe integration not added

---

## 📊 Next Steps for Full Integration

To make auth actually control the app, we need to:

1. **Create users table in Supabase** (SQL migration)
2. **Update file operations** to use `user.id` instead of username
3. **Add quota checks** before file uploads
4. **Implement Clerk provider** (optional, for real auth)
5. **Add Stripe integration** (for subscriptions)

---

## 🐛 Debugging

### **Auth Not Loading?**
Check browser console for errors.

### **Still Seeing Old App?**
- Verify `.env` has `VITE_AUTH_ENABLED=true`
- Restart Vite server
- Hard refresh browser (Cmd+Shift+R)

### **Sign In Not Working?**
With mock provider, any password works. Just type something.

### **Want to Sign Out?**
Open browser console:
```javascript
localStorage.removeItem('mock_auth_user');
location.reload();
```

---

## 🎨 Provider System

The auth system is designed to be provider-agnostic:

```
Current: Mock Provider (no external service)
    ↓
Future: Swap to Clerk (one line change)
    ↓
Or: Use Supabase Auth (if we fix sessions)
    ↓
Or: Use Auth0, Firebase, etc.
```

Change provider in `src/lib/auth/config.ts` - one line!

---

## 💡 Why Mock Provider First?

- ✅ Test auth UI/UX without external services
- ✅ No API keys needed
- ✅ Fast development iteration
- ✅ Works offline
- ✅ Perfect for prototyping

When ready, swap to Clerk for real authentication with better session management.

---

**Ready to test?** Set `VITE_AUTH_ENABLED=true` in your `.env` file and restart! 🚀

