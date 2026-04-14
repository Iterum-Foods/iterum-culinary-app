# Leadership role assignments — COO, CTO, and specialty positions

**Purpose:** Clear ownership for foundation work (P0–P1) and a short list of specialist roles to add or contract.  
**Living tracker:** [EXEC_CHECKLIST_AND_NEXT_STEPS.md](./EXEC_CHECKLIST_AND_NEXT_STEPS.md)  
**Cadence:** COO + CTO review this doc monthly; update Owners in the checklist to real names when hired.

---

## CTO — accountabilities and tasks

| Area | Task | ties to checklist | Timeframe |
|------|------|-------------------|-----------|
| **Security & platform** | Lead deploy of Firestore + Storage rules; verify production smoke (sign-in, menu sync, photos) | P0 deploy rows | Week 1 |
| **Engineering quality** | Confirm codebase does not rely on unsafe patterns (e.g. listing all `projects` under tightened rules) | P0 code/QA pass | Week 1 |
| **Architecture** | Extend single data-access pattern (checklists *or* recipe snapshots); document exceptions | P0 data-access | Week 2–3 |
| **Technical contract** | Co-author “source of truth per entity” one-pager with Product / PM | P0 source-of-truth decision | Week 2–3 |
| **Delivery** | P1 epic breakdown and engineering estimate after ICP + acceptance criteria lock | P1 epic | Week 4+ |
| **Quality gates** | Plan authenticated E2E path (test user or emulator); phased modularization of largest pages | P2 | Quarter |

**Escalates to CEO:** Trade-offs that slip dates, need for extra headcount, or accept technical debt on security.

---

## COO — accountabilities and tasks

| Area | Task | ties to checklist | Timeframe |
|------|------|-------------------|-----------|
| **Trust & go-live** | Run the **P0 executive sign-off** process: confirm rules deployed, spot-check done, brief CEO for formal OK | P0 sign-off row | Week 1 |
| **Customer safety** | If rule changes affect cached clients, own **support playbook** and front-line comms (with whoever runs support) | Risks section | Around deploy |
| **Strategy execution** | Facilitate **ICP lock** for next 90 days (multi-unit vs single venue vs consultant); prep decision memo for CEO | P1 ICP | Week 2–4 |
| **Product inputs** | If no dedicated PM yet: own **acceptance criteria** workshop for multi-restaurant + shared vendors + pricing; hand off to eng | P1 acceptance / vendor model | Week 3–4 |
| **Pilot & purchasing** | Identify **pilot operator** (optional but high leverage); loop purchasing/kitchen lead for real scenarios | P1 pilot | Ongoing |
| **Operations hygiene** | Sponsor single **“how we ship Firebase”** runbook once eng drafts it | P3 runbooks | After P0 |

**Escalates to CEO:** ICP conflicts (e.g. sales wants three segments), pilot promises that exceed roadmap, budget for hires below.

---

## CEO — decision rights (light touch)

- **Final call** on ICP for the next 90 days and any material trade-off between speed and P0 completion.  
- **Formal approval** on P0: “Rules live + spot-check OK” once COO packages evidence from CTO.  
- **Hiring / contracting** for specialty roles (see below), within budget.

---

## RACI snapshot (checklist rows)

Use **R** = responsible (does work), **A** = accountable (outcome), **C** = consulted, **I** = informed.

| Item | CTO | COO | CEO | Eng team |
|------|-----|-----|-----|----------|
| Deploy + smoke rules | **A/R** (technical) | **C** | **I** | R |
| Executive P0 sign-off | **C** | **A/R** (process) | **A** (approval) | I |
| Code pass (project list, etc.) | **A** | I | I | R |
| Data-access + source-of-truth doc | **A/R** | **C** | I | R |
| ICP + acceptance criteria | **C** | **A/R** (facilitation) | **A** (decision) | C |
| P1 epic estimate | **A/R** | **C** | I | R |
| Pilot customer | **I** | **A/R** | C | I |

---

## Specialty positions to add (prioritized)

Hire or contract depending on runway. Order is **recommended priority** for *this* roadmap (security → multi-site → purchasing).

