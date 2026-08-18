# Build context MUST be the monorepo ROOT — see auth-svc/Dockerfile for why.
#   docker build -f server/services/community-svc/Dockerfile -t community-community-svc .
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
COPY server/services/community-svc server/services/community-svc

WORKDIR /app/server/services/community-svc

ENV NODE_ENV=production
# REST API/health + the Socket.io chat gateway share this one port. The
# client connects its chat socket here DIRECTLY (bypassing the gateway —
# WebSocket upgrades don't traverse the reverse-proxy cleanly), so this
# port needs to be reachable from the public internet, not just internally.
EXPOSE 5021

# See auth-svc/Dockerfile's comment: runs from source via ts-node, matching
# nodemon.json's proven-working `exec` (community-svc is a NestJS app, so
# it also needs tsconfig-paths registered for its path aliases).
CMD ["npx", "ts-node", "-r", "tsconfig-paths/register", "--transpile-only", "src/main.ts"]
