# How we ship (Vercel + Firebase)

**Purpose:** One short runbook so deploy and smoke are repeatable.  
**Canonical app URL (pilots):** https://iterum-culinary-app.vercel.app/  
**Firebase project:** `iterum-culinary-app2`  
**Last updated:** 9 May 2026  

---

## Mobile store versioning + privacy URL

- **Android:** bump `versionCode` and `versionName` in `android/app/build.gradle` before **each** Play Console upload.
- **iOS:** bump `CURRENT_PROJECT_VERSION` and `MARKETING_VERSION` in `ios/App/App.xcodeproj/project.pbxproj` before **each** App Store upload.
- **Privacy policy (stores + support):** static page [public/privacy.html](../public/privacy.html) — live at **`https://iterum-culinary-app.vercel.app/privacy.html`** after Vercel deploy (or your custom domain + `/privacy.html`). Full checklist: [PHASE_2_3_EXECUTION.md](./PHASE_2_3_EXECUTION.md).

---

## What ships where

| Surface                                     | How                                               | When                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Static app** (HTML, JS, CSS in `public/`) | **Vercel** — Git integration on `main`            | Every push to `main` (typical). Includes **`/mobile-compliance.html`** (phone-first fridge + sanitizer log; PWA manifest **`/manifest-compliance.json`**). For **cross-page design work**, follow [WEB_APP_DESIGN_CHANGE_WORKFLOW.md](./WEB_APP_DESIGN_CHANGE_WORKFLOW.md).                                                                                                                                                                   |
| **Store apps** (Play / App Store)           | **Capacitor** — `android/`, `ios/`                | `npm run cap:sync` after changing `public/` or `capacitor.config.json`. Open Android Studio / Xcode via `npm run cap:open:android` / `cap:open:ios`. Default config loads production **`server.url`** (line log); see [APP_COMPLETION_PLAN — Mobile acquisition](./APP_COMPLETION_PLAN.md#mobile-acquisition--line-log-mvp). |
| **Firestore rules** + **Storage rules**     | **GitHub Actions** — workflow **Deploy Firebase** | On push to `main` when `firestore.rules`, `storage.rules`, `firebase.json`, `.firebaserc`, or the workflow file changes; or **Run workflow** manually.                                                                                                                                                                       |
| **Firebase Auth / Firestore data**          | Console + client at runtime                       | Not redeployed with static files.                                                                                                                                                                                                                                                                                            |

Repo secret required: **`FIREBASE_TOKEN`** (from `npx firebase-tools login:ci`).

**17 Jul 2026:** Local `firebase-tools` reported **credentials no longer valid**. Before CI can deploy E3 rules, regenerate the token (`login:ci`) and update the GitHub secret — then **Run workflow** on Deploy Firebase. Full steps: [E3_PROD_VERIFY.md](./E3_PROD_VERIFY.md) Gate 0.

---

## If **Deploy Firebase** fails in CI

Typical failure is the step **Deploy Firestore + Storage rules** (≈20–45s after checkout).

| Symptom / log hint                                                                            | What to do                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Authentication Error**, **Invalid JWT**, **HTTP 401/403**, or “could not determine project” | Regenerate a CI token: locally run `npx firebase-tools@15.12.0 login:ci`, then set repo secret **`FIREBASE_TOKEN`** on the org/repo. Re-run the failed workflow (**Re-run all jobs**) or **Actions → Deploy Firebase → Run workflow**. |
| **Error compiling rules** / syntax                                                            | Fix `firestore.rules` / `storage.rules`, push to `main`, or open a PR.                                                                                                                                                                 |
| **Permission denied** on project                                                              | The token account must have deploy rights on **`iterum-culinary-app2`** (Firebase Console → Project settings → Users and permissions).                                                                                                 |

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

## Custom domain (Vercel)

Use this when you want something like `app.yourbrand.com` instead of the default Vercel URL.

1. In **Vercel** → your project → **Settings** → **Domains** → add the domain and follow DNS instructions (usually a **CNAME** to `cname.vercel-dns.com` or an **A** record to Vercel’s IPs).
2. Wait for **SSL** to provision (often a few minutes after DNS propagates).
3. **Firebase Auth** authorized domains: Firebase Console → **Authentication** → **Settings** → **Authorized domains** → add the same hostname so sign-in redirects work.
4. **No code change** is required for static files if the app uses relative paths; spot-check sign-in, deep links, and the Shift PWA after cutover.

---

## Five-minute pilot demo (prod)

Run on **`https://iterum-culinary-app.vercel.app/`** (or your custom domain once live).

1. **Sign in** as a pilot account.
2. **Confirm workspace** — sidebar shows the current project name (chip) and selector if enabled.
3. **Menu builder** — open `menu-builder.html`, confirm context matches the selected workspace; switch workspace and verify the chip / draft behavior you expect.
4. **Shift (line)** — open `/mobile-compliance.html` on a phone or narrow window; sign in, pick workspace, open one hub area (e.g. temps or team log).
5. **Stop** on a win: “We can onboard your team with this URL and a short checklist.”

---

## Before starting E3 (vendor catalog)

**Locked 2 Jul 2026** — [E3_DECISION_RECORD.md](./E3_DECISION_RECORD.md):

- **One shared vendor list per account** (not separate lists per venue).
- **Per-workspace prices** (`projectId` on `vendor_prices` rows).
- **Each chef maintains** vendor and price data for their kitchen(s).

Eng sequences **E3** per [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) and [E3_BACKEND_UPGRADE_PLAN.md](./E3_BACKEND_UPGRADE_PLAN.md). Rules must be extended so teammates are not owner-only on `users/.../vendors` and `vendor_prices`.

---

## Links

- [FIREBASE_SETUP_VERIFICATION.md](../FIREBASE_SETUP_VERIFICATION.md)
- [APP_COMPLETION_PLAN.md](./APP_COMPLETION_PLAN.md)
- [DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md)
