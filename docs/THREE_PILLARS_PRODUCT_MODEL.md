# Three pillars — product model

**Purpose:** North star for how Iterum Culinary is organized for operators and engineering.  
**Audience personas:** [ICP_AUDIENCE_PERSONAS.md](./ICP_AUDIENCE_PERSONAS.md) — owners (compliance + data ownership), launch chefs, career cooks.  
**Last updated:** May 2026

---

## Who we serve (summary)

| Persona | Core fear | Pillar emphasis |
|---------|-----------|-----------------|
| **Small business owner** | Failing compliance; can’t afford enterprise tools; wants **their** data | Run the shift + **Archive** |
| **Chef / restaurant launching** | Chaotic opening; recipes & menus not systemized | **Develop** + Archive at go-live |
| **Cook (career portfolio)** | Losing recipes between jobs; no portable system | **Develop** + Archive |

Full pains, messaging, and CEO/ICP alignment: [ICP_AUDIENCE_PERSONAS.md](./ICP_AUDIENCE_PERSONAS.md).

---

## The three pillars

| Pillar | Operator question | Primary surfaces |
|--------|-------------------|----------------|
| **1. Develop** | “What are we building on the menu and in the kitchen?” | Recipe library, Recipe developer, Menu builder, ingredients, vendors, costing, kitchen hub |
| **2. Run the shift** | “What do we do today — logs, checks, team, service?” | Dashboard (HACCP, checklists), Calendar, **Shift app** (mobile), Team (project hub) |
| **3. Archive** | “Is our work **organized, saved, and recoverable** per workspace?” | **Archive hub**, Backup center, exports, cloud sync status, archived projects, audit trail |

All three share:

- **Workspace / project** — every save should know *which location* it belongs to ([SOURCE_OF_TRUTH.md](./SOURCE_OF_TRUTH.md)).
- **Firebase identity** — sign-in for cloud-backed menus, members, checklists.
- **Workspace save indicator** — dashboard & menu builder show active project + sync state.

---

## Pillar 3 — Archive (detail)

**Goal:** Nothing important lives only in one browser tab. Data is:

1. **Organized** — grouped by project/workspace and data type (recipes, menus, vendors, compliance logs).
2. **Saved** — local storage + periodic backups + Firestore where wired ([DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md)).
3. **Recoverable** — download JSON, restore from backup, switch devices after sign-in.

| Capability | Where |
|------------|--------|
| Archive home (inventory + actions) | `archive-hub.html` |
| Full account export / restore | `data-backup-center.html`, `backup-manager.js` |
| Archived workspaces | `project-hub.html` (Workspaces tab) |
| Cloud copy of menus / members / checklists | `projects/{projectId}/…` in Firestore |
| Activity trail | `audit-log.html` |
| Advanced data tools | `data-management-dashboard.html` |

**Operator habit:** After a big menu push or month-end, open **Archive hub** → confirm counts → **Download backup** → store file off-device.

---

## What is not a fourth pillar

- **Team / setup / project hub** — cross-cutting; supports all three pillars.
- **More tools** — overflow for imports and specialty pages; Archive links are also in the sidebar **Archive** section.

---

## Engineering alignment

| Pillar | P0 data rule |
|--------|----------------|
| Develop | Tag `projectId` on saves; publish menus to `projects/{id}/menus` |
| Run the shift | Field staff read snapshots; write checklists under project |
| Archive | Export includes project list + per-project keys; warn on Master-only saves |

See [E2_PROJECTID_AUDIT.md](./E2_PROJECTID_AUDIT.md), [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md).

---

## Revision history

| Date | Change |
|------|--------|
| May 2026 | Initial three-pillar model; Archive hub as pillar 3 home. |
