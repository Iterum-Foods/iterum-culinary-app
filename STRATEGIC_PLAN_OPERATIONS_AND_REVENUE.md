# Strategic plan — Operational readiness & revenue path

**Audience:** Full team + CEO  
**Owner (process):** COO (facilitation, packaging); **decisions:** CEO  
**Companion docs:** [CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md](./CEO_BRIEF_CURRENT_STATE_AND_PRIORITIES.md) · [EXEC_CHECKLIST_AND_NEXT_STEPS.md](./EXEC_CHECKLIST_AND_NEXT_STEPS.md) · [TEAM_ACTION_PLAN.md](./TEAM_ACTION_PLAN.md) · [NEXT_STEPS_LEADERSHIP.md](./NEXT_STEPS_LEADERSHIP.md)  
**Last updated:** March 2026  

---

## 1. Purpose

Align everyone on a **single path** from “product works in production” to **repeatable revenue**: pilots that prove value, a clear **ideal customer**, pricing posture, and **metrics** we will not argue about in the room. This plan does **not** replace the CEO’s strategy; it **sequences** engineering, go-to-market, and operations so we do not chase features before the base is trustworthy.

---

## 2. North star (12–18 months)

**Operators run menus and food economics in Iterum Culinary with confidence—across venues where applicable—and pay us because the product saves time and improves margin visibility.**

Revenue follows **trust** (data integrity, sign-in, sync) and **proof** (pilots with named success criteria), not feature count alone.

---

## 3. Where we are now (one paragraph)

The app is **live** (Firebase auth, hosting), **feature-rich** for recipes, menus, costing, vendors, and kitchen workflows. Leadership has prioritized **security rules**, a **single data contract** across local and cloud, and **analytics definitions** (project vs future site IDs, margin/tax clarity, pilot signals—see [Executive checklist — Leadership log](./EXEC_CHECKLIST_AND_NEXT_STEPS.md)). **Revenue is not yet systematic** until we pair a hardened base with **paid pilots or subscriptions** and a **chosen ICP**.

---

## 4. Strategic pillars

| Pillar | Intent | Owner (typical) |
|--------|--------|------------------|
| **Trust & operations** | Production smoke, rules deployed, exec sign-off on P0; predictable deploys | CTO + Eng / Ops |
| **Clarity of value** | ICP lock (multi-unit vs single venue vs consultant); messaging matches product truth | CEO + COO / PM |
| **Proof** | 1–3 paid or structured pilots with success metrics (adoption, costing completeness, margin before/after—aligned with Leadership log 2026-03-29) | COO + Sales + CS |
| **Monetization** | Simple pricing (seats, venues, or tiered feature bundles)—CEO approves | CEO + Finance |
| **Velocity without chaos** | New work through epics; no silent scope creep | COO + Eng lead |

---

## 5. Phased roadmap (strategic, not a task list)

### Phase A — **Operational** (weeks 0–4)

**Goal:** The product is **safe and demonstrable** in production for a serious prospect.

- Complete P0 checklist items: rules verified, smoke record **GO**, executive sign-off where applicable ([EXEC_CHECKLIST](./EXEC_CHECKLIST_AND_NEXT_STEPS.md), [A1 smoke record](./docs/A1_P0_PROD_SMOKE_RECORD.md)).
- Single **deploy / ship** path documented (runbook—see TEAM_ACTION_PLAN Stream D).
- **Exit:** CEO or delegate can say “we can put a paying pilot on this stack without apologizing for auth or data leaks.”

### Phase B — **ICP & offer** (parallel, weeks 2–8)

**Goal:** One primary buyer and one **offer** (pilot package or annual) everyone can describe in one sentence.

- CEO decides **ICP for the next 90 days** (documented in checklist / NEXT_STEPS).
- Draft **pricing hypothesis**: e.g. per-seat/month, per-location, or pilot fee + conversion to annual—**numbers** owned by CEO/Finance.
- **Exit:** Sales deck / one-pager + contract or order form template for pilot.

