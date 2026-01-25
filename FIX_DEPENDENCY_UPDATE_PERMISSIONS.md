# 🔧 Fix Dependency Update Workflow Permissions

## **The Problem**

The GitHub Actions bot doesn't have permission to push branches and create PRs.

**Error:**
```
remote: Permission to Iterum-Foods/iterum-culinary-app.git denied to github-actions[bot].
fatal: unable to access 'https://github.com/Iterum-Foods/iterum-culinary-app/': The requested URL returned error: 403
```

---

## **Solution 1: Enable Workflow Permissions (Recommended)**

### **Step 1: Check Repository Settings**

1. Go to: **https://github.com/Iterum-Foods/iterum-culinary-app/settings/actions**
2. Scroll to **"Workflow permissions"**
3. Select: **"Read and write permissions"**
4. Check: **"Allow GitHub Actions to create and approve pull requests"**
5. Click **"Save"**

### **Step 2: Verify Workflow Has Permissions**

The workflow now includes:
```yaml
permissions:
  contents: write
  pull-requests: write
  issues: write
```

This should allow the bot to create PRs.

---

## **Solution 2: Use Personal Access Token (Alternative)**

If Solution 1 doesn't work, use a Personal Access Token:

### **Step 1: Create Personal Access Token**

1. Go to: **https://github.com/settings/tokens**
2. Click **"Generate new token (classic)"**
3. Name: `dependency-update-bot`
4. Select scopes:
   - ✅ `repo` (full control)
   - ✅ `workflow`
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)

### **Step 2: Add Token to Repository Secrets**

1. Go to: **https://github.com/Iterum-Foods/iterum-culinary-app/settings/secrets/actions**
2. Click **"New repository secret"**
3. Name: `DEPENDENCY_UPDATE_TOKEN`
4. Value: [paste the token]
5. Click **"Add secret"**

### **Step 3: Update Workflow**

Change the workflow to use the token:
```yaml
- name: Checkout code
  uses: actions/checkout@v4
  with:
    token: ${{ secrets.DEPENDENCY_UPDATE_TOKEN }}

- name: Create Pull Request
  uses: peter-evans/create-pull-request@v5
  with:
    token: ${{ secrets.DEPENDENCY_UPDATE_TOKEN }}
```

---

## **Solution 3: Disable Auto PR Creation (Simplest)**

If you don't need automatic PRs, just commit changes directly:

```yaml
- name: Commit changes
  if: steps.check-changes.outputs.has_changes == 'true'
  run: |
    git config --local user.email "action@github.com"
    git config --local user.name "GitHub Action"
    git add package.json package-lock.json
    git commit -m "chore: update dependencies"
    git push
```

---

## **Recommended: Try Solution 1 First**

1. Enable workflow permissions in repository settings
2. Re-run the workflow
3. If it still fails, use Solution 2 (Personal Access Token)

---

**The workflow has been updated with permissions. Now enable them in repository settings!**