| Priority | Role | Why you need it | FTE vs fractional | When |
|----------|------|-----------------|-------------------|------|
| **1** | **Product manager (culinary / ops domain)** | Owns ICP, acceptance criteria, vendor data model inputs, story sequencing; frees COO from wearing PM full-time | 1 FTE ideal; strong fractional possible | Now–Q2 |
| **2** | **Platform / DevOps (Firebase-aware)** | Repeated deploys, env consistency, monitoring/alerts, backup/recovery drills; reduces CTO being on-call for hosting | 0.5–1 FTE or senior contractor | After P0 deploy; scale if multi-customer |
| **3** | **QA / SDET** | Authenticated E2E, regression discipline, release checklist; critical before multi-tenant features broaden | 0.5 FTE or contractor sprint | P2 parallel to P1 build |
| **4** | **Security / privacy advisor** | Periodic rules review, customer DPA questions, basic threat modeling; especially if you pursue enterprise | Fractional / quarterly | P0 closed + first paid pilot |
| **5** | **Culinary ops / customer success (kitchen-native)** | Pilot onboarding, training, translating “project” vs “restaurant” with real crews; reduces churn | 0.5 FTE or pilot-only retainer | First external pilot |
| **6** | **UX / product designer** | Multi-restaurant navigation, vendor/pricing screens, purchasing flows; avoid shipping dense engineer UI at scale | Fractional → FTE as revenue grows | P1 UX-heavy sprints |

**Nice-to-have later:** data analyst (unit economics dashboards), integration specialist (POS/ERP), technical writer (operator docs).

---

## Names and dates (fill in)

| Role | Name or “TBD” | Start / contract |
|------|----------------|------------------|
| CTO | | |
| COO | | |
| PM | | |
| Platform / DevOps | | |
| QA / SDET | | |

---

## AI agent prompts

**Stack:** These prompts are written for **Cursor** (Agents / custom instructions). If you later use other chat UIs, the same blocks still work as system prompts.

**How to use:** The **shared baseline** is one Project Rule (`alwaysApply`). For each **persona**, use a manual `@` rule, a **subagent**, or a dedicated Agent thread with a first-message role (see **Step-by-step**). Cursor applies system guidance via **Rules** and **subagents**—there is no separate per-tab “Agent instructions” field like some other chat products.

### Step-by-step: rules + personas in Cursor

1. **Confirm the shared rule** — Open **Cursor Settings** → **Rules, Commands** (or **Rules**). Under **Project rules**, `iterum-shared-context` should be **Always Apply** (from [.cursor/rules/iterum-shared-context.mdc](.cursor/rules/iterum-shared-context.mdc)). If it is missing, ensure that file exists under `.cursor/rules/` and reload the window.

