# Iterum Culinary App — Brief for Leadership

**Purpose:** Snapshot of where the product stands today, why it matters, and what we are tackling next.  
**Audience:** CEO and executive team  
**Date:** March 2026  

**Working checklist:** [EXEC_CHECKLIST_AND_NEXT_STEPS.md](./EXEC_CHECKLIST_AND_NEXT_STEPS.md) (status trackers and 30-day sequence).  
**Leadership sync:** [NEXT_STEPS_LEADERSHIP.md](./NEXT_STEPS_LEADERSHIP.md) (meeting agenda, decisions, 30-day sequence).  
**Roles:** [LEADERSHIP_ROLE_ASSIGNMENTS.md](./LEADERSHIP_ROLE_ASSIGNMENTS.md) (COO / CTO tasks, RACI, specialty hires).  
**Team execution:** [TEAM_ACTION_PLAN.md](./TEAM_ACTION_PLAN.md) (streams A–E, `@` tags).

---

## What we have built

**Iterum Culinary** is a web application for professional kitchens and culinary teams. It supports recipe development, menu building with costing and margins, ingredient and inventory management, vendor tracking and price comparison, equipment, production planning, and front-of-house tools (e.g. server sheets, allergens).

The application is **live** on **Vercel** (static hosting), with **Firebase** used for authentication and cloud data (Firestore / Storage), and is designed for **chef and operator** workflows—not generic inventory software, but a culinary R&D and operations companion.

**Strategic fit:** As we pursue operators who run **multiple locations** and shared supply bases, the product’s natural direction is: *one account, many “restaurants” (venues), many menus, shared vendor lists, and apples-to-apples price comparison across sites.*

---

## Current state (honest assessment)

### Strengths

- **Deep feature set** aligned with real kitchen and menu economics (recipes, costing, prep, FOH).
- **Multi-workspace model** (projects per user) already supports separating client or venue work; this can evolve into a formal “multi-restaurant” experience.
- **Modern baselines:** authentication, cloud sync path, linting, and hosting are in place; the team can ship iteratively without a full rewrite.

### Gaps and risks (technical)

- **Data and sync:** Core data lives in the browser (**local storage**) and is synchronized to the cloud in more than one way. Over time, different parts of the app have used different patterns. That creates **maintenance cost** and a **small but real risk** of inconsistency or bugs when switching devices or projects.
- **Security rules review:** Firebase security rules must **match how we actually store data**. The engineering team is actively mapping storage paths and closing any mismatch (for example, ensuring no user can read another user’s private project data).
- **Quality gates:** Automated end-to-end tests are **configured but not yet populated** at the level we want; CI has been **lightweight**. Tightening this reduces regression risk as we grow usage.
- **Codebase scale:** The app spans **many pages and a large number of JavaScript modules**. Some screens are very large files. This does not block users today but **slows feature delivery** unless we modularize over time.

**Bottom line:** The product is **usable and valuable today**; the work ahead is **disciplined hardening and structure** so we can scale customers, sites, and team size without surprises.

---

## What engineering is doing now

Engineering has started the **inventory phase** agreed with leadership:

1. **Map** where each type of data is stored (browser vs cloud, which keys and paths).  
2. **Align Firebase rules** with real usage so privacy and tenant isolation are correct.  
3. **Choose a single direction** for “source of truth” when both local and cloud exist (so future features don’t fork the model again).

This is the right **first** move before large refactors or new multi-site features.

---

## Next punch list (prioritized)

Items are ordered by **risk reduction and enablement** for multi-restaurant and procurement workflows.

| Priority | Item | Why it matters |
|----------|------|----------------|
| **P0** | **Finish storage + Firestore audit; fix rules** | Protects customer trust and compliance posture; avoids cross-tenant leaks. |
| **P0** | **Single data-access path (phased)** | Fewer bugs, faster features, cleaner multi-site and vendor pricing logic. |
| **P1** | **Product model: account → restaurants → menus** | Matches how operators buy and run stores; unlocks your purchasing roadmap. |
| **P1** | **Shared vendor directory + comparable pricing by location** | Reuse suppliers across sites without duplicating data; support regional price differences. |
| **P2** | **Smoke tests + CI on pull requests** | Catches breakage before users do; supports a growing engineering team. |
| **P2** | **Break up largest pages into modules** | Improves velocity and review quality (e.g. menu builder). |
| **P3** | **Optional build tooling (e.g. bundler)** | Nice for scale; not required to complete P0–P1. |
| **P3** | **Consolidate internal runbooks** | Less time lost to deploy and Firebase confusion. |

---

## What we need from leadership

- **Clear priority:** Confirm **P0 (security + data contract)** ahead of net-new major features that touch the same data layer.  
- **ICP alignment:** Confirm whether the near-term anchor customer is **multi-unit operator**, **single high-end venue**, or **consultant across clients**—that choice fine-tunes “restaurant vs project” naming and onboarding.  
- **No silent scope creep:** New ideas are welcome best when routed through **epics** so engineering can finish the audit and foundation without constant context switching.

---

## Success in the next quarter (suggested)

- Storage and Firestore **fully documented**; rules **verified** against production paths.  
- **One** canonical pattern for saving core entities (even if migration is incremental).  
- **Acceptance criteria** met for “one manager, multiple restaurants, shared vendors, price comparison.”  
- **Basic automated tests** running on main development workflow.

---

## Contact

Technical questions on this brief can go to **engineering leads**; product framing for multi-site and purchasing to **product/operations** as you prefer to staff.

---

*This document reflects a technical and product assessment of the repository and architecture as of the date above; deployment URLs, team names, and commercial details can be added in a version you send externally.*
