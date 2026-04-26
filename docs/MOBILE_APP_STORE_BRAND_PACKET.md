# Iterum mobile — brand packet (everyday users, App Store)

**Audience:** Home cooks, busy households, hobby bakers, side hustles, and small food operations who want one calm place for recipes, lists, and simple food-safety habits—not pro kitchens only.  
**Visual source of truth:** `public/assets/css/iterum-brand-kit.css` and `iterum-unified-colors.css`.  
**Tech context:** Capacitor wraps the web app (`cap:sync` / `cap:open:ios`). Treat this packet as the marketing and UX voice layer for the **phone** experience.  
**Last updated:** 2026-03-01  

---

## 1. Positioning

| Element | Direction |
|--------|------------|
| **Category frame** | Food & Drink → Recipes, or Productivity → (if you lead with lists/planning). Pick one primary story for the first screenshot. |
| **Promise** | Your food life, organized—recipes you actually use, lists that stick with you, and gentle structure when you want it. |
| **Not** | “Enterprise kitchen OS,” “only for chefs,” or jargon (HACCP, mise, COGS) on the **first** screen of store copy. Those belong in deeper description or pro tabs. |
| **Trust** | Calm Nordic palette, readable type, no clutter. You are a tool that respects attention. |

**Elevator line (internal):** Iterum helps everyday people plan, cook, and keep their food world in one place—without turning dinner into a spreadsheet.

---

## 2. Brand fundamentals (use everywhere)

### 2.1 Color tokens (from live CSS)

Use these for **icon**, **screenshots**, and **in-app marketing** surfaces so store and product match.

| Role | Hex | Notes |
|------|-----|--------|
| Ink (primary text) | `#1a2e35` | Headlines on light |
| Moss (primary accent) | `#6b8e6f` | CTAs, key UI |
| Nordic blue (secondary accent) | `#5b9bad` | Links, secondary highlights |
| Page background | `#fafbfc` → `#f5f7f9` | Soft gradient acceptable |
| Cards | `#ffffff` | On subtle shadow |
| Success | `#6b8e6f` | Align with moss |
| Warning | `#d4a574` | Sparingly |
| Error | `#c97676` | Sparingly |

**Gradient (buttons / hero):** `135deg` from `#6b8e6f` to `#5b9bad` (see `--brand-btn-primary`).

### 2.2 Typography

- **Primary:** Inter (system fallback: -apple-system, Segoe UI, sans-serif).  
- **Weights:** 500–600 for titles, 400 for body. Avoid ultra-light on small sizes.  
- **Rule:** Minimum ~16pt body on screenshots; 22pt+ for hero lines on device frames.

### 2.3 Shape & motion

- Corner radius: **12–18px** on cards/buttons (align with `--radius-md` / `--radius-lg`).  
- Icon: Simple mark on **moss or white**; readable at 29×29pt (Settings) and 60×60 (home grid). Avoid micro-detail that vanishes at small size.

### 2.4 Voice & tone (everyday user)

- **Warm, direct, short sentences.** “Save recipes,” “Build your menu,” “Your week, planned.”  
- **Avoid:** “Leverage,” “ecosystem,” “workflow orchestration,” unexplained acronyms.  
- **Inclusive:** “you / your kitchen” not “the operator.”  
- **Optional footnote in long description:** Mention that teams and small businesses can grow into deeper tools—honest upsell without leading with it.

---

## 3. App Store Connect — copy bank

Replace bracketed or placeholder claims after product/legal review. Apple field limits change; verify in App Store Connect.

### 3.1 App name (≤30 characters)

**Primary option:** `Iterum: Recipes & Kitchen`  
**Alternates:** `Iterum Kitchen Planner` · `Iterum — Food & Recipes`

### 3.2 Subtitle (≤ 30 characters)

**Primary:** `Plan meals. Save recipes.`  
**Alternates:** `Your recipes, one calm app.` · `Cook, plan, stay organized.`

### 3.3 Promotional text (≤ 170 characters, editable without new binary)

Example:

> New: faster access to your saved recipes and lists. Iterum keeps meal ideas, notes, and your go-to dishes in one calm place—built for real home cooking.

### 3.4 Keywords (≤ 100 characters, comma-separated, no spaces after commas)

Example string (trim to fit):

`recipe,meal,plan,cook,kitchen,menu,grocery,food,organize,notebook,baker,dinner`

### 3.5 Description (short lead + body)

**First three lines (what users see before “more”):**

> Iterum is your calm spot for recipes and everyday cooking.  
> Save dishes you love, sketch ideas, and keep lists handy—without noise.  
> Built for home cooks and anyone who wants their food life in one place.

**Body (excerpt; expand with real feature list):**

- Save and find recipes quickly; keep versions and notes as you improve dishes.  
- Plan menus and meals when you want structure; stay flexible when you don’t.  
- Ingredients, ideas, and reminders live together so you’re not jumping between apps.  
- Optional: simple checklists and safety-style logs for those who want extra structure (e.g. temps, sanitizer)—useful for ambitious home cooks or tiny food businesses.  
- Sign in to sync across your devices (when account features are enabled).

**Closing line:**

> Iterum Foods — thoughtful tools for people who care about what they eat.

### 3.6 What’s New (template)

> Thanks for cooking with Iterum. This update improves speed and reliability on iPhone. We’re listening—tap Feedback in settings to tell us what you need next.

---

## 4. Screenshot storyboard (iPhone 6.7" primary)

Tell one **horizontal** story left-to-right. Use real UI where possible; if not ready, use **high-fidelity mocks** with the hex palette above.

| # | Screen focus | Headline overlay (short) | Goal |
|---|----------------|---------------------------|------|
| 1 | Hero / sign-in or home | “Your food life, organized” | Emotional hook |
| 2 | Recipe library or saved dish | “Recipes you’ll actually open again” | Core value |
| 3 | Recipe detail or edit | “Notes, steps, yours” | Depth without fear |
| 4 | Menu or meal list | “Plan the week in minutes” | Planning |
| 5 | Ingredients / list | “Groceries and ideas, together” | Utility |
| 6 | Dashboard or tasks (soft) | “Gentle structure when you want it” | Differentiator |
| 7 | Privacy / account (optional) | “Your account, your data” | Trust |

**Safe zones:** Keep copy out of the notch and home indicator; Apple’s safe-area templates help.

---

## 5. Icon & media specs (checklist)

| Asset | Notes |
|-------|--------|
| App icon | 1024×1024 master PNG (no alpha on store icon); simplify mark for small sizes. |
| iPhone screenshots | 6.7", 6.5", 5.5" as required; portrait first. |
| iPad | If universal:12.9" screenshots or opt out of iPad delivery in Connect. |
| App Preview video | Optional 15–30s; first5 seconds = single clear message. |
| Privacy Nutrition Label | Answer from real data collection; update when analytics/auth change. |

---

## 6. Legal & brand hygiene

- **Display name** on device can be shorter than full App Store name (e.g. “Iterum”).  
- **Support URL** and **marketing URL** should match a page that reflects this voice (not a raw repo).  
- **Copyright:** Use legal entity name your counsel approves.  
- **Third-party marks:** If screenshots show “Google” or device frames, follow Apple and partner guidelines.

---

## 7. Handoff to design

1. Export a **Figma** (or equivalent) with: color styles from §2.1, text styles (Inter), and 6.7" frame components.  
2. Drop **real strings** from §3 onto screenshot mocks; localize later if needed.  
3. Align **in-app empty states** and onboarding with the same headlines as screenshot 1–2 so the store promise matches first open.

---

## 8. Related repo files

- Brand CSS: `public/assets/css/iterum-brand-kit.css`  
- Icons: `public/assets/icons/` (evaluate `iterum.ico` / PNGs for 1024 master)  
- Mobile: `package.json` scripts `cap:sync`, `cap:open:ios`; `android/` project if present  

This packet is **living**: when positioning shifts (e.g. more B2B), fork a “Pro / Operator” appendix rather than diluting the everyday story on the main store listing.
