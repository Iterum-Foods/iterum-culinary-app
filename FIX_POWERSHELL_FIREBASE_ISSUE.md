# 🔧 Fix PowerShell Firebase CLI Issue

## ⚠️ **Problem**

PowerShell is interfering with Firebase CLI, causing this error:
```
Error: Invalid project id: Write-Host ""; Write-Host "=== FIREBASE PROJECT ALIAS SUGGESTIONS ===" ...
```

This happens because PowerShell output is being captured and treated as a project ID.

---

## ✅ **Solution: Use CMD Instead of PowerShell**

### **Option 1: Use the New Deployment Script** (Recommended)

I've created `deploy-pitch-cmd.bat` that uses pure CMD (not PowerShell):

1. **Open Command Prompt** (not PowerShell):
   - Press `Win + R`
   - Type `cmd` and press Enter

2. **Navigate to your project**:
   ```cmd
   cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
   ```

3. **Run the deployment script**:
   ```cmd
   deploy-pitch-cmd.bat
   ```

This script will:
- ✅ Check if Firebase CLI is installed
- ✅ Set the Firebase project
- ✅ Check authentication (prompt for login if needed)
- ✅ Deploy to `iterum-culinary-landing`

---

### **Option 2: Use CMD Directly**

1. **Open Command Prompt** (not PowerShell)

2. **Navigate to project**:
   ```cmd
   cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
   ```

3. **Login**:
   ```cmd
   firebase login --reauth
   ```

4. **Deploy**:
   ```cmd
   firebase deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
   ```

---

### **Option 3: Disable PowerShell Profile (If Needed)**

If the issue persists, the problem might be in your PowerShell profile:

1. **Check if profile exists**:
   ```powershell
   Test-Path $PROFILE
   ```

2. **View profile**:
   ```powershell
   notepad $PROFILE
   ```

3. **Look for Firebase-related scripts** and comment them out or remove them

4. **Common profile locations**:
   - `C:\Users\chefm\Documents\PowerShell\Microsoft.PowerShell_profile.ps1`
   - `C:\Users\chefm\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`

---

### **Option 4: Use Firebase Console Web Interface**

If CLI continues to have issues:

1. Go to: https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting/sites/iterum-culinary-landing
2. Use the web interface to deploy files
3. Or use the "Get started" wizard if it's a new site

---

## 🎯 **Quick Fix**

**Just run this in Command Prompt (not PowerShell):**

```cmd
cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
deploy-pitch-cmd.bat
```

---

## 📋 **Why This Happens**

- PowerShell profiles can intercept commands
- VS Code PowerShell extension might be interfering
- PowerShell output redirection can confuse Firebase CLI
- CMD is simpler and doesn't have these issues

---

## ✅ **After Deployment**

Your pitch page will be available at:
- https://iterum-culinary-landing.web.app/pitch
- https://iterum-culinary-landing.web.app/pitch.html

---

**Recommendation**: Always use **Command Prompt (CMD)** for Firebase CLI commands, not PowerShell.

