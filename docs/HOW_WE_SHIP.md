# How we ship (Vercel + Firebase)

**Purpose:** One short runbook so deploy and smoke are repeatable.  
**Canonical app URL (pilots):** https://iterum-culinary-app.vercel.app/  
**Firebase project:** `iterum-culinary-app2`  
**Last updated:** March 2026  

---

## What ships where

| Surface | How | When |
|---------|-----|------|
| **Static app** (HTML, JS, CSS in `public/`) | **Vercel** — Git integration on `main` | Every push to `main` (typical). Includes **`/mobile-compliance.html`** (phone-first fridge + sanitizer log; PWA manifest **`/manifest-compliance.json`**). |
| **Store apps** (Play / App Store) | **Capacitor** — `android/`, `ios/` | `npm run cap:sync` after changing `public/` or `capacitor.config.json`. Open Android Studio / Xcode via `npm run cap:open:android` / `cap:open:ios`. Default config loads production **`server.url`** (line log); see [APP_COMPLETION_PLAN — Mobile acquisition](./APP_COMPLETION_PLAN.md#mobile-acquisition--line-log-mvp). |
| **Firestore rules** + **Storage rules** | **GitHub Actions** — workflow **Deploy Firebase** | On push to `main` when `firestore.rules`, `storage.rules`, `firebase.json`, `.firebaserc`, or the workflow file changes; or **Run workflow** manually. |
| **Firebase Auth / Firestore data** | Console + client at runtime | Not redeployed with static files. |

Repo secret required: **`FIREBASE_TOKEN`** (from `npx firebase-tools login:ci`).

---

## If **Deploy Firebase** fails in CI

Typical failure is the step **Deploy Firestore + Storage rules** (≈20–45s after checkout).

| Symptom / log hint | What to do |
|--------------------|------------|
| **Authentication Error**, **Invalid JWT**, **HTTP 401/403**, or “could not determine project” | Regenerate a CI token: locally run `npx firebase-tools@15.12.0 login:ci`, then set repo secret **`FIREBASE_TOKEN`** on the org/repo. Re-run the failed workflow (**Re-run all jobs**) or **Actions → Deploy Firebase → Run workflow**. |
| **Error compiling rules** / syntax | Fix `firestore.rules` / `storage.rules`, push to `main`, or open a PR. |
| **Permission denied** on project | The token account must have deploy rights on **`iterum-culinary-app2`** (Firebase Console → Project settings → Users and permissions). |

After fixing the token or rules, you do **not** need a new commit if only the secret changed: use **workflow_dispatch** on [Deploy Firebase](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml).

---

## Engineer checklist (every production-facing change)

1. Merge to **`main`** after PR / review as appropriate.  
2. Confirm **Vercel** deployment for production lands (dashboard: project connected to repo).  
3. If rules changed: confirm [**Deploy Firebase**](https://github.com/Iterum-Foods/iterum-culinary-app/actions/workflows/firebase-deploy.yml) is **green**.  
4. Run **[A1 smoke](../docs/A1_P0_PROD_SMOKE_RECORD.md)** on the **Vercel** URL (not only localhost).  
5. Update **[EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md)** **Ship & verify** rows.

---

## Add a teammate

1. User must have a **Firebase Auth** account (sign up once — web or **line log**). They can tap **Copy my user ID** on `mobile-compliance.html` and send that string to their manager.  
2. **In-app (preferred):** On **Project Hub** (`project-hub.html`), signed-in **project owner** or **`account_admin`** uses **Add teammate to a project**, chooses the project, pastes the teammate’s **Firebase UID**, role, optional email → writes `projects/{projectId}/members/{uid}` with `authUid` + `role` (see [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md)).  
3. **Console (fallback):** Firestore → `projects/{projectId}/members/{theirAuthUid}` with `role` and **`authUid`** equal to the document id (required for collection-group queries and security rules).  
4. **Indexes:** Deploy **`firestore.indexes.json`** (collection group `members` · field `authUid`) so the line log app can list a user’s projects.

**Line log app:** After they are added, they sign in, pick the **Workspace** dropdown, then new fridge/sanitizer rows use that `projectId` (same as dashboard/calendar filters).

---

## Links

- [FIREBASE_SETUP_VERIFICATION.md](../FIREBASE_SETUP_VERIFICATION.md)  
- [APP_COMPLETION_PLAN.md](./APP_COMPLETION_PLAN.md)  
- [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md)  
