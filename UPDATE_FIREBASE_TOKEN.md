# 🔑 How to Update Firebase Token for GitHub Actions

## **Problem**
The error shows: `401, Request had invalid authentication credentials`

This means the `FIREBASE_TOKEN` in GitHub Secrets is expired or invalid.

---

## **⚠️ IMPORTANT: Verify Project First**

**Before generating the token, verify you're using the correct Firebase project:**

### **Your Project Configuration:**
- **Project ID**: `iterum-culinary-app2`
- **Hosting Sites**: 
  - `iterum-culinary-landing`
  - `iterum-culinary-app2`

### **Verify Project:**
Run this script to check:
```cmd
verify-firebase-project.bat
```

Or manually check:
```cmd
firebase use
```

Should show: `Now using project iterum-culinary-app2`

If not, switch to the correct project:
```cmd
firebase use iterum-culinary-app2
```

---

## **Solution: Generate New Token**

### **Option 1: Use the Batch Script (Easiest)**

1. **Run the script:**
   ```cmd
   generate-firebase-token.bat
   ```

2. **Follow the prompts:**
   - It will open your browser
   - Sign in with your Google account
   - Copy the token that appears

3. **Add to GitHub:**
   - Go to: https://github.com/Iterum-Foods/iterum-culinary-app/settings/secrets/actions
   - Click "New repository secret" (or edit existing `FIREBASE_TOKEN`)
   - Name: `FIREBASE_TOKEN`
   - Value: [paste the token]
   - Click "Add secret"

---

### **Option 2: Manual Command**

1. **Open Command Prompt** (not PowerShell)

2. **Run:**
   ```cmd
   firebase login:ci --no-localhost
   ```

3. **Follow the prompts:**
   - Browser will open
   - Sign in with Google
   - Copy the token

4. **Add to GitHub Secrets** (same as Option 1)

---

## **Verify Token Works**

After updating the token:

1. **Go to GitHub Actions:**
   - https://github.com/Iterum-Foods/iterum-culinary-app/actions

2. **Re-run the failed workflow:**
   - Click on the failed run
   - Click "Re-run all jobs" (or push a new commit)

3. **Check if it succeeds:**
   - ✅ Green checkmark = Success
   - ❌ Red X = Still an issue (check error message)

---

## **Important Notes**

- **Token expires**: Firebase CI tokens can expire. Regenerate if needed.
- **Permissions**: The token needs hosting permissions for both sites.
- **Security**: Never commit the token to the repository. Only use GitHub Secrets.

---

## **Troubleshooting**

**"Token generation failed"**
- Try: `firebase login --reauth` first
- Then run the token generation again

**"Cannot list projects"**
- Token might not have correct permissions
- Regenerate token with proper account

**"401 error persists"**
- Make sure you updated the GitHub Secret correctly
- Check the secret name is exactly `FIREBASE_TOKEN` (case-sensitive)
- Wait a few minutes for GitHub to update

---

**After updating the token, the deployment should work!**

