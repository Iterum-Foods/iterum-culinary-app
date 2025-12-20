# 🚀 Deploy Pitch Page - Use Command Prompt

## ⚠️ **Important: Use CMD, Not PowerShell**

The PowerShell extension in VS Code is interfering with Firebase CLI. You need to use **Command Prompt** outside of VS Code.

---

## ✅ **Step-by-Step Instructions**

### **Step 1: Open Command Prompt**

1. **Close VS Code** (or minimize it)
2. Press `Windows Key + R`
3. Type: `cmd`
4. Press `Enter`

This opens a **Command Prompt** window (not PowerShell).

---

### **Step 2: Navigate to Your Project**

In the Command Prompt window, type:

```cmd
cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
```

Press `Enter`.

---

### **Step 3: Run Deployment Script**

Type:

```cmd
deploy-pitch-cmd.bat
```

Press `Enter`.

---

### **Step 4: Follow Prompts**

The script will:
1. Check Firebase CLI
2. Set the project
3. **If authentication needed**: Open your browser to sign in
4. Deploy to `iterum-culinary-landing`

---

## 🔄 **Alternative: Manual Commands**

If the script doesn't work, run these commands manually in CMD:

```cmd
cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
firebase login --reauth
firebase deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
```

---

## 🌐 **Alternative: Use Firebase Console**

If CLI continues to have issues, use the web interface:

1. Go to: https://console.firebase.google.com/u/0/project/iterum-culinary-app2/hosting/sites/iterum-culinary-landing
2. Click "Get started" or use the deployment options
3. Follow the web-based deployment wizard

---

## ✅ **After Deployment**

Your pitch page will be live at:
- **https://iterum-culinary-landing.web.app/pitch**
- **https://iterum-culinary-landing.web.app/pitch.html**

---

## 🎯 **Why This Works**

- **Command Prompt (CMD)** doesn't have PowerShell profiles or extensions
- **No interference** from VS Code PowerShell extension
- **Direct execution** of Firebase CLI commands
- **Clean environment** without PowerShell hooks

---

## 📋 **Quick Summary**

1. ✅ Open **Command Prompt** (Win+R → `cmd`)
2. ✅ Navigate to project folder
3. ✅ Run `deploy-pitch-cmd.bat`
4. ✅ Follow authentication prompts
5. ✅ Done!

---

**The key is using CMD outside of VS Code, not PowerShell!**

