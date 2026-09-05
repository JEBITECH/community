# Deploying to DigitalOcean

The definitive, corrected version — every step below reflects fixes that are now merged into `main`. Follow this in order; nothing here needs the workarounds from earlier deploy attempts.

**Current live deployment:** `https://eoorai.com`. These steps stand up a fresh droplet from scratch — useful for a new environment, or for rebuilding the existing one if it's ever wiped.

## 1. Prerequisites

- A DigitalOcean droplet: **Ubuntu 24.04**, **6GB RAM / 2 vCPU minimum** (6 Node/TypeScript services now build concurrently — the admin client, `client-web`, and the three backend services — bumped up from the earlier 4GB recommendation now that there are two frontends).
- An SSH key added to your DigitalOcean account and selected when creating the droplet.
- **Two DNS A records**, both pointed at the droplet's IP — Caddy fronts two separate sites now:
  - `eoorai.com` — the resident-facing public website (`client-web`, Next.js).
  - `community.eoorai.com` — the admin/member dashboard (the original React client).
  
  Caddy needs both resolving correctly before it can get TLS certificates for each. If deploying to different domains, update `Caddyfile` first (see step 8) — it has one block per site.

## 2. SSH in and install Docker

```bash
ssh root@<droplet-ip>

curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

docker --version
docker compose version
```

