# Add a teammate (UID path — no email invite yet)

**Audience:** Account owner or `account_admin`. **Production URL:** `https://iterum-culinary-app.vercel.app`  
**Full verification:** [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md)  
**Roles:** [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md)  

---

## Before you start

1. **Line user** has a Firebase account (sign up on `/signin.html`).  
2. **Admin** can open [project-hub.html](../public/project-hub.html) while signed in and sees **Add teammate to a project** (`#team-access-panel`).  
3. **Deploy Firebase** on `main` is green if you recently changed rules (see [HOW_WE_SHIP.md](./HOW_WE_SHIP.md)).

---

## Line user — send UID

1. Open `{base}/mobile-compliance.html` → sign in.  
2. Use **Copy my user ID** (`#my-firebase-uid`).  
3. Send the UID to the admin over a **private** channel (not a public ticket).  
4. Optional staff guide: `{base}/foh-first-shift.html` or [FOH_FIRST_SHIFT_QUICK_CARD.md](./FOH_FIRST_SHIFT_QUICK_CARD.md).

---

## Admin — add to project

1. Open `{base}/project-hub.html` → sign in.  
2. Scroll to **Add teammate to a project**.  
3. **Project** (`#team-project-select`): choose the workspace.  
4. **Firebase User UID** (`#team-target-uid`): paste the line user’s UID.  
5. **Role** (`#team-member-role`): e.g. line / crew per pilot agreement.  
6. Click **Save to project** (`#team-add-member-btn`).  
7. Confirm success message (`#team-access-msg`).

---

## Line user — confirm

1. Refresh `mobile-compliance.html` (or sign out and back in).  
2. Open **Workspace (team project)** (`#project-picker`) — the project should appear (not only “No shared projects yet”).  
3. Select it and complete one harmless action; there should be no persistent **permission denied**.

---

## If it fails

See **If something fails** in [PHASE_1_TEAMMATE_FLOW_CHECKLIST.md](./PHASE_1_TEAMMATE_FLOW_CHECKLIST.md). Escalate to **CTO** for rules/indexes, **Eng** for reproducible client bugs.
