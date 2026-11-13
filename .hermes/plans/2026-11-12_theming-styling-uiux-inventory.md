# Tovedem — Inventory of theming/styling & UI/UX oversights

**Date:** 2026-11-12 · **Branch:** main (`a8ec5d3`) · **Scope:** `src/` (Angular 20 + Material 3 + Bootstrap 5 + MDB)

This is an inventory, not an implementation plan. Every item lists where it lives
(file:line where known), why it is an oversight, and the direction of the fix.
Items marked *(overlap)* are also covered by
`2026-10-22_133321-tovedem-ui-ux-50plus.md` — coordinate so the two efforts don't
duplicate work.

---

## A. Theming architecture

| # | Oversight | Where | Fix direction |
|---|---|---|---|
| A1 | Theme is defined in **three disagreeing places**: `$primary-color: #7db3e8` in `src/variables.scss:4`, the compiled M3 palettes in `src/tovedem-theme-m3.scss`, and imperative `style.setProperty('--mat-sys-primary', '#7db3e8')` in `src/app/shared/services/theme.service.ts:96,189`. The runtime service overrides the compiled theme, so editing the SCSS theme alone does nothing. *(overlap)* | `variables.scss`, `tovedem-theme-m3.scss`, `theme.service.ts` | Single source of truth: let `mat.theme()` own the tokens; strip the imperative overrides from `ThemeService` and keep it to toggling the `darkMode`/`lightMode` class + localStorage. |
| A2 | **Universal-selector text forcing**: `html.darkMode * { color: #ffffff }` and `html.lightMode * { color: #000000 }` (`src/styles.scss:179-190`) plus per-element re-forces for h1–h6, p, span, div, li… (~267 `!important` in this file alone). This kills every intentional color (links, errors, muted text, badges) and makes future theming impossible. *(overlap)* | `src/styles.scss:177-540` | Delete the blanket rules; rely on `--mat-sys-on-*` tokens and component-level colors. |
| A3 | `src/old_tovedem-theme-m3.scss` is a dead file — referenced nowhere in `src/` or `angular.json`. | `src/old_tovedem-theme-m3.scss` | Delete it (or archive outside `src/`). |
| A4 | `variables.scss` still carries legacy tokens explicitly marked "will be replaced": `$color-dark-blue: #0103B8`, `$color-accent-red: #B80301`, `$color-dark-gray: #232323` (lines 71-74). | `src/variables.scss:71-74` | Remove once no component references them (grep first). |
| A5 | Toast colors are hardcoded Sass vars (`$toast-success: #4caf50`, `$toast-error: #f44336`, … `styles.scss:1580-1583`) instead of theme tokens; success green `#4caf50` on white is 3.0:1. | `src/styles.scss:1580-1650` | Map to `var(--mat-sys-error)` / tertiary / custom semantic tokens with AA contrast. |
| A6 | Quill (newsletter editor) is imported as stock `quill.snow.css` (`styles.scss:7`) with no dark-mode overrides — editor chrome stays white-on-dark. | `src/styles.scss:7`, `beheer-nieuwsbrief`, `beheer-mails` | Add `html.darkMode .ql-*` overrides (toolbar, editor background, borders, picker labels). |

## B. Dark-mode gaps (hardcoded values that don't adapt)

| # | Oversight | Where |
|---|---|---|
| B1 | `color: #000000` / `black` in component SCSS — invisible-ish intent in dark mode (only saved by the A2 blanket rule): `app.component.scss:104`, `image-picker-with-preview:113`, `voorstelling-card:116`, `footer.component.scss:29,345,348`, `cookie-banner:26,52,55`, `groep.component.scss` (~10 hits). | listed files |
| B2 | Hardcoded white backgrounds: `app.component.scss:175`, `navbar.component.scss:148`, `footer:28,231`, `cookie-banner:25`, `home:125`, `image-preview-dialog:48 !important`, `folder-photo-preview-dialog:130 !important`, `printen:141`, `nieuws-image-dialog:23`. | listed files |
| B3 | Inline hardcoded colors in templates: archive buttons `style="background-color: #ff9800; color: white"` (`informatie-dialog:19`, `confirmatie-dialog:8`); error icons `style="color: #f44336"` (`wachtwoord-vergeten:58`, `wachtwoord-reset:18,99`, `login:62`); `[style.color]="'#000'"` on chat icons (`reserveringen-table:51`, `beheer-vrienden:55`); print-page warning box `#fff3cd`/`#ffc107` (`printen.component.html:270-271`). | listed files |
| B4 | 50 of 81 component SCSS files contain **no** `darkMode` / `var(--mat-sys…)` reference at all — they only look right because of the A2 blanket rule. Any component with its own background/border color is a dark-mode break waiting to happen. | e.g. `signup`, `lid-worden`, `vriend-worden`, `wachtwoord-*`, `galerij/*`, ~30 dialogs |
| B5 | `reserveringen-table.component.scss:128` uses `width: 100vw` — causes horizontal overflow when a vertical scrollbar is present. | `reserveringen-table.component.scss:128` |

## C. Token fragmentation & hardcoded colors in SCSS

- ~40 distinct hardcoded hex values across component SCSS; top offenders: `footer.component.scss` (41), `groep.component.scss` (30), `draaiboek.component.scss` (30), `reserveren.component.scss` (20), plus `#ffffff` ×50, `#000000` ×35, `#7db3e8` ×27, `#f44336` ×9, `#4caf50` ×9 scattered everywhere.
- Fix direction: introduce semantic SCSS tokens (or CSS vars) — `--app-surface-card`, `--app-text`, `--app-text-muted`, `--app-border`, `--app-error`, `--app-warning`, `--app-success` — set per theme in `styles.scss`, and replace every literal. Guard with a lint-style script (the 50+ plan already proposes `scripts/check-contrast.mjs`). *(overlap)*

