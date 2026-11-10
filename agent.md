# Tovedem Project - Agent Guide

## Project Overview

Tovedem is an Angular 20 web application for managing a theater group ("Tovedem De Meern") in the Netherlands. The application handles public-facing content (homepage, agenda, reservations) and member-only administrative features (member management, reservation management, performance management).

## Tech Stack

- **Framework**: Angular 20
- **Backend**: PocketBase (self-hosted BaaS)
- **UI Libraries**:
  - Angular Material 20
  - Bootstrap 5.3.2
  - MDB Angular UI Kit
- **Key Dependencies**:
  - `pocketbase` - Backend API client
  - `ngx-toastr` - Toast notifications
  - `ng-recaptcha` - reCAPTCHA integration
  - `ngx-quill` - Rich text editor
  - `luxon` - Date/time handling
  - `apexcharts` - Charts and visualizations
  - `ngx-awesome-uploader` - File uploads
- **Language**: TypeScript 5.8
- **Styling**: SCSS with Material Design 3 theme

## Project Structure

```
src/
├── app/
│   ├── common/              # Shared layout components (navbar, footer, sidenav, cookie-banner)
│   ├── models/              # TypeScript models/interfaces
│   │   ├── domain/          # Domain models (gebruiker, voorstelling, reservering, etc.)
│   │   └── pocketbase/      # PocketBase-specific models
│   ├── pages/
│   │   ├── members/         # Member-only pages (requires authentication)
│   │   │   ├── beheer-*/    # Admin management pages (requires admin role)
│   │   │   ├── profiel/     # User profile
│   │   │   ├── galerij/     # Gallery
│   │   │   └── productie-info/  # Production info for members
│   │   └── public/          # Public pages (no auth required)
│   │       ├── home/        # Homepage
│   │       ├── agenda/      # Event calendar
│   │       ├── reserveren/  # Reservation system
│   │       ├── contact/      # Contact form
│   │       └── ...
│   └── shared/
│       ├── components/      # Reusable components
│       └── services/        # Shared services
├── assets/                  # Static assets (images, etc.)
└── environment/             # Environment configuration
```

## Key Architecture Patterns

### Services

- **PocketbaseService** (`shared/services/pocketbase.service.ts`): Centralized PocketBase client wrapper. All database operations should go through this service.
- **AuthService** (`shared/services/auth.service.ts`): Handles authentication and authorization. Provides methods like `isLoggedIn()`, `isGlobalAdmin`, `userHasAllRoles()`.
- **ThemeService**: Manages application theming
- **BreakpointService**: Handles responsive breakpoints
- **SeoService**: Manages SEO metadata

### Authentication & Authorization

- Route guards are defined in `app.routes.ts` using `loggedInGuard()` function
- Two levels of access:
  - **Logged in users**: Can access member pages
  - **Admin users**: Can access `beheer-*` (management) pages
- Global admins bypass role checks

### Data Models

- Domain models are in `models/domain/` (e.g., `gebruiker.model.ts`, `voorstelling.model.ts`, `reservering.model.ts`)
- Models follow Dutch naming conventions (gebruiker = user, voorstelling = performance, reservering = reservation)
- PocketBase models extend `BaseModel` or use `RecordModel`

### Routing

- Public routes: `/`, `/agenda`, `/contact`, `/reserveren`, etc.
- Member routes: `/profiel`, `/galerij`, `/productie-info/*`
- Admin routes: `/beheer-reserveringen`, `/beheer-leden`, `/beheer-voorstellingen`, etc.
- Route guards are applied inline in route definitions

## Coding Conventions

### Naming

- **Components**: PascalCase (e.g., `BeheerLedenComponent`)
- **Services**: PascalCase with "Service" suffix (e.g., `PocketbaseService`)
- **Models**: PascalCase with "Model" suffix (e.g., `GebruikerModel`)
- **Files**: kebab-case matching component name (e.g., `beheer-leden.component.ts`)
- **Variables/Methods**: camelCase

### Language

- **UI Text**: Dutch (Nederlands)
- **Code Comments**: Can be Dutch or English
- **Variable Names**: Often Dutch (e.g., `gebruiker`, `voorstelling`, `reservering`)

### Component Structure

Each component typically has:

- `.component.ts` - Component logic
- `.component.html` - Template
- `.component.scss` - Styles

### Styling

- Uses SCSS with Material Design 3 theme (`tovedem-theme-m3.scss`)
- Global styles in `styles.scss` and `variables.scss`
- Component-scoped styles in component `.scss` files

## Common Tasks

### Adding a New Public Page

1. Create component in `src/app/pages/public/[page-name]/`
2. Add route to `app.routes.ts`
3. Add navigation link if needed (navbar, footer, or sidenav)

