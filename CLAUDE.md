# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run start          # Dev server at http://localhost:4200
npm run start:devcontainer  # Dev server accessible at 0.0.0.0 (for DevContainers)
npm run build          # Development build
npm run build:prod     # Production build
npm run lint           # ESLint on TS and HTML
npm run test           # Headless Jasmine/Karma tests
npm run test:ui        # Tests in Chrome UI
npm run test:pb        # Test PocketBase hooks (Node.js test runner)
```

## Architecture

**Tovedem** is an Angular app for managing a Dutch theater group. The backend is a self-hosted **PocketBase** instance.

### Key Services

- **`PocketbaseService`** (`shared/services/pocketbase.service.ts`) — the only place database operations happen. Has a Map-based cache (15-min TTL). Use `directClient` to bypass cache (e.g., auth operations).
- **`AuthService`** (`shared/services/auth.service.ts`) — authentication, role checks, signals-based reactive state.
- Environment config injected via `inject(Environment)` from `src/environment/`.

### Routing & Auth

Routes are in `app.routes.ts`, all using lazy `loadComponent()`. Guards:
- `loggedInGuard(roles)` — requires login, optionally specific roles
- `globalAdminGuard()` — global admins only

Required roles per route come from `shared/constants/route-access.config.ts`.

Page structure:
- `pages/public/` — no auth required
- `pages/members/` — requires login; `beheer-*/` pages require admin role

### Data Models

In `models/domain/` — follow Dutch naming: `gebruiker` (user), `voorstelling` (performance), `reservering` (reservation), `speler` (actor), `groep` (group), `nieuws` (news), `afbeelding` (image).

Form models in `models/form-models/` use Angular Reactive Forms. Validation messages must be in Dutch.

### Conventions

- UI text in Dutch; code/comments in Dutch or English
- Component selectors prefixed `app-` (kebab-case); directives prefixed `app` (camelCase)
- One component per folder: `.component.ts`, `.component.html`, `.component.scss`
- Toast notifications via `ToastrService` (`success()`, `error()`, `info()`, `warning()`)
- Date/time via `luxon`, rich text via Quill (`ngx-quill`)
- Styling: SCSS + Material Design 3 theme (`tovedem-theme-m3.scss`) + Bootstrap grid

### PocketBase Hooks

Backend hooks live in `pb_hooks/` (JavaScript). They handle emails, reCAPTCHA validation, and reservation logic. Tests in `pb_hooks/__tests__/` run with the Node.js test runner (`npm run test:pb`).
