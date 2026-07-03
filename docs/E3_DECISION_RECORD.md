# E3 decision record — vendor catalog & pricing

**Purpose:** Lock product policy for **shared vendors + per-workspace prices** so engineering does not build the wrong E3 shape.  
**CEO input:** 2 July 2026  
**Companions:** [E3_BACKEND_UPGRADE_PLAN.md](./E3_BACKEND_UPGRADE_PLAN.md) · [P1_EPIC_BREAKDOWN.md](./P1_EPIC_BREAKDOWN.md) · [HOW_WE_SHIP.md](./HOW_WE_SHIP.md)  
**Status:** **Locked** — ready for E3c UI + rules work after M1 human GO.

---

## Decisions (locked)

| Question | Decision |
|----------|----------|
| **Vendor master list** | **One shared list per account** — single vendor catalog under the account owner’s namespace (`users/{accountOwnerUid}/vendors`). Not separate vendor lists per venue. |
| **Prices** | **Per location (workspace)** — same vendor/SKU may have different unit costs per `projectId` via `vendor_prices` rows scoped to that workspace. Account-wide default (`projectId: null`) optional as fallback only. |
| **Who maintains** | **Each chef** — chefs at each location maintain vendor and price data for their kitchen(s), not a single central buyer only. |

---

## Product interpretation (for eng + COO)

### Shared catalog, local prices

- **Vendor identity** (name, contact, stable `vendorId`) is **account-wide** — one Sysco, one local produce guy, etc.
- **Unit cost** resolves per workspace:
  1. `vendor_prices` where `projectId === active workspace`
  2. else `vendor_prices` where `projectId === null` (account default, if set)
  3. else local ingredient price / flag missing

### “Each chef maintains”

| Action | Who | Scope |
|--------|-----|--------|
| Add / edit vendor in shared catalog | Members with **`chef_leadership`**, **`purchasing`**, or **`account_admin`** on **any** workspace under the account | Account-wide catalog |
| Set / edit unit price for an ingredient | Same roles, but only for **workspaces where they are a member** | That `projectId` only |
| Read vendors & prices | All project members who need costing / purchasing surfaces | Their workspace(s) |

**Not in MVP:** per-chef private vendor lists; org-level `organizations/{id}` tree; POS-fed price feeds.

---

## Engineering implications

### Rules (must change before prod E3c)

Today `users/{userId}/vendors` and `vendor_prices` are **`isOwner(userId)` only** — teammates cannot write.

**Required:**

1. **Read:** project members can **read** account owner’s `vendors` + `vendor_prices` for workspaces they belong to (filter client-side by `projectId` on prices).
2. **Write catalog:** delegated write for `chef_leadership` / `purchasing` / `account_admin` members (CTO to choose: member-of-any-project vs owner-only catalog create).
3. **Write prices:** member can **create/update/delete** `vendor_prices` rows only when `resource.data.projectId` (or request) matches a `projectId` they are a member of.

**Alternative (CTO review):** move `vendor_prices` to `projects/{projectId}/vendor_prices/{id}` so project rules apply naturally; keep `users/{uid}/vendors` as read-mostly catalog.

### UI (E3c)

- **Vendor management:** show “This price applies to: [current workspace]” when editing costs.
- **Ingredients / menu costing:** already hint overrides (slice 2) and price sources (slice 3) — wire **edit** to workspace-scoped rows.
- **Training copy:** “One vendor list for your group; each kitchen sets its own delivered prices.”

### Reporting footnote

External decks: segment on **`projectId`** (workspace), not “location ID” — per [ICP_DECISION_RECORD.md](./ICP_DECISION_RECORD.md).

---

## Acceptance (E3 done for pilot)

- [ ] Two workspaces under one account share the **same vendor names** in the catalog.
- [ ] Workspace A and B can show **different unit costs** for the same ingredient/vendor.
- [ ] Chef (`chef_leadership`) on Workspace A can update A’s prices **without** Firebase Console.
- [ ] Menu costing in Workspace A reflects A’s price after save (no full reload).
- [ ] Deploy Firebase green; prod smoke + onboarding bot pass.

---

## Sign-off

| Role | Status |
|------|--------|
| **CEO** | **Locked** 2 Jul 2026 — one list per account; per-workspace prices; each chef maintains. |
| **CTO** | Pending — rules shape (`users/...` vs `projects/.../vendor_prices`) |
| **COO** | Pending — pilot training one-pager uses wording above |

---

_Update when CTO picks rules storage shape or pilot feedback changes policy._
