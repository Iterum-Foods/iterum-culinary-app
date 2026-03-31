# Platform / DevOps runbook — Iterum Culinary on Firebase

**Audience:** Platform/DevOps (coordinates with CTO).  
**Scope:** Deploy mechanics, config consistency, rules deployment, monitoring posture, backups, and rollback **communication** — not product requirements.

**Repeatability / auditability:** Prefer explicit CLI targets, recorded git SHAs, and console screenshots or change tickets for production changes.

---

## 1. Canonical configuration (single source of truth)

| Concern | Repo location | Notes |
|--------|----------------|-------|
| Hosting, Firestore rules path, Storage rules path | `firebase.json` | Must stay in sync with actual `firestore.rules` / `storage.rules` filenames. |
| Firebase CLI default project | `.firebaserc` | `firebase use` should match the intended production project **before** any deploy. |
| Client SDK bootstrap | `public/assets/js/firebase-config.js` | Public web config; must match the same Firebase **project** as `.firebaserc` (see verification docs). |
| Data access inventory | `docs/DATA_ACCESS_INVENTORY.md` | Helps reason about rule changes; does not replace rules review. |

Cross-check procedures and console links are consolidated in:

- `FIREBASE_SETUP_VERIFICATION.md` — services, file layout, checklist.  
- `GITHUB_FIREBASE_VERIFICATION.md` — alignment across `firebase-config.js`, `firebase.json`, `.firebaserc`.  
- `FIREBASE_SECRET_VERIFICATION.md` — how to confirm web app keys against **Firebase Console** (do not paste secrets into tickets or this runbook).  
- `FIREBASE_STORAGE_STATUS.md` — Storage module and `firebase deploy --only storage` context.  
- Hosting / 404 / domain troubleshooting: `FIREBASE_SITE_404_FIX.md`, `FIREBASE_DOMAIN_ACTIVATION_FIX.md`, `FIREBASE_404_DOMAIN_ISSUE.md`, `FIREBASE_SITE_NOT_RECOGNIZING_FILES.md`, `FIREBASE_FILES_NOT_RECOGNIZED_FIX.md`, `FIREBASE_404_ISSUE_DIAGNOSIS.md`.  
- GitHub Actions & token hygiene: `SECRET_UPDATE_CONFIRMATION.md`.

**Rule:** Never commit CLI tokens, service account JSON, or **private** secrets. The Firebase web app `apiKey` is **public by design**; still verify it only via Console + `firebase-config.js` comparison per `FIREBASE_SECRET_VERIFICATION.md`.

---

## 2. Local prerequisites (Windows and macOS)

Use the same **Firebase project** your CTO designates for production. Substitute your repository path.

**Install / use CLI (repeatable):**

```bash
npx --yes firebase-tools@latest --version
```

**Login (interactive):**

```bash
npx --yes firebase-tools@latest login
```

**Select project (must match `.firebaserc` default or an explicit alias):**

```bash
npx --yes firebase-tools@latest use
```

**Confirm active project:**

```bash
npx --yes firebase-tools@latest projects:list
```

If your team standardizes on a global install instead of `npx`, replace `npx --yes firebase-tools@latest` with `firebase` everywhere.

**Windows note:** Run terminals **as a normal user** from the repo root, for example:

```powershell
Set-Location "C:\Iterum Innovation\iterum-culinary-app"
```

**Optional preflight (from repo root, Node available):**

```bash
node verify-firebase-config.js
```

That script is intended for **browser-console** workflows documented in `verify-firebase-config.js` / setup verification; use it in the context described in `FIREBASE_SETUP_VERIFICATION.md`.

---

## 3. CI / CD reality in this repository

Under `.github/workflows/`, current automation includes **lint**, **test**, **e2e**, **security-scan**, and dependency workflows — **not** a checked-in Firebase production deploy workflow (see `APP_STATUS_REPORT.md` / `NEXT_STEPS_LEADERSHIP.md` for ownership).

**Audit-friendly recommendation for CTO:**

1. Decide **who** runs production Firebase deploys (human vs GitHub Action).  
2. If using GitHub Actions, add a dedicated workflow with: pinned Node, `firebase deploy` with explicit `--only`, and a secret such as `FIREBASE_TOKEN` created via `firebase login:ci` (document rotation in `SECRET_UPDATE_CONFIRMATION.md`).  
3. Require **green** lint/test (and e2e when applicable) before deploy.

Until that exists, treat deploys as **manual, named, logged** events tied to a git tag or SHA.

---

## 4. Deploy ordering: Firestore rules, Storage rules, Hosting

**Goal:** Avoid a window where the web app and security posture disagree, and avoid partial rule updates when changes are coupled.

**Recommended explicit sequence (audit trail):**

1. **Firestore security rules** — `firestore.rules` validated (Emulator or Console Rules Playground).  
2. **Storage security rules** — `storage.rules` validated the same way.  
3. **Hosting** — static assets in `public/` per `firebase.json`.

**CLI pattern (rules first, then hosting):** use the **site** / **project** already defined in `firebase.json` / `.firebaserc` (do not guess project IDs in runbooks).

```bash
npx --yes firebase-tools@latest deploy --only firestore:rules,storage
```

```bash
npx --yes firebase-tools@latest deploy --only hosting
```

If your `firebase.json` names a specific hosting site, your team may use the form:

