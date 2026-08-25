# Build context MUST be the monorepo ROOT — see auth-svc/Dockerfile for why.
#   docker build -f server/platform/gateway/Dockerfile -t community-gateway .
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY server/platform/common/package.json server/platform/common/package.json
COPY server/platform/shared-entities/package.json server/platform/shared-entities/package.json
COPY server/platform/gateway/package.json server/platform/gateway/package.json
COPY server/services/auth-svc/package.json server/services/auth-svc/package.json
COPY server/services/community-svc/package.json server/services/community-svc/package.json
COPY server/services/notification-svc/package.json server/services/notification-svc/package.json
COPY client/package.json client/package.json

RUN npm install

COPY server/platform/common server/platform/common
COPY server/platform/shared-entities server/platform/shared-entities
COPY server/platform/gateway server/platform/gateway

WORKDIR /app/server/platform/gateway

ENV NODE_ENV=production
EXPOSE 4000

# Runs from source via tsx, matching the proven-working `dev` script
# (`tsx --watch src/index.ts`) minus the file-watcher — see
# auth-svc/Dockerfile's comment for why plain `node dist/index.js` doesn't
# work in this monorepo.
CMD ["npx", "tsx", "src/index.ts"]