### Phase C — **Revenue pilots** (weeks 4–12)

**Goal:** **Paid or contractually committed** usage that validates willingness to pay and surfaces product gaps.

- 1–3 customers with **written success criteria** (menus saved, costing completeness, margin story—use definitions in Leadership log).
- **Support rhythm:** who answers email/Slack, response-time expectation (COO playbooks).
- **Exit:** Reference story + at least one renewal or expansion conversation; learn CAC rough order-of-magnitude.

### Phase D — **Repeatable revenue** (month 4+)

**Goal:** Repeatable **onboarding**, **billing**, and **renewal** motion—not one hero deal.

- Standard onboarding checklist (CS + docs).
- Product roadmap driven by **paid** feedback and retention, not only internal ideas.
- **Exit:** Predictable monthly or annual revenue line with known churn and support load.

---

## 6. Revenue model (hypothesis — CEO to confirm)

Present **one** primary model to the team; adjust after pilot learning.

| Model | Fits when | Risk |
|-------|-----------|------|
| **Per seat / user / month** | Teams and consultants | Needs clear “seat” definition in app |
| **Per location / venue** | Multi-unit operators | Aligns with roadmap (project → site ID) |
| **Pilot fee → annual** | Early enterprise | Requires clear pilot scope and success gate |

Avoid **free-forever** for serious operators if the goal is revenue; use **time-bound trials** or **pilot credits** instead.

---

## 7. Metrics we report to CEO (monthly)

Use the same definitions as [Leadership log — 2026-03-29](./EXEC_CHECKLIST_AND_NEXT_STEPS.md) for product-derived metrics; add commercial:

| Theme | Examples |
|--------|----------|
| **Adoption** | Active projects/menus in period; weekly active users (if tracked) |
| **Costing quality** | % menu lines with recipe link and non-imputed costs |
| **Economics** | Margin distribution before/after pricing or vendor change (same formula) |
| **Commercial** | MRR or pilot fees, pipeline, pilot NPS or qualitative score |

---

## 8. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Engineering pulled into features before P0 closed | Leadership priority: **checklist P0** first ([EXEC_CHECKLIST](./EXEC_CHECKLIST_AND_NEXT_STEPS.md)) |
| Selling to everyone | **ICP lock** for 90 days; say no politely |
| Margin debates in pilots | **Definitions sheet** + tax/margin clarity from Leadership log |
| Support overload | Cap pilot count; office hours; async docs |

---

## 9. Decisions for CEO (record in [NEXT_STEPS_LEADERSHIP](./NEXT_STEPS_LEADERSHIP.md))

1. **ICP** for next 90 days (multi-unit vs single venue vs consultant).  
2. **Pricing posture** (pilot fee vs subscription start; ballpark ARPA target).  
3. **Pilot cap** (how many concurrent pilots we can serve well).  
4. **Revenue target** for next quarter (range is fine)—so team can align effort.

---

## 10. Team actions (summary)

| Role | Focus |
|------|--------|
| **CEO** | ICP, pricing, pilot approval, revenue target |
| **CTO / Eng** | P0 completion, data contract, stable deploys |
| **COO** | Pilot packaging, cadence, exec checklist updates, comms around deploys |
| **Sales / BD** | Pipeline aligned to ICP; no off-ICP deals without CEO |
| **CS / onboarding** (when staffed) | Onboarding checklist, pilot check-ins |
| **Everyone** | Route new ideas through [TEAM_ACTION_PLAN](./TEAM_ACTION_PLAN.md) epics |

---

## 11. Next 30 days (suggested)

1. **Close P0** operational sign-off where checklist allows.  
2. **CEO** records ICP + pricing hypothesis (even draft).  
3. **Identify** one named pilot prospect or renewal path.  
4. **COO** schedules monthly metrics review using §7.

---

*This is a strategic frame for alignment. Technical backlog remains in TEAM_ACTION_PLAN and EXEC_CHECKLIST; legal and finance terms belong in executed agreements.*
