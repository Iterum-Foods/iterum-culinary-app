# Team action plan — Iterum Culinary

**Purpose:** One backlog for leadership + engineering; **execution and coordination live in Cursor** (Agents, `@` file context), not a separate PM tool.  
**Living status:** Edit `Status` checkboxes here as work completes; mirror big milestones in [EXEC_CHECKLIST_AND_NEXT_STEPS.md](./EXEC_CHECKLIST_AND_NEXT_STEPS.md).  
**Last updated:** March 2026  

---

## How to run this plan in Cursor only

1. **Tags = which Agent persona to use** — `@CEO`, `@CTO`, etc. match the role blocks in [LEADERSHIP_ROLE_ASSIGNMENTS.md](./LEADERSHIP_ROLE_ASSIGNMENTS.md). Open **Agent** (`Ctrl+I` / `Cmd+I`), use **one thread per persona** (or `@`-mention a **manual persona rule** if you created one under `.cursor/rules/`). Project rule [.cursor/rules/iterum-shared-context.mdc](.cursor/rules/iterum-shared-context.mdc) already applies to every chat.
2. **Ping context with `@files`** — In that Agent thread, attach what the task needs, e.g. `@TEAM_ACTION_PLAN.md`, `@EXEC_CHECKLIST_AND_NEXT_STEPS.md`, `@docs/DATA_ACCESS_INVENTORY.md`, or specific code files.
3. **Use task IDs** — Example prompt: *“Complete **A3**: executive sign-off wording; update EXEC_CHECKLIST row; cite evidence from…”* so Cursor searches and edits the right doc.
4. **Handoffs** — When another role owns the next step, start a **new** Agent thread with the other persona (or paste a 3-line state snapshot into the next thread). Cursor threads do not share memory across personas.
5. **No external tool required** — You can still copy outputs to email later; the **system of record for assignments** is this file + checklist in git.

### Tag → Cursor Agent persona

| Tag | Role | In Cursor |
|-----|------|-----------|
| `@CEO` | Chief Executive | Agent thread + CEO role block from `LEADERSHIP_ROLE_ASSIGNMENTS.md` |
| `@COO` | Chief Operating | Agent thread + COO role block |
| `@CTO` | Chief Technology | `@iterum-persona-cto` or CTO role block |
| `@PM` | Product | PM role block; if no hire yet, use **COO** thread |
| `@ENG` | Engineering | CTO thread for technical work, or any Agent with `@` on repo files |
| `@PLATFORM` | DevOps / platform | CTO thread if unstaffed |
| `@QA` | QA / SDET | CTO + QA role block, or dedicated QA thread |
| `@UX` | Design | UX role block when staffed |
| `@CS` | Customer success / pilots | CS role block when staffed |
| `@SALES` | Commercial / pilot lead | CEO or COO thread if unstaffed |
| `@SEC` | Security / privacy advisor | SEC or CTO role block |

---

## Connect real names to Agents (Cursor)

Cursor does **not** have a company directory or “assign this Agent to employee X” in the cloud. The link is **your roster in git + how you name each local Agent thread**.

1. **Roster (single source of truth)** — Fill **[LEADERSHIP_ROLE_ASSIGNMENTS.md](./LEADERSHIP_ROLE_ASSIGNMENTS.md)** → section *“Names and dates (fill in)”* with each **role → real person**. Everyone on the team uses the same file after `git pull`.
2. **Rename each Agent chat** — In the **Chat / Agent** sidebar, open the thread you use for e.g. CTO work. **Rename** it to something humans recognize, e.g. `Alex Martinez · CTO` or `Iterum — CTO (Alex)`. (Exact UI: right-click the session in the sidebar or use the title/edit control if your Cursor build shows one; titles also often follow the first message, so you can start the thread with a clear first line.)
3. **Pin the persona once per thread** — First user message in that thread: paste the matching **role block** from `LEADERSHIP_ROLE_ASSIGNMENTS.md` (CEO / CTO / COO / …). Optional second line: `Human owner for this thread: Alex Martinez.` That makes history obvious when you scroll back.
4. **Optional: manual project rules per person** — If one human always plays CTO, their `.cursor/rules/iterum-persona-cto.mdc` can start with one line: `Iterum CTO persona — human lead: Alex Martinez.` Then `@iterum-persona-cto` in chat pulls both context and name.
5. **Optional: subagents** — In `.cursor/agents/*.md`, put the human in the **description** (what Cursor shows when choosing tools), e.g. `description: Technical lead Alex M. — Firebase, data-access, CI.` The `name` stays a short slug (`iterum-cto`).
6. **Multiple humans, same repo** — Each laptop has its **own** Agent history. The **Names** table in git is how you agree who owns each tag; each person still creates their own threads or uses their own subagent invokes.

**Summary:** **Git = who is CEO/CTO/… in real life.** **Cursor = rename the chat + optional “Human owner: …” line + optional rule/subagent description.** There is no extra “connect names” setting screen in Cursor beyond that.

