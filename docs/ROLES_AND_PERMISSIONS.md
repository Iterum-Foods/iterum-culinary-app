# Roles & permissions (operator app)

**Purpose:** Single map of **workspace roles** (`roleKey`) and **scopes** to what the UI allows today, plus **planned** roles for employee logging and account admin.  
**Companion:** [docs/DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) (paths/keys).  
**Implementation:** Defaults for dashboard visibility live in [`public/assets/js/user-role-setup.js`](../public/assets/js/user-role-setup.js) (`ITERUM_ROLE_PERMISSIONS`, `applyDashboardLayoutForRole`).  
**Last updated:** 29 March 2026  

---

## Important: trust boundary

| Layer | What it does |
|--------|----------------|
| **`roleKey` + `scope` in localStorage** (`iterum_operator_profile`) | Tailors **dashboard cards**, header CTA, and copy when **no** server membership row exists. |
| **Firestore `projects/{projectId}/members/{uid}`** | **Company role** for that workspace (`role` field). Loaded by [`project-membership.js`](../public/assets/js/project-membership.js); **overrides** local `roleKey` for UI when present. |
| **Firestore rules** | Project access = **project owner** (existing fields) **or** **member doc** with a valid `role`. Members inherit read/write on project subcollections (menus, checklists, etc.); **project root doc** update/delete stays **owner-only**. Member docs: create/update/delete by **owner** or **`account_admin`** member. |

---

## Server membership (company role per project)

| Path | Fields (typical) | Notes |
|------|------------------|--------|
| `projects/{projectId}/members/{userId}` | `role`, `email`, `updatedAt` | `userId` = Firebase Auth UID. |

**Valid `role` values:** `account_admin`, `location_manager`, `employee_line`, `front_of_house`, `kitchen_staff`, `support_staff`, `chef_leadership`, `operations_gm`, `purchasing`, `consultant_rd`.  
Field-staff roles (`employee_line`, `front_of_house`, `kitchen_staff`, `support_staff`) share the same Firestore pattern: **read** project `menus` / `recipes` / `snapshots`; **write** `checklists` and personal `users/...` data; **no write** to menu/recipe/snapshot masters.

**Bootstrap:** When [`ensureProjectDoc`](../public/assets/js/firestore-sync.js) runs, the current user gets `members/{uid}` with `role: account_admin` (owner/org admin).

**UI mapping** (server → dashboard `roleKey`): `account_admin` → `chef_leadership`; `location_manager` → `operations_gm`; `employee_line`, `front_of_house`, `kitchen_staff`, `support_staff` → `employee_line` (same daily/compliance dashboard); others map 1:1.

**Invite / add teammates:** Owner or `account_admin` may create other `members/{uid}` docs (requires that user’s UID — e.g. after they sign up). No email-invite UI in this PR.

---

## Scope (organization), not a permission tier

Stored as `scope` on the same profile as `roleKey`:

| Value | Meaning |
|--------|---------|
| `single_restaurant` | One kitchen / one cost center (UI: “single venue” chip). |
| `restaurant_group` | Multiple venues or central oversight (UI: “restaurant group” chip). |

Scope affects **labels and future multi-site filters**; it does not replace `roleKey` for feature access.

---

## Current operator roles (`roleKey`)

Set in [`public/setup.html`](../public/setup.html); persisted with `saveOperatorProfile`.

| `roleKey` | Label in setup | Intent |
|-----------|----------------|--------|
| `chef_leadership` | Executive chef / Kitchen lead | Menus, recipes, R&D, compliance together. |
| `operations_gm` | GM & operations | Shifts, tasks, checklists, food-safety rhythm. |
| `purchasing` | Purchasing & costing | Vendors, ingredients, menu math. |
| `consultant_rd` | Consultant / R&D | Experiments; lighter daily ops surface. |

---

## Permission matrix — dashboard (current UI)

Legend: **Y** = visible for that role, **—** = hidden by `data-dash-roles` or layout rules.

