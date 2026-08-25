# Local Setup

Five processes, one Postgres database, one Redis instance. This walks through getting all of them running on Windows or macOS.

## Overview

| Process | Directory | Port | Role |
|---|---|---|---|
| Gateway | `server/platform/gateway` | 4000 | Single public entry point — proxies every `/api/*` request to the right service |
| Auth service | `server/services/auth-svc` | 4001 | Login, users, organizations, roles & permissions |
| Community service | `server/services/community-svc` | 5021 | Events, bookings, donations, volunteers — and live chat over Socket.io, reached directly by the browser |
| Notification service | `server/services/notification-svc` | 5011 / 6011 | Email & push notifications (HTTP + an internal TCP channel) |
| Client | `client` | 5174 | The React app, served by Vite's dev server |
| Postgres | — | 5432 | One database, shared by all three backend services |
| Redis | — | 6379 | Queues for the notification service |

Every backend service runs straight off TypeScript source via `ts-node` — there's no build step to remember in dev mode.

## 1. Prerequisites

Four tools, installed once.

**Windows (PowerShell):**

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Docker.DockerDesktop
# then launch Docker Desktop once and let it finish starting
# (enable the WSL2 backend if it asks — the default)
```

**macOS (zsh):**

```zsh
# Homebrew, if you don't already have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node@20 git
brew install --cask docker
# then launch Docker from Applications once and let it finish starting
```

Check everything landed:

```
node -v   # v20.x — the repo also runs fine on 22/24, 20 is just what's pinned
npm -v    # 10.x or newer
docker -v
```

## 2. Clone & install

This is an npm workspaces monorepo — one install at the root wires up the gateway, all three services, and the client together.

```
git clone https://github.com/JEBITECH/community.git
cd community
npm install
```

Everything below assumes you're running commands from this `community/` folder unless a step says otherwise.

## 3. Configure `.env`

One `.env` file at the repo root, read by every backend service and baked into the client at build time.

```powershell
# Windows
Copy-Item .env.example .env
```

```zsh
# macOS
cp .env.example .env
```

The defaults work as-is for local dev, except four secrets that ship as placeholders. Generate a real value for each and paste it in (works identically on both OSes):

```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

- `USER_CONTEXT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_RESET_SECRET` — one generated value each, no reuse
- `SMTP_*` can stay blank — invite & reset emails just won't send; everything else works without them

## 4. Postgres & Redis

Make sure Docker Desktop is running, then start a database and a cache — this matches the defaults already sitting in `.env.example`.

```
docker run -d --name community-postgres -p 5432:5432 -e POSTGRES_USER=community_user -e POSTGRES_PASSWORD=change-me -e POSTGRES_DB=community_db -v community_postgres_data:/var/lib/postgresql/data postgres:16-alpine

docker run -d --name community-redis -p 6379:6379 redis:7-alpine
```

If you changed `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` in `.env`, match them here too.

> **Port 5432 already in use?** A previously-installed native Postgres can quietly own that port before Docker gets to it — logins then fail in confusing ways because traffic reaches the wrong database.
>
> - **Windows**: check with `netstat -ano | findstr :5432`. If a second PID shows up next to Docker's, find it with `Get-Service postgresql*` and stop it: `Stop-Service -Name postgresql-x64-XX`.
> - **macOS**: check with `lsof -i :5432`. If Homebrew's own Postgres is running, stop it: `brew services stop postgresql@14` (adjust the version).

## 5. Run migrations

Schema sync is off on purpose — each service owns migrations for its own tables. Run them in this order, since `auth-svc` creates the organizations/users tables the other two reference.

```
cd server/services/auth-svc
npm run migration:run
cd ../community-svc
npm run migration:run
cd ../notification-svc
npm run migration:run
cd ../../..
```

The first auth-svc migration also seeds one login for local dev — `admin@localhost.com` / `Admin@123`, role `master_admin`. You'll use it in step 7.

## 6. Start everything

Five processes, five terminal tabs, each left running. Order doesn't matter much beyond starting the gateway last, since it's the one thing that expects the others to already be up.

```
# Tab 1 — auth-svc
cd server/services/auth-svc
npm run dev
```

```
# Tab 2 — community-svc
cd server/services/community-svc
npm run dev
```

```
# Tab 3 — notification-svc
cd server/services/notification-svc
npm run dev
```

```
# Tab 4 — gateway
cd server/platform/gateway
npm run dev
```

```
# Tab 5 — client
cd client
npm run dev
```

Each command is relative to the repo root — open a fresh tab per service rather than `cd`-ing back and forth in one.

## 7. Verify

- Visit `http://localhost:5174`
- Sign in with `admin@localhost.com` / `Admin@123`
- You should land on the Platform Dashboard, with an "Organizations" item in the sidebar

Or check the API directly:

```
curl -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@localhost.com","password":"Admin@123"}'
```

A JSON response with an `accessToken` means the gateway, auth-svc, and Postgres are all correctly wired together. On Windows, if that prints a webpage instead of JSON, PowerShell's built-in `curl` alias (`Invoke-WebRequest`) is shadowing the real one — run it from Git Bash, or call `curl.exe` explicitly.

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Login fails with a password/auth error even though the password is right | Something else is squatting port 5432, so traffic never reaches the Docker Postgres | See the callout in step 4 |
| `EADDRINUSE` when starting a service | That service is already running in another tab, or a crashed process never released the port | Windows: `netstat -ano \| findstr :4001`, then `taskkill /PID <pid> /F`. macOS: `lsof -i :4001`, then `kill <pid>` |
| `Cannot find module '@shared/common'` right after cloning | `npm install` ran inside a service folder instead of the repo root | Delete `node_modules`, re-run `npm install` from `community/` |
| Client loads but every request fails | The gateway (port 4000) isn't running yet, or hasn't finished booting | Check Tab 4's logs for "listening on 4000" |
| Invite / reset-password emails never arrive | `SMTP_*` is left blank in `.env` — expected for local dev | Read the invite link straight from the auth-svc terminal log, or fill in real SMTP credentials |

## 9. Full Docker path

The repo also ships a root `docker-compose.yml` that builds and runs all five services plus Postgres and Redis in containers — closer to how it'd deploy than to how it's actually been developed day-to-day.

```
docker compose up -d --build
```

The client is then served on `http://localhost` (port 80) via nginx, rather than Vite's dev server on 5174.

> This path gets less exercise than steps 1–7 — the gateway's own container build has an open issue that hasn't been root-caused yet. If it fails, the hybrid setup above is the reliable fallback.