### Adding a New Member-Only Page

1. Create component in `src/app/pages/members/[page-name]/`
2. Add route with `canActivate: [loggedInGuard()]` in `app.routes.ts`
3. Add navigation link in member navigation

### Adding a New Admin Page

1. Create component in `src/app/pages/members/beheer-[resource]/`
2. Add route with `canActivate: [loggedInGuard(['admin'])]` in `app.routes.ts`
3. Add navigation link in admin navigation

### Database Operations

Always use `PocketbaseService` methods:

- `create<T>(collectionName, item)` - Create record
- `update<T>(collectionName, item)` - Update record
- `delete(collectionName, id)` - Delete record
- `getOne<T>(collectionName, id, options?)` - Get single record
- `getAll<T>(collectionName, options?)` - Get all records
- `getPage<T>(collectionName, page, perPage, expand?)` - Get paginated records

### Environment Configuration

- Environment config in `src/environment/environment.dev.ts`
- Environment interface in `src/environment/environment.model.ts`
- Access via `inject(Environment)` in services/components

## Important Notes

- **PocketBase**: Backend is PocketBase. Collections are accessed by name (e.g., "gebruikers", "voorstellingen", "reserveringen")
- **Authentication**: Uses PocketBase authentication. Session is managed by PocketBase client.
- **File Uploads**: Uses `ngx-awesome-uploader` component. File tokens obtained via `PocketbaseService.getFileToken()`
- **Forms**: Uses Angular Reactive Forms. Validation messages should be in Dutch.
- **Notifications**: Uses `ngx-toastr` for user feedback. Import `ToastrService` and use methods like `success()`, `error()`, `info()`, `warning()`.
- **Date Handling**: Uses `luxon` library for date/time operations.
- **Rich Text**: Uses Quill editor (`ngx-quill`) for rich text content.
- **reCAPTCHA**: Integrated for form protection. Configured in `app.config.ts` with Dutch language.

## Development Workflow

1. **Start dev server**: `npm run start` (or `npm run start:devcontainer` in devcontainer)
2. **Build**: `npm run build` (development) or `npm run build:prod` (production)
3. **Lint**: `npm run lint`
4. **Test**: `npm run test`

## Secrets & Security (mandatory)

This repo is protected against accidental secret commits by **gitleaks**:

- `npm run secrets:scan` — scan the full working tree/history for secrets
- `npm run secrets:scan:staged` — scan only staged changes
- `npm run secrets:install` — install the local git hooks (idempotent)
- CI also runs a gitleaks scan on every push/PR (`.github/workflows/secrets-scan.yml`)
- The pre-commit hook (`scripts/git-hooks/pre-commit`) blocks any commit whose staged changes contain a real secret

**Agent duties:**

1. **Auto-install hooks**: if `.git/hooks/pre-commit` is missing or does not contain the `tovedem-secrets-hook` marker, run `npm run secrets:install` yourself before doing any git work. Do not ask the user first.
2. **Before committing**: run `npm run secrets:scan:staged`. If it fails, remove the secret from the staged changes (never commit it, never "fix" it by allowlisting a real value).
3. **Never commit real credentials.** Config/secrets belong in gitignored `.env` files (see `.gitignore`); use `.env.example` with placeholder values for documentation.
4. If gitleaks is not installed on the machine, install it (`brew install gitleaks`) or tell the user to, since the hook fails closed without it.

## Docker

- `Dockerfile` - Production build
- `Dockerfile.cd` - Continuous deployment build
- `docker-compose.yml` - Local development setup
- `config/nginx.conf` - Nginx configuration for production

## Backend Hooks

PocketBase hooks are in `pb_hooks/`:

- `mailing.js` - Email functionality
- `mails.pb.js` - Mail-related hooks
- `recaptcha.pb.js` - reCAPTCHA validation

## Common Collections (PocketBase)

Based on models and usage:

- `gebruikers` - Users/members
- `voorstellingen` - Performances/shows
- `reserveringen` - Reservations
- `spelers` - Players/actors
- `groepen` - Groups (Tovedem, Cloos, Mejotos)
- `nieuws` - News items
- `mails` - Email templates/content
- `afbeeldingen` - Images/photos
- `losse_verkoop` - Individual sales

## When Making Changes

1. Follow existing naming conventions (Dutch for UI, camelCase/PascalCase for code)
2. Use `PocketbaseService` for all database operations
3. Check authentication/authorization requirements for new routes
4. Ensure error handling uses `CustomErrorHandlerService`
5. Use toast notifications for user feedback
6. Keep styling consistent with Material Design 3 theme
7. Test responsive behavior (uses Bootstrap breakpoints)