| Capability / surface | chef_leadership | operations_gm | purchasing | consultant_rd | employee_line |
|------------------------|:---:|:---:|:---:|:---:|:---:|
| **Culinary Idea Pad** | Y | — | — | Y | — |
| **R&D pipeline** (chart) | Y | — | — | Y | — |
| **R&D shortcuts** (recipe dev, library, menu) | — | — | — | Y | — |
| **Purchasing & costing** tile (vendors, ingredients, inventory, menu) | — | — | Y | — | — |
| **Daily tasks** | Y | Y | Y | Y | Y |
| **Temperature log** | Y | Y | — | — | Y |
| **Sanitizer checks** | Y | Y | — | — | Y |
| **Health inspection rounds** | Y | Y | — | — | Y |
| **Shift focus** (kitchen hub links) | Y | Y | — | — | Y |
| **Shift notes** | Y | Y | Y | Y | Y |
| **At a glance** stats | Y | Y | Y | Y | Y |
| **Ideas column** in “At a glance” | Y | — | — | Y | — |

### Header primary CTA (role-specific)

| `roleKey` | Default CTA |
|-----------|-------------|
| `purchasing` | Open **Vendors** (`vendor-management.html`) |
| `operations_gm`, `employee_line` | **Kitchen hub** (`kitchen-management.html`) |
| `chef_leadership`, `consultant_rd` (and fallback) | **New experiment** (`recipe-developer.html`) |

### Default post-auth landing (`getPostAuthDestination`)

| Condition | Destination |
|-----------|---------------|
| No `iterum_operator_profile` saved | `setup.html` |
| `roleKey` = `employee_line` | `mobile-compliance.html` (shift tools first) |
| All other operator roles | `dashboard.html` |

### Manager-only UI (client-side)

| Surface | Rule |
|---------|------|
| Dashboard **manager handoff** notes | Hidden for `employee_line`; see `dashboard_manager_notes` in `user-role-setup.js`. Same pattern should be reused for future sensitive fields — **not** a cryptographic boundary (localStorage). |

---

## Server-only roles (no setup.html radio)

Stored only on `projects/{projectId}/members/{uid}.role` (not in `iterum_operator_profile`).

| Server `role` | Maps to UI `roleKey` | Notes |
|----------------|----------------------|--------|
| `account_admin` | `chef_leadership` | Full operator-style board; can manage **members** (with owner). |
| `location_manager` | `operations_gm` | Ops / shift focus. |
| `employee_line` | `employee_line` | Compliance + tasks + notes; no idea pad / R&D / purchasing tile. **Firestore:** read `projects/.../menus`, `recipes`, `snapshots`; **write** only `checklists` (not menus/recipes/snapshots). |

---

## Planned product (not fully built)

| Item | Notes |
|------|--------|
| **Invite-by-email UI** | Today: owner/admin writes `members/{targetUid}` in Console or a future admin screen. |
| **Offline log queue + conflict flagging** | See leadership / product threads; not in this change. |
| **Granular writes** (e.g. employee cannot edit menus) | Rules today allow member write on project subcollections; tighten per-collection when ready. |

---

## Leadership & AI roles (out of band)

[LEADERSHIP_ROLE_ASSIGNMENTS.md](../LEADERSHIP_ROLE_ASSIGNMENTS.md) describes **COO / CTO / CEO** accountability and **AI agent personas** (PM, data analyst, etc.). Those are **not** `roleKey` values in the app login flow unless you explicitly add them later.

---

## Change log

| Date | Change |
|------|--------|
| 2026-03-29 | Initial matrix: four operator roles + scope; planned employee/admin rows; trust boundary note. |
| 2026-03-29 | Firestore `members` + rules; `project-membership.js`; `employee_line` UI; owner bootstrap `account_admin`. |
| 2026-03-29 | Post-auth landing for `employee_line` → `mobile-compliance.html`; manager notes flag documented. |
