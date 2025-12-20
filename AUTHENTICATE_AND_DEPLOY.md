# 🔐 Authenticate and Deploy to Firebase

## ⚠️ **Authentication Required**

Your Firebase credentials have expired. You need to authenticate first.

---

## ✅ **Step 1: Authenticate**

### **Option A: Use Authentication Script** (Recommended)

1. **Open Command Prompt** (not PowerShell):
   - Press `Win + R`
   - Type: `cmd`
   - Press Enter

2. **Navigate to project:**
   ```cmd
   cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
   ```

3. **Run authentication script:**
   ```cmd
   firebase-login-direct.bat
   ```

4. **Follow the prompts:**
   - Browser will open automatically
   - Sign in with your Google account
   - Authorize Firebase CLI
   - Return to Command Prompt when done

---

### **Option B: Manual Authentication**

If the script doesn't work, run this directly in CMD:

```cmd
"C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" login --reauth
```

**Steps:**
1. Browser opens automatically
2. Sign in with Google account
3. Click "Allow" to authorize Firebase CLI
4. Return to Command Prompt

---

### **Option C: CI Token (For Headless/CI)**

If you need a token for CI/CD:

```cmd
"C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" login:ci
```

This generates a token you can use for automated deployments.

---

## ✅ **Step 2: Deploy**

After authentication succeeds:

1. **Run deployment script:**
   ```cmd
   deploy-node-only.bat
   ```

2. **Or deploy manually:**
   ```cmd
   "C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" deploy --only hosting:iterum-culinary-landing --project iterum-culinary-app2
   ```

---

## 🔍 **Troubleshooting**

### **Browser Doesn't Open**

If browser doesn't open automatically:

1. **Use --no-localhost flag:**
   ```cmd
   "C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" login --reauth --no-localhost
   ```

2. **Manual authentication:**
   - Go to: https://console.firebase.google.com/
   - Sign in
   - Go to project settings
   - Generate access token if needed

---

### **Still Getting Authentication Errors**

1. **Clear Firebase cache:**
   ```cmd
   rmdir /s /q "%USERPROFILE%\.config\configstore\firebase-tools.json"
   ```

2. **Try authentication again**

3. **Check you're using the correct Google account**

---

### **PowerShell Errors**

If you see PowerShell errors:
- ✅ Make sure you're in **Command Prompt** (not PowerShell)
- ✅ Use the Node.js direct method (bypasses PowerShell wrapper)
- ✅ Check prompt shows `C:\...>` (no `PS` prefix)

---

## 📋 **Quick Checklist**

- [ ] Open **Command Prompt** (not PowerShell)
- [ ] Navigate to project folder
- [ ] Run `firebase-login-direct.bat`
- [ ] Sign in with Google account in browser
- [ ] Authorize Firebase CLI
- [ ] Run `deploy-node-only.bat`
- [ ] Verify deployment success

---

## ✅ **After Successful Authentication**

You should see:
```
✅ Authentication successful!
```

Then you can deploy:
```
✅ Deployment successful!
```

Your pitch page will be live at:
- **https://iterum-culinary-landing.web.app/pitch**
- **https://iterum-culinary-landing.web.app/pitch.html**

---

**The key is authenticating first, then deploying!**

