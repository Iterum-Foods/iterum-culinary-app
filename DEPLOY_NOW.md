# 🚀 Deploy Now - Step by Step

## ⚠️ **PowerShell Issue Detected**

Firebase CLI is being intercepted by PowerShell. Use one of these methods:

---

## ✅ **Method 1: Use Command Prompt (CMD)** ⭐ **RECOMMENDED**

### **Step 1: Open Command Prompt**
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter

### **Step 2: Navigate to Project**
```cmd
cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
```

### **Step 3: Authenticate (if needed)**
```cmd
firebase login --reauth
```

### **Step 4: Set Project**
```cmd
firebase use app2
```

### **Step 5: Deploy Everything**
```cmd
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only hosting:iterum-culinary-app2
```

---

## ✅ **Method 2: Use Firebase Console (Web Interface)**

### **1. Deploy Firestore Rules:**
1. Go to: https://console.firebase.google.com/project/iterum-culinary-app2/firestore/rules
2. Open `firestore.rules` file in your editor
3. Copy ALL content
4. Paste into Firebase Console rules editor
5. Click **"Publish"**

### **2. Deploy Storage Rules:**
1. Go to: https://console.firebase.google.com/project/iterum-culinary-app2/storage/rules
2. Open `storage.rules` file in your editor
3. Copy ALL content
4. Paste into Firebase Console rules editor
5. Click **"Publish"**

### **3. Create Firestore Database:**
1. Go to: https://console.firebase.google.com/project/iterum-culinary-app2/firestore
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select **location** (recommend: `us-central`)
5. Click **"Enable"**

### **4. Initialize Storage:**
1. Go to: https://console.firebase.google.com/project/iterum-culinary-app2/storage
2. Click **"Get started"**
3. Accept default rules (we'll update with custom rules)
4. Click **"Done"**

### **5. Deploy Hosting (via Console or wait for CLI fix):**
- Option A: Use Firebase Console → Hosting → Deploy
- Option B: Fix PowerShell and use CLI
- Option C: Use GitHub Actions if configured

---

## 📋 **Quick Checklist**

- [ ] Open Command Prompt (not PowerShell)
- [ ] Navigate to project folder
- [ ] Run: `firebase login --reauth` (if needed)
- [ ] Run: `firebase use app2`
- [ ] Run: `firebase deploy --only firestore:rules`
- [ ] Run: `firebase deploy --only storage`
- [ ] Run: `firebase deploy --only hosting:iterum-culinary-app2`

**OR**

- [ ] Deploy Firestore rules via Console
- [ ] Deploy Storage rules via Console
- [ ] Create Firestore database via Console
- [ ] Initialize Storage via Console
- [ ] Deploy hosting (Console or wait for CLI)

---

## 🎯 **Recommended: Use CMD**

**Just switch to Command Prompt - it will work!**

The PowerShell environment has something intercepting Firebase commands. CMD doesn't have this issue.

---

**Status:** Ready to deploy - just need to use CMD instead of PowerShell