### Test that “COO” loads in Cursor (not the text `@COO` in tables)

The tables use **`@COO` only as a label** (Slack-style). Cursor’s `@` menu does **not** resolve the two letters `COO` unless you point at a **file or rule**.

1. Open **Agent** (`Ctrl+I` / `Cmd+I`).
2. In the input box, type **`@`** and start typing **`iterum-persona-coo`** (or **`coo`**).
3. Pick **Project Rule** / **`iterum-persona-coo`** so that rule’s body is included in context.
4. Send a short test, e.g.  
   `Confirm you are operating as Iterum COO per this rule. In one sentence, what is your scope? Name two items you own in TEAM_ACTION_PLAN stream A.`
5. You should get a COO-framed answer (sign-off packaging, exec rhythm—not code-first CTO tone).

Rule file: [.cursor/rules/iterum-persona-coo.mdc](.cursor/rules/iterum-persona-coo.mdc) (loaded **only** when you `@`-mention it; shared context still comes from `iterum-shared-context.mdc`).

### CEO persona (direct to you as owner)

Use **`@iterum-persona-ceo`** in Agent when **you** are the founder/CEO and want advice **to you** in second person (not a detached “the CEO” narrator). Rule: [.cursor/rules/iterum-persona-ceo.mdc](.cursor/rules/iterum-persona-ceo.mdc).

Use **`@iterum-persona-cto`** for technical / Firebase / rules / data-access work. Rule: [.cursor/rules/iterum-persona-cto.mdc](.cursor/rules/iterum-persona-cto.mdc).

---

## Stream A — Close P0 (trust)

### A1 — Prod smoke: who does what in Cursor

**You (human)** run the clicks in a real browser; Agents **draft checklists, interpret results, and update docs** when you paste outcomes.

| Phase | Cursor rule(s) to `@`-mention | Human |
|-------|-------------------------------|--------|
| **1. Record file** | `@iterum-persona-coo` or `@iterum-persona-cto` + `@TEAM_ACTION_PLAN.md` | Canonical smoke sheet: **[docs/A1_P0_PROD_SMOKE_RECORD.md](./docs/A1_P0_PROD_SMOKE_RECORD.md)** — edit in Cursor or browser. |
| **2. Execute smoke** | (optional) `@iterum-persona-ceo` if you want go/no-go language while you test | Open prod in browser; fill **Run metadata** + **Smoke steps** + **Result** in that doc. |
| **3. If anything fails** | `@iterum-persona-cto` + `@EXEC_CHECKLIST_AND_NEXT_STEPS.md` + `@docs/A1_P0_PROD_SMOKE_RECORD.md` + paste **exact** error/steps | CTO Agent triages against rules/storage paths. |
| **4. Mark A1 done** | `@iterum-persona-coo` or `@iterum-persona-ceo` | Set **Overall** = GO in the record; set **A1** below to `[x]`; refresh **EXEC_CHECKLIST** exec-sign-off note. |

