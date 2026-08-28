# syntax=docker/dockerfile:1

# ─────────────────────────────────────────────────────────────
# client-web — resident-facing community website (Next.js)
#
# Built as a self-contained image from the client-web package only
# (it has no workspace dependencies on other packages). Uses Next.js
# "standalone" output so the runtime image ships just the trimmed
# server bundle instead of the full node_modules tree.
# ─────────────────────────────────────────────────────────────

# ---- Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
# Only the manifest — maximizes layer caching for installs.
COPY client-web/package.json ./
RUN npm install

# ---- Build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY client-web/ .
# Next reads NEXT_PUBLIC_* at build time and bakes them into the client
# bundle. Anything the browser must reach directly (not via the same-origin
# /api proxy) has to be a public URL, so expose it as a build arg.
ARG NEXT_PUBLIC_COMMUNITY_WS_URL=http://localhost:5021
ENV NEXT_PUBLIC_COMMUNITY_WS_URL=$NEXT_PUBLIC_COMMUNITY_WS_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- Runtime ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# The standalone server binds 0.0.0.0 and reads PORT/HOSTNAME from the env.
ENV PORT=5175
ENV HOSTNAME=0.0.0.0

# Run as an unprivileged user.
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

# Standalone output: server + minimal node_modules, then static + public assets.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

USER nextjs
EXPOSE 5175

# server.js is emitted at the root of the standalone bundle.
CMD ["node", "server.js"]
