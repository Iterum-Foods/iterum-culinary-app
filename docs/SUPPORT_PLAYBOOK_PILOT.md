# Support playbook — web app pilots (Phase 1)

**Audience:** COO, Ops, or whoever answers pilot email first.  
**Escalation:** Technical = **CTO** → Eng; product scope = **CEO** with COO facilitation.  
**No** passwords, service account JSON, or customer PII in tickets—use secure channels.

---

## 1. Session / “can’t sign in”

| Step | Action |
|------|--------|
| 1 | Confirm URL: production **Vercel** (`https://iterum-culinary-app.vercel.app/...`) vs old bookmark. |
| 2 | **Hard refresh** (Ctrl+Shift+R / clear cache for site). |
| 3 | Try **incognito** to rule out extensions. |
| 4 | Wrong password → use Firebase **password reset** from sign-in flow if implemented; else CEO/CTO policy. |
| 5 | “Auth not available” / spinner forever → **CTO** (Firebase config, deploy, ad blockers). |

---

## 2. “I’m not on the right project / no data”

| Step | Action |
|------|--------|
| 1 | **Web:** Project selector / [project-hub](../public/project-hub.html) — confirm correct workspace. |
| 2 | **Line log:** [mobile-compliance.html](../public/mobile-compliance.html) → **Workspace (team project)** must match; use **Copy my user ID** if admin must re-add member. |
| 3 | New teammate → short path [ADD_TEAMMATE_UID_PATH.md](./ADD_TEAMMATE_UID_PATH.md); full checklist [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md). |

---

## 3. Finding a user’s Firebase UID (for admins / support)

**Path (high level):** [Firebase Console](https://console.firebase.google.com) → your project → **Authentication** → **Users** → search by email → copy **User UID**.  
**Pilot line staff** can use **Copy my user ID** on the line log app after sign-in (no Console needed).

Do **not** paste UIDs into public Slack; use DM or your ticket private field.

---

## 4. Escalation matrix

| Issue type | Examples | Route |
|------------|----------|--------|
| **Rules / deploy / indexes** | Permission denied after confirmed membership; “index” errors | **CTO** + Eng — [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) |
| **App bug** | Reproducible UI break, wrong save | **Eng** (file issue with steps, browser, URL) |
| **Scope / pricing / ICP** | “Can you build X before pilot ends?” | **COO** → **CEO** |
| **Data loss fear** | “My menu disappeared” | Eng + CTO — check project selection and sync; see [DATA_ACCESS_INVENTORY](./DATA_ACCESS_INVENTORY.md) paths |

---

## 5. What front-line should **not** do

- Change Firestore documents by hand unless CTO approves a runbook step.  
- Share **FIREBASE_TOKEN** or repo secrets.  
- Promise ship dates — log request for PM/CEO prioritization.

---

## 6. After the pilot

- Weekly check-in template: see [CEO_TEAM_TASK_LIST_TO_MARKET.md](./CEO_TEAM_TASK_LIST_TO_MARKET.md) Phase 3 (pilot feedback loop).  
- Success / fail bar: [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md).