## D. `!important` abuse

- **835 `!important` declarations** across `src/**/*.scss`; `styles.scss` alone has 267. Top component files: `beheer-leden` (44), `beheer-mails` (34), `beheer-voorstellingen` (33), `beheer-sponsoren` (33), `reserveringen-table` (29), `footer` (23).
- Why it's an oversight: it defeats the cascade, forces the A2 blanket rules to exist, and makes every later override a bigger hammer. Fix direction: remove in batches per component, replacing with theme tokens and higher-specificity-but-sane selectors; add a lint rule (`declaration-no-important`) to stop regrowth.

## E. Inline styles in templates

- **135 `style="…"` attributes** in HTML. Notable: sidenav uses `style="width: 100%"` on ~10 wrapper divs; home page has 4× `style="font-size: x-large"` on `<h2>` *(overlap)*; navbar logo `style="height: 50px; width: auto"`; dialogs carry hardcoded colors (B3).
- Fix direction: move to component SCSS classes; keep inline styles only for truly dynamic values (e.g. `[style.width]` bindings).

## F. Typography

- 21 `font-size` declarations below 14px (lowest `0.7rem` = 11px in `reserveren.component.scss:426`); the 50+ plan counts 43 below-14px values including `styles.scss`. *(overlap)*
- Body is 16px (`variables.scss:12`); no user-facing text-size control exists. *(overlap)*
- Fix direction: raise the scale floor to 14px minimum, body to 18px, add the persisted text-size toggle. *(overlap)*

## G. Contrast / WCAG

- `#7db3e8` links on white = **2.21:1**, on card `#eaf1fc` = **1.95:1**, white text on `#7db3e8` buttons = **2.21:1** — all fail WCAG AA (4.5:1). *(overlap)*
- `#4caf50` (toast success) on white = 3.0:1; `#ff9800` archive button with white text = 2.3:1.
- Fix direction: darker link/button tokens (`#1a5c96` / `#005e93` proposed in the 50+ plan), guard script. *(overlap)*

## H. Page structure & navigation

- Only **10 files contain a real `<h1>`**, while **25 `display-1` divs** act as fake page titles — broken document outline for screen readers. *(overlap)*
- Top navbar renders ~10 equally-styled `mat-raised-button`s; no direct "Reserveren" entry. *(overlap)*
- Navbar icons upscaled with `transform: scale(1.5)` (`navbar.component.scss:163-165`) — visual size grows, 40px hit area doesn't. *(overlap)*
- Two parallel nav systems (top bar vs 423-line sidenav) with inconsistent labels ("Emails" vs "E-mail"). *(overlap)*
- `/reserveren` without `?voorstellingId=` is a dead end (empty card; `reserveren.component.ts:357`). *(overlap)*

## I. Accessibility

- **82 `mat-icon-button`s without `aria-label`** — icon-only buttons are nameless to screen readers.
- `<img>` tags without `alt` in at least: `image-picker-with-preview:32`, `nieuws-card:22,34`, `voorstelling-line:13`, `voorstelling-card:5,19`, `navbar:11,212`, `footer:9`, `home:7`, `lid-worden` (5×).
- **284 `<button>`s without `type=`** — inside forms they default to `type="submit"`, causing accidental submits.
- Clickable non-semantic elements: `(click)` on divs/spans in `image-picker-with-preview:24`, `voorstelling-line:6`, `reserveringen-table:48,87,95,102` — no keyboard access, no role.
- `prefers-reduced-motion` handled in exactly one place (`styles.scss:1712`); skeleton shimmer and other animations don't respect it elsewhere.
- Positive: `lang="nl"` is set, skip-link exists (`app.component.html`), `mat-error` used 99×.

## J. Forms & feedback

- Material placeholders are forced to `opacity: 0` in two places (`styles.scss:1122-1138, 1275-1291`) — fields show only a floating label, no hint text, no required marker. *(overlap)*
- Toast typography forced small (`0.9rem`/`0.85rem`, `styles.scss:1604-1613`) with default 5s timeout. *(overlap)*
- Dates leak English locale in tables: `datetime.service.ts:301 formatTableDateTime()` uses `setLocale('en')` → "jan. 10, 2026 [19:30]" in a Dutch UI. *(overlap)*
- Loading UX is inconsistent: 26 files use `mat-spinner`, others use the `app-skeleton` component, others nothing; `app-empty-state` is used in only 5 templates.

## K. Responsive inconsistencies

- **16 different breakpoints** in use: 768px ×75, 1024px ×14, 480px ×12, 767px ×7, 600px ×6, 1289px ×5, plus one-offs 428/576/400/1200/769/1025/1290 — no shared breakpoint tokens.
- Fix direction: define `$bp-sm/md/lg` (or CSS vars) in `variables.scss` and migrate; eliminates the 767-vs-768 off-by-one class of bugs.

## L. Suggested sequencing

1. **Foundation first** (unblocks everything else): A1 + A2 + C — one token layer, delete the blanket rules, strip imperative theme overrides. Highest risk, highest reward.
2. **Dark-mode sweep**: B1–B5 — mechanical replacement of literals with tokens; verify each page in both themes.
3. **Hygiene**: A3, A4, D, E — delete dead theme file, remove `!important` per component, move inline styles to SCSS.
4. **Accessibility & structure**: I + H — aria-labels, alt text, button types, semantic clickables, one `<h1>` per page.
5. **Polish**: F, G, J, K — type scale, contrast guard, form hints/toasts, breakpoint tokens.

Coordinate with `2026-10-22_133321-tovedem-ui-ux-50plus.md` (marked *(overlap)*) so contrast/type/nav work lands once, in the token layer, not twice.
