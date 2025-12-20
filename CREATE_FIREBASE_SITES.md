# 🔧 How to Create Firebase Hosting Sites

## **Problem: "Site not found" Error**

This means the hosting sites don't exist in Firebase Console yet.

---

## **Solution 1: Use the Script (Easiest)**

Run this script to check and create sites:
```cmd
check-firebase-sites.bat
```

This will:
1. Check if you're authenticated
2. Verify you're using the correct project
3. Check if sites exist
4. Create them if missing

---

## **Solution 2: Create Sites Manually**

### **Step 1: Go to Firebase Console**
1. Open: https://console.firebase.google.com/project/iterum-culinary-app2/hosting
2. Sign in with your Google account

### **Step 2: Create First Site (Landing)**
1. Click **"Add another site"** or **"Get started"**
2. Enter site ID: `iterum-culinary-landing`
3. Click **"Continue"**
4. Site will be created

### **Step 3: Create Second Site (App)**
1. Click **"Add another site"** again
2. Enter site ID: `iterum-culinary-app2`
3. Click **"Continue"**
4. Site will be created

### **Step 4: Verify Sites**
You should now see both sites:
- `iterum-culinary-landing`
- `iterum-culinary-app2`

---

## **Solution 3: Use Firebase CLI**

### **Check Current Sites:**
```cmd
firebase hosting:sites:list
```

### **Create Landing Site:**
```cmd
firebase hosting:sites:create iterum-culinary-landing
```

### **Create App Site:**
```cmd
firebase hosting:sites:create iterum-culinary-app2
```

### **Verify Sites:**
```cmd
firebase hosting:sites:list
```

Should show both sites.

---

## **Important Notes**

### **Site IDs Must Match Exactly:**
- ✅ `iterum-culinary-landing` (for landing site)
- ✅ `iterum-culinary-app2` (for app site)

### **Project Must Be Correct:**
- Project ID: `iterum-culinary-app2`
- Verify with: `firebase use`

### **After Creating Sites:**
1. Sites are created immediately
2. You can deploy right away
3. URLs will be:
   - `https://iterum-culinary-landing.web.app`
   - `https://iterum-culinary-app2.web.app`

---

## **Troubleshooting**

### **"Permission denied"**
- Make sure you're logged in: `firebase login`
- Check you have Owner/Editor permissions on the project

### **"Site already exists"**
- Site might exist but not be visible
- Check Firebase Console
- Try listing sites: `firebase hosting:sites:list`

### **"Project not found"**
- Verify project ID: `firebase use`
- Should show: `iterum-culinary-app2`
- If not, switch: `firebase use iterum-culinary-app2`

---

## **Quick Checklist**

- [ ] Authenticated with Firebase (`firebase login`)
- [ ] Using correct project (`iterum-culinary-app2`)
- [ ] Site `iterum-culinary-landing` exists
- [ ] Site `iterum-culinary-app2` exists
- [ ] Sites visible in Firebase Console
- [ ] Ready to deploy

---

**After creating sites, deploy again and they should work!**

