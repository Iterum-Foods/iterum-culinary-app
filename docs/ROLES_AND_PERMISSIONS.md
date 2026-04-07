# Roles & permissions (operator app)

**Purpose:** Single map of **workspace roles** (`roleKey`) and **scopes** to what the UI allows today, plus **planned** roles for employee logging and account admin.  
**Companion:** [docs/DATA_ACCESS_INVENTORY.md](./DATA_ACCESS_INVENTORY.md) (paths/keys).  
**Implementation:** Defaults for dashboard visibility live in [`public/assets/js/user-role-setup.js`](../public/assets/js/user-role-setup.js) (`ITERUM_ROLE_PERMISSIONS`, `applyDashboardLayoutForRole`).  
**Last updated:** 29 March 2026  

---

## Important: trust boundary

| Layer | What it does |
|--------|----------------|
| **`roleKey` + `scope` in localStorage** (`iterum_operator_profile`) | Tailors **dashboard cards**, header CTA, and copy — **not** cryptographic security. |
| **Firestore rules** | Enforce **who may read/write** project data (`ownerId`, `firebaseUid`, etc.). Today rules are **owner-centric**; **team / employee** access requires membership docs + rule updates (see *Planned*). |

Operators should treat **server rules** as the source of truth for data; UI role is **UX + routing**.

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

| Capability / surface | chef_leadership | operations_gm | purchasing | consultant_rd |
|------------------------|:---:|:---:|:---:|:---:|
| **Culinary Idea Pad** | Y | — | — | Y |
| **R&D pipeline** (chart) | Y | — | — | Y |
| **R&D shortcuts** (recipe dev, library, menu) | — | — | — | Y |
| **Purchasing & costing** tile (vendors, ingredients, inventory, menu) | — | — | Y | — |
| **Daily tasks** | Y | Y | Y | Y |
| **Temperature log** | Y | Y | — | — |
| **Sanitizer checks** | Y | Y | — | — |
| **Health inspection rounds** | Y | Y | — | — |
| **Shift focus** (kitchen hub links) | Y | Y | — | — |
| **Shift notes** | Y | Y | Y | Y |
| **At a glance** stats | Y | Y | Y | Y |
| **Ideas column** in “At a glance” | Y | — | — | Y |

### Header primary CTA (role-specific)

| `roleKey` | Default CTA |
|-----------|-------------|
| `purchasing` | Open **Vendors** (`vendor-management.html`) |
| `operations_gm` | **Kitchen hub** (`kitchen-management.html`) |
| `chef_leadership`, `consultant_rd` (and fallback) | **New experiment** (`recipe-developer.html`) |

---

## Planned roles (not yet in setup UI)

Use these keys in product/docs so engineering and Firestore line up.

| Planned `roleKey` | Intent | Target permissions (summary) |
|-------------------|--------|-------------------------------|
| `employee_line` | Line staff / hourly | Submit **admin-defined** logs only (temps, times, actions); **signature** on submit; **offline queue** then sync; **no** template admin, **no** vendor/costing. |
| `location_manager` | Store-level lead | Same project as employees; **read** team logs; **resolve/flag** conflicts; optional **edit** templates if product allows. |
| `account_admin` | Org owner / delegated admin | **Invite** users to project; **assign** roles; **define** log/SOP templates; **receive** conflict / sync alerts. |

Until these exist in Auth + Firestore membership, treat them as **requirements**, not live checks.

---

## Leadership & AI roles (out of band)

[LEADERSHIP_ROLE_ASSIGNMENTS.md](../LEADERSHIP_ROLE_ASSIGNMENTS.md) describes **COO / CTO / CEO** accountability and **AI agent personas** (PM, data analyst, etc.). Those are **not** `roleKey` values in the app login flow unless you explicitly add them later.

---

## Change log

| Date | Change |
|------|--------|
| 2026-03-29 | Initial matrix: four operator roles + scope; planned employee/admin rows; trust boundary note. |
