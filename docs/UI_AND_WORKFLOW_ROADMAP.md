# UI and workflow roadmap — professional, workflow-first Iterum

**Purpose:** A single **ordered progression** for design and UI work so the product feels **coherent**, **role-aware**, and **aligned to real restaurant workflows** (not a collection of screens).  
**Audience:** Design, product, and engineering planning sprints.  
**Last updated:** 29 March 2026

**Use with:** [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md) (who does what), [GOLDEN_PATH_AUDIT.md](./GOLDEN_PATH_AUDIT.md) (core file map), [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md), [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md).

---

## 1. Current state (honest baseline)

| Area | Observation |
|------|-------------|
| **Surface count** | Many HTML apps (`public/*.html`) — strong capability, high cognitive load without a single “job” narrative per visit. |
| **Navigation** | `unified-nav-header.js` gives consistency; **Main** vs **More tools** is the right split — worth reinforcing in page chrome and onboarding. |
| **Visual system** | Multiple overlapping CSS layers (`iterum-brand-kit`, design-system variants, notebook themes, etc.). Risk: inconsistent spacing, type scale, and card patterns between pages. |
| **Workflow story** | [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md) already describes paths; **UI does not always surface “you are in step X of Y”** on key journeys (setup → project → vendors → ingredients → recipes → menu). |
| **Roles** | `user-role-setup.js` + dashboard layout flags exist — **good foundation**; not every page reflects role (e.g. line vs lead) equally. |
| **Mobile vs web** | `mobile-compliance.html` vs `dashboard.html` — professional feel requires **shared language** (labels, success states, project context) across both. |

**North star:** A user opens the app for a **specific job** (open the kitchen, cost a menu, log compliance) and gets **clear hierarchy**, **predictable chrome**, and **next-step guidance** without hunting the sidebar.

---

## 2. Principles (decision rules)

1. **Workflow over features** — Prefer “Complete opening checklist” over a flat list of tools; prefer **guided sequences** on high-traffic paths.
2. **One visual system** — One primary token source (spacing, radius, type, semantic colors); retire or quarantine experimental themes from default loads.
3. **Role-visible, not role-noisy** — Hide or soften controls that a role cannot use; never show a dead end without explanation.
4. **Professional = calm + dense options** — Reduce emoji density in production nav where stakeholders expect sobriety; keep warmth in marketing/empty states if desired.
5. **Measure by tasks** — Roadmap milestones tie to [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) and pilot scripts, not “redesign complete.”

---

## 3. Phased progression (recommended order)

Work **top to bottom**; later phases assume earlier ones are in motion.

### Phase A — Foundation (design system contract)

**Goal:** Any new or touched page looks like the same product.

| # | Change | Outcome |
|---|--------|---------|
| A1 | **Inventory CSS entry points** — List which stylesheets each major template loads (`dashboard`, `menu-builder`, `recipe-developer`, `mobile-compliance`, `vendor-management`, `ingredients`). | Spreadsheet or short doc: “canonical stack” vs “legacy.” |
| A2 | **Declare a canonical stack** — e.g. `iterum-brand-kit.css` + one layout shell (`header-universal` / sidebar) + **one** component layer (`iterum-design-system` or `iterum-unified-colors` — pick one primary). | New pages copy the same `<link>` block. |
| A3 | **Quarantine non-default themes** — Notebook / vintage / alternate themes behind a flag, dev-only URL, or “experimental appearance” setting — not default on pilot sites. | Fewer conflicting variables and contrast surprises. |
| A4 | **Token checklist** — Document `--brand-*` (or chosen tokens) for: page background, surface/card, border, primary text, muted text, primary CTA, danger/success. | Designers and devs share one reference. |

**Exit criteria:** Golden-path pages (setup, dashboard, vendors, ingredients, recipe library, menu builder, mobile compliance) load the **same** baseline CSS set; no page adds a one-off “full alternate theme” without review.

---

### Phase B — Information architecture and chrome

**Goal:** Users always know **where they are**, **which project**, and **what to do next**.

