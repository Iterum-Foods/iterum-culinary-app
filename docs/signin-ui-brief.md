# Sign-in UI brief (S2 → S4)

**Scope:** `public/signin.html` only for implementation. Auth flows unchanged.

## Layout

- **Desktop:** Split card — brand panel (lg+) + form column; mobile stacks with logo + form.
- **Hierarchy:** Page title → short supporting line → tab control → fields → primary CTA → “or Google” → back link.

## Copy (plain language)

| Element | Copy |
|---------|------|
| Title | “Sign in to Iterum” |
| Subtitle | “Use your work email and password.” |
| Tab 1 / 2 | “Sign in” / “Create account” |
| Email label | “Email” |
| Password label | “Password” |
| Forgot | “Forgot password?” (link unchanged until reset flow wired) |
| Remember | “Keep me signed in” |
| Primary (sign in) | “Sign in” |
| Primary (sign up) | “Create account” |
| Google | “Continue with Google” |
| Back | “← Back to home” |

## Brand

- Tokens: iterum-forest, iterum-pine, iterum-clay, iterum-ink, iterum-gold, iterum-slate (Tailwind config in page).
- Primary action: forest green button, sufficient contrast (ink text on clay fields).

## Accessibility

- Every input has `<label for="…">` matching `id`.
- Tab buttons `type="button"`, `data-tab` for `auth-ui.js`.
- Visible `:focus-visible` rings on inputs and primary actions.

## Technical (must preserve)

- Form ids: `signin-form`, `signup-form`.
- Field ids: `signin-email`, `signin-password`, `signup-name`, `signup-email`, `signup-password`, `signup-confirm-password`.
- Error ids: `*-error` as today; add `signup-confirm-error` for auth-ui.
- Buttons: `signin-btn`, `signup-btn`, `signin-btn-text`, `signup-btn-text`.
- Spinners: **`signin-spinner`**, **`signup-spinner`** (required by `auth-ui.js`).
