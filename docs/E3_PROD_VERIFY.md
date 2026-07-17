# E3 — production verify (Workspace A ≠ B)

**Purpose:** Confirm delegated `vendor_prices` rules + UI after **Deploy Firebase** is green.  
**Prod URL:** `https://iterum-culinary-app.vercel.app`  
**Related:** [E3_DECISION_RECORD.md](./E3_DECISION_RECORD.md) · [HOW_WE_SHIP.md](./HOW_WE_SHIP.md) · [E3_BACKEND_UPGRADE_PLAN.md](./E3_BACKEND_UPGRADE_PLAN.md)

---

## Gate 0 — Deploy Firebase (CTO)

1. Locally (or on a machine with Firebase access):

```powershell
npx firebase-tools@15.12.0 login:ci
```

2. Copy the token → GitHub repo **Settings → Secrets → Actions → `FIREBASE_TOKEN`**.
3. **Actions → Deploy Firebase → Run workflow** (or re-run the failed job).
4. **Pass:** latest run on `main` is **success** for project `iterum-culinary-app2`.

_If local CLI says credentials invalid:_ `npx firebase-tools@15.12.0 login --reauth`, then `login:ci` again.

---

## Gate 1 — A ≠ B prices (chef / COO, ~2 min)

Account with **two** workspaces (A and B).

1. Open `{prod}/vendor-management.html` → scroll to **Workspace price overrides**.
2. Sidebar: select **Workspace A**.
3. Save a **This workspace only** override — ingredient e.g. `Heavy cream`, unit cost **`4.00`**.
4. Sidebar: switch to **Workspace B**.
5. Save the **same ingredient**, unit cost **`5.50`** (workspace only).
6. Refresh list on B — should show **5.50**. Switch back to A — should show **4.00** (not 5.50).
7. Optional: open a recipe that uses that ingredient on each workspace; **Price sources** / cost should follow the active workspace.

**Pass:** A and B keep different unit costs for the same ingredient.  
**Fail:** permission-denied, both workspaces show the same price, or save fails — paste non-secret console/network text to Eng; confirm Gate 0 green first.

---

## Gate 2 — Smoke (Eng)

```powershell
$env:ITERUM_BASE_URL="https://iterum-culinary-app.vercel.app"
npm run test:smoke:prod
```

Record date + result in [EXEC_CHECKLIST_AND_NEXT_STEPS.md](../EXEC_CHECKLIST_AND_NEXT_STEPS.md).