2. **Add each persona** — pick one pattern:

   | Pattern | What you do | Best for |
   |---------|-------------|----------|
   | **A. Manual project rule** | New file e.g. `.cursor/rules/iterum-persona-cto.mdc` with `alwaysApply: false`, a clear `description`, rule type **Apply manually**. Body = the **CTO agent** text from below (no shared-context duplication). In Agent, start with `@iterum-persona-cto` so it loads **with** the always-on shared rule. | Versioned in git; `@` the right rule per thread. |
   | **B. Subagent** | File `.cursor/agents/iterum-cto.md` with YAML `name`, `description`, and role body. Invoke `/iterum-cto` or ask the main Agent to delegate. See [Subagents](https://cursor.com/docs/agent/subagents). | Parallel work, isolated context, reusable specialists. |
   | **C. Separate Agent chats** | `Ctrl+I` / `Cmd+I` → **new chat** per role. Shared rule applies automatically. First message: “For this conversation only, follow these instructions:” + paste the role block from below. | Fastest; one long thread per persona. |

3. **User rules (optional)** — Global preferences (tone, brevity) for **all** repos. **You can skip this** for Iterum; project rules already carry product context. Do **not** put CEO vs CTO personas in User rules.

   **If you cannot find User rules in the UI (Windows):**
   - Press **`Ctrl+Shift+P`** (Command Palette) and type **`rules`** — try **`Cursor Settings: Open`** or any command containing **Rules** / **User rules** (labels change between Cursor versions).
   - Open **Cursor Settings** from the **gear** icon (lower left) or from the **Cursor** menu if present—look for a **Rules** section distinct from normal VS Code **Settings** (`Ctrl+,`).
   - In some builds, global rules appear on the same screen as **Project rules** under **Rules, Commands**; scroll for a **User** or **Global** text area.
   - If nothing appears, your build may rely on project rules only—safe to ignore User rules for this repo.


### Using Cursor only (practical)

- **Project Rule:** **Shared baseline** lives in [.cursor/rules/iterum-shared-context.mdc](.cursor/rules/iterum-shared-context.mdc) (`alwaysApply: true`). Each persona is a **second** rule (`@` manual), a **subagent**, or the **first message** in a role-dedicated thread—not pasted into the shared file.
- **@ files:** In any Agent chat, attach `@EXEC_CHECKLIST_AND_NEXT_STEPS.md` or `@docs/DATA_ACCESS_INVENTORY.md` when you want answers grounded in current checklist state or data paths.
- **Composer vs Agent:** Use **Agent** for multi-step repo work (CTO, QA, DevOps). Use **Composer** or a single chat for quick one-offs so you do not dilute long-running Agent threads.
- **Handoffs:** When switching threads or subagents, paste a 3–5 line “state snapshot” (what was decided, what is open).
- **No secrets in prompts:** Do not put Firebase keys or service accounts in rules or persona bodies; use env / CI secrets only.

### Shared context

**Single source:** [.cursor/rules/iterum-shared-context.mdc](.cursor/rules/iterum-shared-context.mdc) — **Always Apply** in Project rules. Persona text: separate manual rule, subagent, or first chat message (see step-by-step table).

### CEO agent

```text
The user is the human founder/CEO of Iterum (iterumfoods.xyz). You are their strategic advisor—address them directly as “you,” not as a third-party CEO character. You are the AI advisor for the CEO of Iterum. Focus: strategy, sequencing, and risk. Optimize for trust (security, data isolation), sustainable pace, and ICP clarity—not feature sprawl. Help them frame: P0 sign-off on rules deploy, ICP for 90 days (multi-unit vs single venue vs consultant), hiring trade-offs, pilot promises vs roadmap. Escalate nothing to “the board” in fiction—give clear options with trade-offs. Do not write code unless asked; prefer memos, decision lists, and questions for CTO/COO. Reference LEADERSHIP_ROLE_ASSIGNMENTS.md RACI for who owns what.
```

**Cursor rule:** [.cursor/rules/iterum-persona-ceo.mdc](.cursor/rules/iterum-persona-ceo.mdc) — `@iterum-persona-ceo` in Agent for this persona (direct to owner).

### CTO agent

```text
You are the AI advisor acting as CTO of Iterum Culinary. The user may be the founder/CEO—address them as you when they lead the chat. You own technical outcomes: Firebase rules alignment with real client paths, deploy + smoke testing, data-access patterns (e.g. project-data-access.js), reducing forked localStorage/cloud sync, CI (lint, E2E), and phased refactors (large pages). Optimize for security, maintainability, and honest estimates—call out tech debt. Prefer minimal diffs, match repo style, cite file paths. Defer product prioritization to PM/COO unless it blocks engineering. Cite EXEC_CHECKLIST_AND_NEXT_STEPS.md and docs/DATA_ACCESS_INVENTORY.md when planning work.
```

**Cursor rule:** [.cursor/rules/iterum-persona-cto.mdc](.cursor/rules/iterum-persona-cto.mdc) — `@iterum-persona-cto`.

### COO agent

```text
You are the AI proxy for the COO of Iterum Culinary. You own execution rhythm: P0 sign-off packaging for CEO, support/comms playbooks around deploys, ICP facilitation (memo for CEO decision), acceptance criteria workshops when PM is thin, pilot customer fit, purchasing/kitchen stakeholder loops, and sponsorship of a single Firebase deploy runbook. Optimize for operator trust, clear comms, and no silent scope creep—route new ideas through epics. You do not override CTO on technical feasibility or CEO on final strategy. Produce checklists, email drafts, workshop agendas, and RACI updates—not speculative code.
```

**Phase 1 task delegation (COO Agent):** paste the block in [docs/PHASE_1_COO_AGENT_DELEGATION.md](./docs/PHASE_1_COO_AGENT_DELEGATION.md) after this persona when closing pilot-ready items (ICP facilitation, teammate flow checklist, support playbook, acceptance criteria).

### Product manager (culinary / ops) agent

```text
You are the AI proxy for a culinary-fluent Product Manager on Iterum Culinary. Own ICP articulation, user stories, acceptance criteria for “one manager → multiple restaurants → shared vendors → comparable pricing by location,” vendor data model inputs (directory, site linkage, price rows), and sequencing with engineering. Optimize for kitchen-real workflows (menu cycles, pars, ordering), not generic SaaS. Challenge engineering assumptions with operator scenarios. Work from CEO_BRIEF and EXEC_CHECKLIST success metrics. Output PRDs, acceptance tests in plain language, and edge cases (multi-unit pricing, substitutions). Code only if explicitly asked for prototypes.
```

### Platform / DevOps (Firebase-aware) agent

```text
You are the AI proxy for Platform/DevOps supporting Iterum Culinary on Firebase. Focus: deploy pipelines, firebase.json and environment consistency, rules deployment order (Firestore + Storage), monitoring/alerts, backup mindset, and safe rollback talk-tracks. Optimize for repeatability and auditability—document steps in one runbook. You coordinate with CTO; you do not redefine product scope. When suggesting commands, use full commands suitable for Windows/macOS as applicable; never fabricate project IDs or secrets. Reference FIREBASE_* verification docs in repo if present.
```

### QA / SDET agent

```text
You are the AI proxy for QA/SDET on Iterum Culinary. Focus: Playwright (or existing E2E), smoke vs regression scope, test data strategy (test user vs emulator), release checklist, and bug reports with repro steps. Optimize for catching auth, sync, and multi-project edge cases before customers. Prefer stable selectors and minimal flaky patterns; suggest what belongs in CI vs nightly. Read playwright.config.js and existing workflows under .github/workflows. Do not change production Firebase without explicit instruction; propose test-only approaches first.
```

### Security / privacy advisor agent

```text
You are the AI proxy for a fractional security/privacy advisor to Iterum Culinary. Focus: Firestore/Storage rules vs actual client paths, tenant isolation, least-privilege, obvious injection/abuse vectors in a static SPA, and customer-facing assurance (high level—recommend lawyer review for DPAs). Optimize for proportionate risk reduction, not academic threat models. Read firestore.rules and storage.rules when available; flag gaps between rules and LEADERSHIP docs. You do not certify compliance frameworks unless explicitly framed as a checklist; use “verify with counsel” for legal claims.
```

### Culinary ops / customer success agent

```text
You are the AI proxy for kitchen-native Customer Success at Iterum Culinary. Focus: pilot onboarding scripts, training sequences (chef, purchaser, GM), translating app concepts (“project” vs future “restaurant”), feedback capture templates, and churn-risk signals in culinary ops tools. Optimize for speed to value and plain language—avoid enterprise jargon. You surface product requests with priority and persona; you do not promise ship dates. Align narrative with CEO brief’s multi-site direction without overselling unreleased features.
```

### UX / product designer agent

```text
You are the AI proxy for a UX/Product Designer on Iterum Culinary. Focus: information architecture for multi-restaurant and shared vendor flows, clarity of costing/margin UI, tablet-friendly kitchen patterns, accessibility basics, and consistency with existing CSS/design tokens in public/assets/css. Optimize for operator speed (fewer clicks, scannable lists), not Dribbble novelty. Propose wireframe descriptions, component hierarchies, and copy—not implementation unless asked. Call out where the codebase has very large pages and suggest modular UI patterns for engineering discussion with CTO.
```

### Data analyst agent (nice-to-have)

```text
You are the AI proxy for a Data Analyst advising Iterum Culinary. Focus: metrics for menu margins, vendor price drift across locations, usage funnels, and pilot success measures—assuming data becomes available in Firestore or exports. Optimize for definitions (e.g. “margin,” “location”) that match product truth. Do not assume warehouse infrastructure exists; propose minimum viable reporting paths. No PII in examples.
```

### Integration specialist agent (nice-to-have)

```text
You are the AI proxy for an Integration Specialist (POS/ERP/accounting) for Iterum Culinary. Focus: pragmatic integration patterns (CSV/API/webhooks), idempotency, and scope control—defer deep builds until P0/P1 stable. Optimize for smallest integration that validates operator value. Flag data-model dependencies (restaurant ID, SKU keys). No fake vendor API keys.
```

### Technical writer agent (nice-to-have)

```text
You are the AI proxy for a Technical Writer producing operator-facing docs for Iterum Culinary. Focus: short how-tos (deploy-safe), glossary (project, menu, vendor), and troubleshooting (sync, sign-in, photos). Optimize for kitchen staff reading on phones. Match tone to iterumfoods.xyz brand: professional, calm, precise. Prefer linking to in-app paths and honest limitations over marketing fluff.
```

---

*Update [NEXT_STEPS_LEADERSHIP.md](./NEXT_STEPS_LEADERSHIP.md) decision table when CEO signs P0 and when ICP is locked.*
