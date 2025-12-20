# 🔐 Setup Firebase Token for GitHub Actions

## ⚠️ **Security Warning**

**The token you shared has been exposed!** You should generate a **NEW** token and revoke the old one.

---

## ✅ **Step 1: Generate New Firebase Token**

### **In Command Prompt:**

1. **Open Command Prompt** (not PowerShell):
   - Press `Win + R`
   - Type: `cmd`
   - Press Enter

2. **Navigate to project:**
   ```cmd
   cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
   ```

3. **Generate new CI token:**
   ```cmd
   "C:\Program Files\nodejs\node.exe" "C:\Users\chefm\AppData\Roaming\npm\node_modules\firebase-tools\lib\bin\firebase.js" login:ci
   ```

4. **Follow prompts:**
   - Browser opens automatically
   - Sign in with your Google account
   - Authorize Firebase CLI
   - **Copy the token** that appears (starts with `1//`)

---

## ✅ **Step 2: Add Token to GitHub Secrets**

1. **Go to your GitHub repository**

2. **Navigate to Secrets:**
   - Click **"Settings"** tab
   - Click **"Secrets and variables"** → **"Actions"**

3. **Add new secret:**
   - Click **"New repository secret"**
   - **Name**: `FIREBASE_TOKEN`
   - **Value**: Paste the NEW token you just generated
   - Click **"Add secret"**

---

## ✅ **Step 3: Revoke Old Token (Important!)**

Since the old token was exposed, revoke it:

1. **Go to Google Account:**
   - https://myaccount.google.com/security
   - Sign in with the same Google account

2. **Revoke Firebase CLI access:**
   - Go to "Third-party apps with account access"
   - Find "Firebase CLI" or "Google Cloud SDK"
   - Click "Remove access" or "Revoke"

3. **Or use Firebase Console:**
   - Go to: https://console.firebase.google.com/u/0/project/iterum-culinary-app2/settings/serviceaccounts
   - Revoke any old tokens

---

## 🔍 **Token Format**

Firebase CI tokens typically:
- Start with `1//` (OAuth refresh token)
- Are long strings (100+ characters)
- Are used for automated deployments
- Should be kept secret

---

## ✅ **Step 4: Test GitHub Actions**

After adding the token:

1. **Push a change to `main` branch:**
   ```cmd
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```

2. **Check GitHub Actions:**
   - Go to repository → "Actions" tab
   - Look for "Deploy to Firebase Hosting" workflow
   - Should run automatically
   - Check if it succeeds

---

## 🎯 **Quick Summary**

1. ✅ **Generate NEW token**: `firebase login:ci`
2. ✅ **Add to GitHub**: Settings → Secrets → Actions → `FIREBASE_TOKEN`
3. ✅ **Revoke OLD token**: Google Account security settings
4. ✅ **Test**: Push to main branch and check Actions

---

## ⚠️ **Security Best Practices**

- ✅ **Never share tokens** in chat, email, or public places
- ✅ **Use GitHub Secrets** for storing tokens
- ✅ **Rotate tokens** regularly
- ✅ **Revoke exposed tokens** immediately
- ✅ **Use different tokens** for different environments if needed

---

**Generate a NEW token and add it to GitHub Secrets - don't use the exposed one!**

