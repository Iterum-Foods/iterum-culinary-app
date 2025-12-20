# ✅ Working Solution: Deploy to Firebase

## 🔍 **Root Cause Found!**

Firebase CLI is installed as a **PowerShell wrapper script**:
- Location: `C:\Users\chefm\AppData\Roaming\npm\firebase.ps1`
- This PowerShell script is intercepting commands and causing errors

---

## ✅ **Solution: Use Node.js Directly**

Bypass the PowerShell wrapper by calling the JavaScript file directly.

### **Step 1: Open Command Prompt (Not PowerShell)**

1. Press `Windows Key + R`
2. Type: `cmd`
3. Press `Enter`

**Verify you're in CMD:**
- Prompt should show: `C:\Users\...>` (NO `PS` prefix)
- If you see `PS`, you're still in PowerShell!

---

### **Step 2: Navigate to Project**

```cmd
cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
```

---

### **Step 3: Run Deployment Script**

```cmd
deploy-node-only.bat
```

This script:
- ✅ Uses Node.js directly (bypasses PowerShell wrapper)
- ✅ Calls the JavaScript file: `firebase.js`
- ✅ Skips project setting (uses `--project` flag)
- ✅ Handles authentication automatically

---

## 🔧 **Manual Command (If Script Fails)**

If the script doesn't work, run this directly in CMD:

```cmd
"C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
```

---

## 🌐 **Alternative: Firebase Console Web Interface**

If CLI still fails, use the web interface:

1. **Go to:**
   https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting/sites/iterum-culinary-landing

2. **Click "Get started"** or use the deployment options

3. **Follow the web-based wizard**

---

## 🎯 **Why This Works**

- **Bypasses PowerShell wrapper** - Calls JavaScript directly
- **Uses Node.js** - No PowerShell interception
- **Explicit project flag** - Skips project setting that causes errors
- **Pure CMD environment** - No PowerShell profiles interfering

---

## ✅ **After Deployment**

Your pitch page will be live at:
- **https://iterum-culinary-landing.web.app/pitch**
- **https://iterum-culinary-landing.web.app/pitch.html**

---

## 📋 **Quick Checklist**

- [ ] Open **Command Prompt** (not PowerShell)
- [ ] Verify prompt shows `C:\...>` (no `PS`)
- [ ] Navigate to project folder
- [ ] Run `deploy-node-only.bat`
- [ ] Follow authentication prompts if needed
- [ ] Verify deployment success

---

**The key is using Node.js directly to bypass the PowerShell wrapper!**