**Primary production URL (customer / operators):** [https://iterum-culinary-app.vercel.app/](https://iterum-culinary-app.vercel.app/) — run **A1** smoke against this host.  
**Alternate (Firebase Hosting mirror, if you still deploy there):** `https://iterum-culinary-app2.web.app` — use for parity checks only if both are kept in sync.

**Minimal smoke checklist (human in browser)**

1. **Load** — Site loads (no generic 404 on entry you use for customers).  
2. **Sign-in** — Authenticate with a real test account; session sticks after refresh once.  
3. **Menu / project data** — Open main operator surface (e.g. dashboard or menu builder); data appears or empty state is coherent; no persistent “permission denied” or broken sync spinner (note exact message if yes).  
4. **Recipe photo** — Upload a small image **or** open a recipe that already has a photo; image renders. Failure here often means **Storage rules** or path mismatch.

**Copy-paste to COO Agent (step 1)**

```text
@iterum-persona-coo @TEAM_ACTION_PLAN.md
Output a one-page A1 smoke record I can fill in: table columns Step | Expected | Pass/Fail | Notes | Date | Tester. Use the minimal checklist in TEAM_ACTION_PLAN (Stream A / A1). No code—execution template only.
```

---

| ID | Action | Owner tag | Also tag | Status | Notes |
|----|--------|-----------|----------|--------|-------|
| **A1** | Prod smoke: sign-in, menu sync, recipe photo on live site | `@CEO` or delegate | `@COO` `@CTO` | `[~]` | Record: [docs/A1_P0_PROD_SMOKE_RECORD.md](./docs/A1_P0_PROD_SMOKE_RECORD.md) — mark `[x]` when table + **GO** filled. |
| **A2** | Package brief for CEO: deploy date, env, what was verified | `@COO` | `@CTO` | `[ ]` | Paste summary into CEO Agent thread or this repo |
| **A3** | Executive sign-off: “Rules deployed + spot-check OK” | `@CEO` | `@COO` | `[ ]` | Update checklist row + date |
| **A4** | If users report sync/photo issues post-deploy: triage + comms | `@COO` | `@CTO` `@ENG` | `[ ]` | Only if support noise |

---

## Stream B — Data contract (week 2–3)

| ID | Action | Owner tag | Also tag | Status | Notes |
|----|--------|-----------|----------|--------|-------|
| **B1** | Route **checklists** *or* **recipe library snapshots** through shared data-access pattern **or** document exceptions | `@CTO` | `@ENG` | `[ ]` | Aligns with `project-data-access.js` direction |
| **B2** | Draft **source of truth** one-pager (recipes, menus, vendors: local-first vs cloud-first, sync behavior) | `@CTO` | `@PM` `@ENG` | `[ ]` | `@COO` thread if no `@PM` |
| **B3** | Review B2 with leadership; resolve open questions | `@COO` | `@CEO` `@CTO` | `[ ]` | Async in Cursor + checkbox here |

---

## Stream C — Product framing (week 4)

| ID | Action | Owner tag | Also tag | Status | Notes |
|----|--------|-----------|----------|--------|-------|
| **C1** | **ICP lock** for next 90 days (multi-unit vs single venue vs consultant) — decision memo | `@COO` | `@CEO` | `[ ]` | `@CEO` signs |
| **C2** | **Acceptance criteria** for “one manager, multiple restaurants, shared vendors, comparable pricing” | `@PM` | `@COO` `@CTO` | `[ ]` | Testable bullets |
| **C3** | **Vendor model sketch** (directory, site/location, price rows) | `@CTO` | `@PM` | `[ ]` | After C1/C2 direction |
| **C4** | **Epic breakdown + engineering estimate** for P1 | `@CTO` | `@PM` `@ENG` | `[ ]` | Only after C1+C2 locked |
| **C5** | **Pilot candidate** shortlist (optional) | `@COO` | `@SALES` `@CEO` | `[ ]` | For design validation |

---

## Stream D — Quality & velocity (parallel, lower urgency)

| ID | Action | Owner tag | Also tag | Status | Notes |
|----|--------|-----------|----------|--------|-------|
| **D1** | Expand E2E: **one authenticated** critical path (env: test user or emulator) | `@QA` | `@CTO` `@ENG` | `[ ]` | See `.github/workflows/e2e.yml` |
| **D2** | Phased plan to split largest pages (e.g. menu builder) into modules | `@CTO` | `@ENG` | `[ ]` | Plan only first |
| **D3** | Consolidate **Firebase deploy / ship** runbook (one path) | `@PLATFORM` | `@CTO` | `[ ]` | e.g. commit under `docs/` |

---

## Stream E — When staffed (specialty)

| ID | Action | Owner tag | Also tag | Status | Notes |
|----|--------|-----------|----------|--------|-------|
| **E1** | UX pass on multi-restaurant + vendor flows (wireframes / flows) | `@UX` | `@PM` `@CTO` | `[ ]` | When `@UX` exists |
| **E2** | Pilot onboarding script + training outline | `@CS` | `@COO` | `[ ]` | When pilot exists |
| **E3** | Security/privacy checkpoint post–first paid pilot | `@SEC` or advisor | `@CTO` | `[ ]` | Use `@CTO` if no advisor |

*(Park Stream E until roles exist.)*

---

## Active product workflows (delegate in Cursor)

| Workflow | Doc | Lead tags |
|----------|-----|-----------|
| **Sign-in UI redesign** | [docs/workflows/WF_SIGNIN_UI_REDESIGN.md](./docs/workflows/WF_SIGNIN_UI_REDESIGN.md) | S1 `@CEO`/`@COO` → S2 `@PM`/`@COO`/`@UX` → S3 `@CTO` → S4 `@ENG`/`@CTO` → S5 `@CEO`/`@PM` |

Open that file for **copy-paste prompts** per phase (`@iterum-persona-ceo`, `@iterum-persona-coo`, `@iterum-persona-cto`, etc.).

---

## Dependencies (do not skip)

```text
A1 → A2 → A3
B1, B2 → B3
C1, C2 → C3 → C4
Deploy (done) → A* → B* → C* without blocking D*
```

---

## Copy-paste: first prompt in a Cursor Agent (example)

Use in the **CTO** Agent after `@TEAM_ACTION_PLAN.md` `@EXEC_CHECKLIST_AND_NEXT_STEPS.md`:

```text
Work task B1 from TEAM_ACTION_PLAN.md. Explore the repo for checklist + recipe library snapshot sync; align with project-data-access.js or document why not. Propose minimal code/doc changes and update the B1 Status in TEAM_ACTION_PLAN.md when done.
```

*(Swap `B1` and persona for other rows.)*

---

*Tags in tables are **role names**, not Cursor `@code` references. In chat, `@`-mention **files** (e.g. `@TEAM_ACTION_PLAN.md`); use the **right Agent thread** for the role.*
