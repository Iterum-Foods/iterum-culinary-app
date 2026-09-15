# Connecting Iterum Culinary ↔ iterumfoods.xyz

**App (this repo):** `https://iterum-culinary-app.vercel.app`  
**Company site:** `https://iterumfoods.xyz`  

## Current gap (verified 2026-06-19)

| Path | What happens today |
|------|--------------------|
| Company → Culinary R&D card | Links to `https://iterumfoods.xyz/culinary-rd.html` |
| That product page CTAs | **Join waitlist** / `#` — **not** the live Vercel app |
| App landing / sign-in | Previously had **no** link back to the company site |

Restauranteur and Usta already deep-link to live apps from the company homepage. Culinary R&D should do the same.

## App-side (done in this repo)

- `public/index.html` — company top bar + footer → `iterumfoods.xyz`
- `public/signin.html` — brand links + copy “Part of Iterum Foods”
- `public/assets/js/auth_guard.js` — “Iterum Foods home” on the sign-in modal

## Company-site change (outside this repo)

On **iterumfoods.xyz** `culinary-rd.html` (and the homepage Culinary R&D card if it only points at the marketing page), replace waitlist / `#` CTAs with:

```html
<a href="https://iterum-culinary-app.vercel.app/?utm_source=iterumfoods&utm_medium=platforms&utm_campaign=culinary_rd"
   class="btn-primary">
  Open Culinary OS
</a>
<a href="https://iterum-culinary-app.vercel.app/signin.html?utm_source=iterumfoods&utm_medium=platforms&utm_campaign=culinary_rd_signin"
   class="btn-secondary">
  Sign in
</a>
```

Optional stronger connection later:

1. Custom domain (e.g. `app.iterumfoods.xyz` or `culinary.iterumfoods.xyz`) → Vercel project + Firebase Auth authorized domains  
2. Homepage Culinary R&D card CTA → app URL directly (keep `culinary-rd.html` as product story with “Open app” above the fold)

## Smoke checklist

- [ ] From `iterumfoods.xyz` → Culinary R&D → **Open Culinary OS** lands on Vercel sign-in/landing  
- [ ] From app landing top bar → company home  
- [ ] Sign-in still works (Firebase Auth domains unchanged until custom domain is added)