```bash
npx --yes firebase-tools@latest deploy --only hosting:SITE_ID_FROM_FIREBASE_JSON
```

**When to use a single combined deploy:** For a single approved change, `firebase deploy` without `--only` deploys multiple targets; explicit `--only` steps are often **easier to log and replay** in postmortems.

**When rule changes depend on a new client:** Coordinate with CTO: either ship **rules that safely support both** old and new clients for a short window, or schedule a tight deploy order (document the chosen strategy in the change ticket).

---

## 5. Environment consistency checklist (before any production deploy)

- [ ] Working tree matches intended **commit SHA** (or release branch).  
- [ ] `firebase use` shows the **correct** project.  
- [ ] `firebase.json` `public` folder and `ignore` lists match expectations (see hosting troubleshooting docs if assets 404).  
- [ ] `public/assets/js/firebase-config.js` projectId / authDomain / storageBucket align with Console for **that** project (`FIREBASE_SETUP_VERIFICATION.md`, `GITHUB_FIREBASE_VERIFICATION.md`).  
- [ ] Rules files pass review (diff visible in PR).  
- [ ] Smoke test plan: sign-in, one Firestore read/write path, one Storage path appropriate to your app.

**Dry-run (when you want CLI validation without applying):**

```bash
npx --yes firebase-tools@latest deploy --only hosting --dry-run
```

(Adjust `--only` to match what you intend to ship.)

---

## 6. Hosting cache issues (symptoms: stale or wrong assets)

If deploy behaves oddly, clear local Hosting cache **for this repo** and redeploy. From repo root:

**macOS / Linux:**

```bash
rm -rf .firebase
```

**Windows (PowerShell):**

```powershell
Remove-Item -Recurse -Force .firebase -ErrorAction SilentlyContinue
```

Then rerun your deploy command. See step-by-step context in `FIREBASE_SITE_404_FIX.md`.

---

## 7. Monitoring and alerts (posture)

Firebase/GCP surfaces evolve; keep **ownership** with CTO/Platform.

- **Firebase Console** — project overview, Authentication, Firestore, Storage, Hosting release history, usage.  
- **Budgets & billing alerts** — in Google Cloud Console tied to the Firebase project (Blaze / export features).  
- **Rules monitoring** — review rejected requests in development; use staged rollouts where possible (preview channels) for hosting.  
- **Status page** — https://status.firebase.google.com/ (incident comms; referenced in `FIREBASE_404_DOMAIN_ISSUE.md`).

Document **who** receives alerts and **which** channels (email, Slack, Pager) in your internal ops doc — not in this runbook.

---

## 8. Backup mindset (operational, not a full DR plan)

- **Source:** Git tags/commits for `firebase.json`, `firestore.rules`, `storage.rules`, and `public/`.  
- **Firestore:** Scheduled exports and retention are **Blaze / GCP** concerns; define RPO/RTO with CTO.  
- **Storage:** Lifecycle, object versioning, and cross-region strategy are product/legal decisions — Platform implements after policy exists.  
- **Hosting:** Release history supports rollback to a prior version (see below).

---

## 9. Rollback — safe talk tracks

Use these with engineering and stakeholders without overpromising.

### Hosting (static app)

- **Message:** “We can roll **Hosting** back to a previously released version in Firebase Hosting’s release history while we fix forward; users may see cached assets until TTLs expire; we will confirm the restored version with a smoke test.”  
- **Action:** Firebase Console → Hosting → **Release history** → select prior release → rollback (or your team’s CLI/automation equivalent). Details: Firebase docs for [Managing Hosting](https://firebase.google.com/docs/hosting/manage-hosting).

### Firestore / Storage rules

- **Message:** “Rules are versioned in **git**. If a rules deploy caused impact, we will **revert the rules commit** (or restore known-good content), redeploy **Firestore** and **Storage** rules in the agreed order, and validate with test accounts before announcing resolution.”  
- **Action:** Prefer the same two-step rules deploy as in §4, from a **known-good SHA**.

### Client config mistakes (`firebase-config.js`)

- **Message:** “Wrong client config is a **forward fix**: we revert or patch config, redeploy **hosting**, and verify in Console that the web app’s keys match the project.”  
- **Procedure pointers:** `FIREBASE_SECRET_VERIFICATION.md`, `SECRET_UPDATE_CONFIRMATION.md`.

### Secrets / tokens

- **Message:** “We do **not** roll back secrets in chat. We **rotate** in Console or GitHub secret store and invalidate old tokens per `SECRET_UPDATE_CONFIRMATION.md`.”

### What rollback does *not* do

- **Message:** “Rollback of Hosting does **not** automatically revert Firestore **data** written while a bad build was live; data fixes are a separate assessment.”

---

## 10. Incident / change record (minimal audit log)

For each production deploy or rules change, record:

- Date/time (timezone), **actor**, git **SHA**, `firebase deploy` **exact** command(s), targets (`--only`), and smoke-test result.  
- Link to PR or ticket.  
- Whether Hosting-only, rules-only, or full stack.

---

## 11. Escalation

**Product scope and prioritization:** CTO.  
**Firebase project access, billing, org policy:** project owners / GCP admins.  
**This runbook:** update when deploy paths, workflows, or ownership change; keep `FIREBASE_*` verification docs as the deep dives for config and incident specifics.
