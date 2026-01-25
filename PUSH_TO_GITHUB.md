# 🚀 Push to GitHub - Step by Step

## ✅ **Current Status:**

- ✅ Git installed (v2.52.0)
- ✅ Repository initialized
- ✅ Remote added: `https://github.com/Iterum-Foods/iterum-culinary-app.git`
- ⚠️ Files not yet committed or pushed

---

## 📋 **Next Steps:**

### **Step 1: Add Files to Git**

Open PowerShell in your project folder and run:

```powershell
cd "c:\Users\Matt\Iterum Foods Programs"
& "C:\Program Files\Git\bin\git.exe" add .
```

**OR** if you've restarted PowerShell (git will be in PATH):

```powershell
cd "c:\Users\Matt\Iterum Foods Programs"
git add .
```

---

### **Step 2: Commit Changes**

```powershell
& "C:\Program Files\Git\bin\git.exe" commit -m "Update landing page design and fix issues"
```

**OR** (after restart):

```powershell
git commit -m "Update landing page design and fix issues"
```

---

### **Step 3: Check Branch**

```powershell
& "C:\Program Files\Git\bin\git.exe" branch
```

If you see `* master`, you'll push to `master`. If you see `* main`, push to `main`.

---

### **Step 4: Push to GitHub**

**If branch is `master`:**
```powershell
& "C:\Program Files\Git\bin\git.exe" push -u origin master
```

**If branch is `main`:**
```powershell
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

**If repository already has content:**
```powershell
# Pull first (merge existing content)
& "C:\Program Files\Git\bin\git.exe" pull origin main --allow-unrelated-histories

# Then push
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

---

## 🔐 **Authentication:**

When you push, GitHub will ask for credentials:

1. **Username**: Your GitHub username
2. **Password**: Use a **Personal Access Token** (not your password)

### **Get Personal Access Token:**

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name it: "Iterum App"
4. Select scopes: ✅ **repo** (full control)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)
7. Use this token as your password when pushing

---

## ⚠️ **Important Notes:**

### **Before Pushing:**

- ✅ `.gitignore` is configured (won't commit `node_modules/`, `.firebase/`, etc.)
- ✅ Sensitive files should be excluded
- ⚠️ Review what will be committed: `git status`

### **Files That Won't Be Committed** (from `.gitignore`):
- `node_modules/`
- `.firebase/`
- `.vercel/`
- `.env` files
- Backup files

---

## 🎯 **Quick Command Summary:**

**Full Path (Current Session):**
```powershell
cd "c:\Users\Matt\Iterum Foods Programs"
& "C:\Program Files\Git\bin\git.exe" add .
& "C:\Program Files\Git\bin\git.exe" commit -m "Update landing page and fixes"
& "C:\Program Files\Git\bin\git.exe" push -u origin main
```

**After Restarting PowerShell:**
```powershell
cd "c:\Users\Matt\Iterum Foods Programs"
git add .
git commit -m "Update landing page and fixes"
git push -u origin main
```

---

## ✅ **After Pushing:**

1. **Check GitHub**: https://github.com/Iterum-Foods/iterum-culinary-app
2. **Verify Files**: All your changes should be there
3. **Vercel Auto-Deploy**: If connected, Vercel will auto-deploy

---

**Ready to push? Run the commands above!** 🚀
