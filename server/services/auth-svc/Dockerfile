# Build context MUST be the monorepo ROOT, not this directory — npm
# workspaces resolve @shared/common and @shared/entities as symlinks into
# server/platform/*, so every workspace's package.json has to be visible:
#   docker build -f server/services/auth-svc/Dockerfile -t community-auth-svc .
FROM node:20-alpine

WORKDIR /app

# Every workspace's package.json first, so `npm install` can resolve the
# full workspace graph and this layer stays cached across source edits.
COPY package.json package-lock.json ./
COPY server/platform/common/package.json server/platform/common/package.json
COPY server/platform/shared-entities/package.json server/platform/shared-entities/package.json
COPY server/platform/gateway/package.json server/platform/gateway/package.json
COPY server/services/auth-svc/package.json server/services/auth-svc/package.json
COPY server/services/community-svc/package.json server/services/community-svc/package.json
COPY server/services/notification-svc/package.json server/services/notification-svc/package.json
COPY client/package.json client/package.json

RUN npm install

# Now the real source for what this image actually runs.
COPY server/platform/common server/platform/common
COPY server/platform/shared-entities server/platform/shared-entities
COPY server/services/auth-svc server/services/auth-svc

WORKDIR /app/server/services/auth-svc

ENV NODE_ENV=production
EXPOSE 4001

# NOT `npm run build && node dist/index.js` — @shared/* packages declare
# "main": "index.ts" (raw TypeScript), which plain `node` cannot resolve
# once compiled output tries to require them. This runs from source via
# ts-node instead, exactly mirroring nodemon.json's proven-working `exec`,
# just without the file-watcher.
CMD ["npx", "ts-node", "--project", "tsconfig.json", "--transpile-only", "src/index.ts"]