| # | Change | Outcome |
|---|--------|---------|
| B1 | **Persistent context bar** — Active project name + role (or scope) visible on every authenticated app page (same component as dashboard chip where possible). | Fewer “wrong project” mistakes. |
| B2 | **Breadcrumbs or page intent** — On deep tools (imports, spec library, equipment), one line: “You are in: Menu & costing → Bulk import.” | Orientation without reading the whole sidebar. |
| B3 | **Align naming** — Pick “Project” vs “Workspace” per [ICP / SOURCE_OF_TRUTH](./SOURCE_OF_TRUTH.md) and use consistently in headers, setup, and project hub. | Less executive confusion. |
| B4 | **Sidebar grouping audit** — Map each link to a **workflow bucket** (Daily ops, Menu & recipes, Purchasing, Admin). Adjust order to match frequency by role (may require role-specific order later). | Sidebar reads as a checklist of jobs, not a directory. |

**Exit criteria:** New user test: “Where am I and what project is this?” answerable in under five seconds on any core page.

---

### Phase C — Role-based workflow surfaces

**Goal:** Default landing and **first actions** match the job title.

| # | Change | Outcome |
|---|--------|---------|
| C1 | **Landing after auth** — Already role-influenced via setup; validate **employee_line** lands on compliance-first path vs lead on dashboard/hub. | Matches [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md) §C. |
| C2 | **Dashboard as mission control** — Cards ordered by role; each card has a **primary action** + optional secondary link (pattern: title → one sentence → CTA). | Less “wall of equal buttons.” |
| C3 | **Cross-links between paired flows** — e.g. ingredient row → vendor override hint ([GOLDEN_PATH_AUDIT](./GOLDEN_PATH_AUDIT.md) slice 2); menu builder → recipe library when a dish is missing. | Fewer dead ends. |
| C4 | **Manager vs team visibility** — Patterns like dual shift notes (daily vs manager handoff) extend to **other** sensitive areas only where product agrees (document in ROLES doc). | Consistent trust model. |

**Exit criteria:** [ROLES_AND_PERMISSIONS.md](./ROLES_AND_PERMISSIONS.md) updated with “default first screen” and “hidden modules” per role; QA workflow includes one path per role.

---

### Phase D — Page-level professional polish (high-traffic first)

**Goal:** Screens stakeholders demo look **intentional**, not “internal tool only.”

Priority order (suggested):

1. `signin.html` / `setup.html` / `dashboard.html`
2. `mobile-compliance.html`
3. `menu-builder.html` / `recipe-developer.html` / `recipe-library.html`
4. `vendor-management.html` / `ingredients.html`
5. `project-hub.html`

| # | Change | Outcome |
|---|--------|---------|
| D1 | **Typography scale** — H1/H2/body/caption consistent; limit all-caps except true labels. | Calmer, more “product” less “template.” |
| D2 | **Table and form density** — Align padding, row height, and header stickiness on data-heavy pages. | Faster scanning for purchasing and menu work. |
| D3 | **Empty and loading states** — Shared components: what to do when no project, no data, or sync pending ([empty-states.js](../public/assets/js/empty-states.js) patterns where they exist). | Fewer blank rectangles. |
| D4 | **Modal and toast consistency** — Same corner radius, z-index, and focus trap behavior. | Accessibility and trust. |
| D5 | **Iconography** — Prefer **Font Awesome** (or one set) over mixing with emoji in **production** nav labels; optional emoji in dropdown categories until replaced. | More boardroom-safe. |

**Exit criteria:** Pilot [PILOT_ACCEPTANCE_CRITERIA_WEB.md](./PILOT_ACCEPTANCE_CRITERIA_WEB.md) (if used) passes visual/UX items for the above pages.

---

### Phase E — Deep workflow packaging (optional, larger lifts)

**Goal:** Multi-step jobs feel like **one flow**, not three bookmarks.

| # | Change | Outcome |
|---|--------|---------|
| E1 | **Guided “New menu cycle”** — Wizard or checklist spanning import → attach recipes → cost review → publish snapshot. | Matches how GMs think. |
| E2 | **Opening / closing checklist** — Unified definition of “shift” with calendar + dashboard + mobile reading same definitions where possible. | One truth for audits. |
| E3 | **Notifications / digest** — What must be seen before next service (stub: dashboard “attention” strip fed by failed checks, missing costs, etc.). | Moves from passive storage to operational system. |

**Exit criteria:** At least one packaged workflow shipped with analytics or completion tracking (even local-only counts).

---

## 4. Anti-patterns to avoid

