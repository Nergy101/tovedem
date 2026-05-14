# Tovedem

Angular app for managing a Dutch theater group, backed by a self-hosted [PocketBase](https://pocketbase.io/) instance.

**Repository:** <https://github.com/Nergy101/tovedem>  
**Docker Hub:** <https://hub.docker.com/r/nergy101/tovedem>

---

## Local development

**Requirements:** Node.js 20+ and npm.

```bash
npm install -g @angular/cli   # install Angular CLI once
npm ci --legacy-peer-deps     # install project dependencies
npm run start                 # dev server at http://localhost:4200
```

When running inside a DevContainer:

```bash
npm run start:devcontainer    # binds to 0.0.0.0 instead of localhost
```

Other useful commands:

```bash
npm run build          # development build
npm run build:prod     # production build (output: dist/)
npm run lint           # ESLint on TS and HTML
npm run test           # headless Jasmine/Karma tests
npm run test:pb        # PocketBase hook tests (Node.js test runner)
```

### Environment (local)

The dev environment is configured in `src/environment/environment.dev.ts`. Edit that file directly to point at a different PocketBase instance while developing.

---

## Self-hosting with Docker

The app ships as a single nginx container. Runtime configuration is injected at container start via environment variables — no rebuild needed when switching environments.

### 1. Pull the image

```bash
docker pull nergy101/tovedem:latest
```

### 2. Create a `.env` file

Copy `config/.env.example` to `.env` next to your `docker-compose.yml` and fill in the values:

```env
PRODUCTION=true
POCKETBASE_BASE_URL=https://pocketbase.example.com
POCKETBASE_ADMIN_URL=https://pocketbase.example.com/_/
CAPTCHA_SITE_KEY=<your reCAPTCHA v3 site key>
KUMA_STATUS_URL=https://kuma.example.com/status/tovedem
UMAMI_SCRIPT_URL=https://umami.example.com/script.js
UMAMI_WEBSITE_ID=<your Umami website ID>
```

Docker Compose reads `.env` automatically and passes these into the container. The entrypoint script (`config/docker-entrypoint.sh`) writes them to `assets/env.js` at startup so Angular can pick them up at runtime.

### 3. Create a `docker-compose.yml`

**Minimal** — assumes PocketBase is hosted elsewhere:

```yaml
services:
  tovedem:
    image: nergy101/tovedem:latest
    container_name: tovedem
    restart: unless-stopped
    ports:
      - "4200:80"
    env_file:
      - .env
```

**With PocketBase** — run everything on one machine:

```yaml
services:
  tovedem:
    image: nergy101/tovedem:latest
    container_name: tovedem
    restart: unless-stopped
    ports:
      - "4200:80"
    env_file:
      - .env
    depends_on:
      - pocketbase

  pocketbase:
    image: ghcr.io/muchobien/pocketbase:latest
    container_name: pocketbase
    restart: unless-stopped
    ports:
      - "8090:8090"
    volumes:
      - pocketbase_data:/pb/pb_data
      - ./pb_hooks:/pb/pb_hooks   # mount your hooks from this repo

volumes:
  pocketbase_data:
```

Point `POCKETBASE_BASE_URL` and `POCKETBASE_ADMIN_URL` in your `.env` at the PocketBase container (e.g. `http://pocketbase:8090` for internal traffic, or your public domain if behind a reverse proxy).

> You can extend this further by adding [Uptime Kuma](https://github.com/louislam/uptime-kuma) and [Umami](https://github.com/umami-software/umami) services to the same compose file and wiring up `KUMA_STATUS_URL` / `UMAMI_*` accordingly. If you don't need those integrations, simply leave those `.env` values empty — the app will silently skip the status widget and analytics script.

### 4. Start

```bash
docker compose up -d
```

The app is now reachable at `http://<host>:4200`.

---

## CI/CD pipeline

Deployments run automatically via GitHub Actions (`.github/workflows/pipeline.yml`) on every push to `main`.

### Stages

| Stage | What happens |
|---|---|
| **build-angular-app** | Installs deps, runs tests, builds with `npm run build:prod`, uploads `dist/` as an artifact |
| **build-and-push-docker-image** | Builds the Docker image using `Dockerfile.cd` (copies the pre-built artifact), pushes `nergy101/tovedem:latest` and a version tag to Docker Hub for `linux/arm64` and `linux/amd64` |
| **nergy-acceptance-deploy** | SSHes into the Nergy Acceptance VM, pulls the new image, and runs `docker compose up -d` — requires the **Nergy Acceptance** GitHub environment to be approved |
| **tovedem-production-deploy** | Same, but targets the Tovedem Production VM — requires the **Tovedem Production** GitHub environment to be approved |

PocketBase hooks (`pb_hooks/`) are deployed separately by `replace_pbhooks.yml` / `replace_pbhooks_production.yml` whenever hooks change on `main`.

### Required GitHub secrets

Each deployment environment needs its own set of secrets:

| Secret | Description |
|---|---|
| `SSH_HOST` / `SSH_HOST_2` | IP or hostname of the target VM |
| `SSH_USERNAME` / `SSH_USERNAME_2` | SSH user on the VM |
| `SSH_KEY` / `SSH_KEY_2` | Private SSH key for that user |
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |

### Server-side setup

On each VM, create `/root/code/tovedem/` containing a `docker-compose.yml` and a populated `.env` (see above). The deploy step just runs `docker compose pull && docker compose up -d` in that directory.

---

## Code scaffolding

```bash
ng generate component component-name
ng generate directive|pipe|service|class|guard|interface|enum|module
```