Both should print real version numbers. (Don't use `apt install docker.io` — it's older and doesn't include the `docker compose` plugin these steps rely on.)

## 3. Clone the repo

```bash
git clone -b main https://github.com/JEBITECH/community.git
cd community
```

If the repo is private and HTTPS auth fails, use an SSH deploy key instead:
```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_deploy -C "deploy" -N ""
cat ~/.ssh/github_deploy.pub   # add this under the GitHub repo's Settings → Deploy keys (read-only is fine)
eval "$(ssh-agent -s)" && ssh-add ~/.ssh/github_deploy
git clone -b main git@github.com:JEBITECH/community.git
cd community
```

## 4. Configure `.env`

```bash
cp .env.example .env
nano .env
```

Change these from their placeholder values:

- **`DB_PASSWORD`** — a real password, not `change-me`.
- **Four secrets** — generate each separately and paste one into each:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  `USER_CONTEXT_SECRET`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_RESET_SECRET`.
- **Frontend URLs** — Caddy fronts everything without needing ports; `client` (admin dashboard) now lives on the `community.` subdomain:
  ```
  VITE_API_URL=https://community.eoorai.com/api
  VITE_COMMUNITY_WS_URL=https://eoorai.com
  ```
- **Email links**, so invite/reset emails point at the admin dashboard's real domain:
  ```
  INVITE_USER_LINK=https://community.eoorai.com/set-account-detail
  RESET_PASSWORD_LINK=https://community.eoorai.com/reset-password
  ```
- `SMTP_*` can stay blank if you don't need real emails sending yet.

⚠️ **`VITE_API_URL` and `VITE_COMMUNITY_WS_URL` are baked into the client at build time**, not read at runtime. If you ever change them later, you must rebuild the client with `--no-cache` (see step 9's note) — a plain restart won't pick up the change.

Self-check before moving on — this should print nothing:
```bash
grep -E "change-me|change_in_production|your-access-secret|your-refresh-secret|your-reset-secret|localhost:4000|localhost:5021" .env
```

## 5. Start Postgres and Redis

```bash
docker compose up -d postgres redis
sleep 10
```

## 6. Run migrations

Each service owns migrations for its own tables — run all three, in this order (auth-svc creates the organizations/users tables the others reference):

```bash
docker compose run --rm auth-svc npm run migration:run
docker compose run --rm community-svc npm run migration:run
docker compose run --rm notification-svc npm run migration:run
```

Safe to re-run any time — a service with nothing new just prints "No migrations are pending" and does nothing. The first auth-svc migration also seeds a login: `admin@localhost.com` / `Admin@123`, role `master_admin`.

## 7. Bring everything up

```bash
docker compose up -d --build
```

This builds all 6 app images plus pulls Caddy, and starts everything. First run takes several minutes (fresh `npm install` per image); later redeploys are much faster since Compose only rebuilds what actually changed.

Confirm every container is actually running, not crash-looping:
```bash
docker compose ps
```
You should see 8 containers: `postgres`, `redis`, `auth-svc`, `community-svc`, `notification-svc`, `gateway`, `client`, `client-web`, and `caddy`. Every row should say `Up`/`running`. If `caddy` doesn't appear, or `gateway`/`client`/`community-svc` still show `0.0.0.0:PORT->PORT` instead of no host port mapping, `git pull` didn't bring in the Caddy setup — see step 8.

Note: `client-web` is *also* published directly on host port `5175` (`CLIENT_WEB_PORT` in `.env`), unlike the other internal-only services — that's intentional, for testing `docker compose` locally without a real domain. On the actual droplet this is harmless since the firewall (step 8) never opens 5175 to the outside; the real path in is Caddy's subdomain.

## 8. Firewall

Caddy is the only thing that needs to be reachable from outside:

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

(Not 4000/5021 — `gateway`, `community-svc`, and `client` are internal-only now; Caddy proxies to all three by path. See the `Caddyfile` at the repo root if you need to change the domain or routing.)

## 9. Verify

```bash
docker compose logs caddy --tail 50
curl -sI https://eoorai.com
curl -sI https://community.eoorai.com
```

The Caddy log should show certificates obtained for **both** domains (no `NXDOMAIN`/DNS errors — if you see those, one of the A records isn't resolving yet, or is pointed at the wrong domain). Both curls should return a real HTTP response, not a timeout.

Then open `community.eoorai.com` in a browser and log in with `admin@localhost.com` / `Admin@123` — and separately check `eoorai.com` loads the public resident-facing site.

## Redeploying after this (the common case)

Once the above has run once, every future deploy is just:

```bash
cd ~/community
git pull

docker compose run --rm auth-svc npm run migration:run
docker compose run --rm community-svc npm run migration:run
docker compose run --rm notification-svc npm run migration:run

docker compose up -d --build
```

If the deploy changes any `VITE_*` env var, rebuild the client specifically with a clean cache first, since Compose won't know to invalidate it otherwise:
```bash
docker compose build --no-cache client
docker compose up -d --build
```

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Caddy log shows `NXDOMAIN` for one domain but not the other | That domain's A record isn't set or hasn't propagated yet — the two sites (root + `community.` subdomain) get certificates independently | Check both records at your DNS provider; wait for propagation |
| `docker compose logs caddy` shows it requesting a cert for the wrong domain | Caddyfile on disk is stale | `git pull`, then `docker compose up -d --force-recreate caddy` — Caddy only reads its config at container start, a plain `up` won't restart it if nothing about its own service definition changed |
| Gateway log says `"Community Gateway running on port 4001"` (should be 4000) or DB `ECONNREFUSED` | Already fixed in `docker-compose.yml` (`PORT`/`DB_HOST` overrides on the `gateway` service) — if you see this, your checkout predates that fix | `git pull` to get commit `0a99a80` or later |
| Client container fails to build with `"/app/dist": not found` | Already fixed (`client/Dockerfile`'s `COPY` path now matches `vite.config.ts`'s actual `outDir`) | `git pull` to get commit `284dd78` or later |
| `relation "audit_config"` / `"organization_modules"` does not exist | Already fixed (baseline migrations for tables that used to only exist via old `synchronize:true` history) | `git pull` to get commit `89674d0` or later, then re-run migrations |
| `git pull` refuses with "local changes would be overwritten" | Something was hand-edited directly on the droplet instead of through a real commit | `git status` to see what, `git checkout -- <file>` to discard it if it's safe to (i.e. already captured upstream), then pull again |