- Adding a **new global CSS file** per feature without reconciling to Phase A.
- **Duplicating** the same workflow copy in 5 HTML files — centralize strings or a small shared copy module.
- Redesigning **low-traffic** pages before golden path pages pass Phase D.
- **Hiding** critical compliance actions behind “More tools” without a dashboard or mobile shortcut.

---

## 5. How to run this as a program

| Cadence | Activity |
|---------|----------|
| **Weekly** | Pick 1–2 items from the current phase; ship behind feature flags only if needed. |
| **Per release** | Update [QA_FEATURE_TEST_WORKFLOW.md](./QA_FEATURE_TEST_WORKFLOW.md) with any new default paths. |
| **Monthly** | Re-read Phase A stack — prevent stylesheet creep. |

**Suggested owner split:** Design + PM = Phases A–B narrative and tokens; Eng = implementation order and regression; Ops/Pilot = Phase D acceptance on real venues.

---

## 6. Revision log

| Date | Change |
|------|--------|
| 2026-03-29 | Initial roadmap from full-app UI/workflow review. |
| 2026-03-29 | **Phases A–D (first pass) shipped in repo:** canonical CSS + `CSS_CANONICAL_STACK.md`; sidebar buckets + nav context bar + breadcrumbs (`data-iterum-breadcrumb`); `employee_line` post-auth → shift tools; ingredients ↔ vendor overrides link; recipe library → menu builder banner; dashboard primary card for line; experimental nordic/dark removed from default golden-path loads. |
| 2026-05-09 | **T1 — vendor + ingredients Phase D:** vendor-management hero recolored from dark navy/purple to calm brand light; H1 size on canonical scale; emoji removed from production chrome (hero, quick cards, stat cards, bulk-actions); ingredients quick-action buttons de-gradiented and emoji-free; both pages get `data-iterum-breadcrumb`; vendor → ingredients workflow banner added. See [briefings/PERSONA_HANDOFF_LOG.md](./briefings/PERSONA_HANDOFF_LOG.md). |
| 2026-05-10 | **Crowd Manager (FP-250) checklist:** new daily compliance form in mobile Checks tab with typed e-signature + attestation + timestamp; persisted to `localStorage` per project per day and to Firestore `projects/{pid}/checklists/` (templateId `crowd_manager_fp250`); calendar day-details surfaces signed entries with Yes/No status. Mirrors MA DFS form FP-250 (527 CMR 1.00 §20.1.5.6.4). See [briefings/PERSONA_HANDOFF_LOG.md](./briefings/PERSONA_HANDOFF_LOG.md). |
| 2026-05-10 | **Bar drink drafts (phone capture → web review):** admin-only Quick-add drink form on mobile Bar tab saves to `projects/{pid}/snapshots/bar_drink_drafts` as `status: 'in_progress'`; new dashboard card lists drafts with Publish (pushes to `bar_line_pack.drinks[]`) / Delete / Refresh; one-click **Import Wusong sample** seeds 11 cocktails (transcribed from PDF). No new Firestore rules. See [briefings/PERSONA_HANDOFF_LOG.md](./briefings/PERSONA_HANDOFF_LOG.md). |
| 2026-05-10 | **Bar checklists (opening / midday / closing / station stock):** admin dashboard card publishes `bar_checklist_pack`; mobile Bar tab lists all four with **Done** + **Need** per line; **Need** (signed in) appends `(Bar · …)` lines to user Prep (opening/midday/closing) or Stock (station stock) via existing Lists-tab Firestore notes. Daily UI state in `localStorage` (`done` / `need` maps). **Import sample** seeds generic-bar starter. See [briefings/PERSONA_HANDOFF_LOG.md](./briefings/PERSONA_HANDOFF_LOG.md). |
| 2026-05-11 | **ID quick reference (21+ / 18+) on phone Hub + Bar:** calm card at the top of Hub and Bar tabs shows today plus "born on or before" cutoffs for 21+ and 18+; computed locally on each tab activation; leap-day-safe (Feb 29 clamps to Feb 28 of the destination year). Pure client-side, no Firestore. See [briefings/PERSONA_HANDOFF_LOG.md](./briefings/PERSONA_HANDOFF_LOG.md). |

When golden path or nav structure changes, update **§3 Phase B** and [USER_WORKFLOW_GUIDE.md](./USER_WORKFLOW_GUIDE.md) together.
