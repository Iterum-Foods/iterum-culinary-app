# 🚀 Deploy to Firebase Now

## Quick Deployment Steps

### Option 1: Double-Click (Easiest)

1. **Open Windows Explorer** and navigate to:
   ```
   C:\Users\chefm\Iterum Innovation\iterum-culinary-app
   ```

2. **Double-click** `deploy-node-direct.bat`

3. The script will:
   - Set Firebase project to `iterum-culinary-app2`
   - Deploy Firestore rules
   - Deploy Storage rules
   - Deploy Landing site (`iterum-culinary-landing`)
   - Deploy Main App site (`iterum-culinary-app2`)

---

### Option 2: Command Prompt

1. **Open Command Prompt (CMD)** - NOT PowerShell
   - Press `Windows Key + R`
   - Type: `cmd`
   - Press Enter

2. **Navigate to project**:
   ```cmd
   cd "C:\Users\chefm\Iterum Innovation\iterum-culinary-app"
   ```

3. **Run deployment**:
   ```cmd
   deploy-node-direct.bat
   ```

---

## What Will Deploy

✅ **Firestore Rules** - Database security rules  
✅ **Storage Rules** - File upload security rules  
✅ **Landing Site** - `iterum-culinary-landing.web.app`  
✅ **Main App Site** - `iterum-culinary-app2.web.app`

---

## If You Get Authentication Errors

If the script says "Failed to set project" or asks for login:

1. In Command Prompt, run:
   ```cmd
   C:\Users\chefm\AppData\Roaming\npm\firebase.cmd login --reauth
   ```

2. Follow the browser prompts to authenticate

3. Then run `deploy-node-direct.bat` again

**OR** use the login script:
   ```cmd
   firebase-login.bat
   ```

---

## Expected Output

You should see:
```
[1/5] Setting Firebase project...
Now using project iterum-culinary-app2

[2/5] Deploying Firestore rules...
✔  Deployed Firestore rules successfully

[3/5] Deploying Storage rules...
✔  Deployed Storage rules successfully

[4/5] Deploying Landing Site...
✔  Deployed hosting site iterum-culinary-landing

[5/5] Deploying Main App Site...
✔  Deployed hosting site iterum-culinary-app2
```

---

## After Deployment

Check your sites:
- **Landing**: https://iterum-culinary-landing.web.app
- **Main App**: https://iterum-culinary-app2.web.app

---

## Troubleshooting

**If you see PowerShell errors:**
- Make sure you're using **Command Prompt (CMD)**, not PowerShell
- Or double-click the `.bat` file in Windows Explorer

**If deployment fails:**
- Check that you're logged in: Run `firebase-login.bat`
- Verify project: Already set in `deploy-node-direct.bat` to `iterum-culinary-app2`
- Check Firebase Console for site status
