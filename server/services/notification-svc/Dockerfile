# Build context MUST be the monorepo ROOT — see auth-svc/Dockerfile for why.
#   docker build -f server/services/notification-svc/Dockerfile -t community-notification-svc .
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
COPY server/services/notification-svc server/services/notification-svc

WORKDIR /app/server/services/notification-svc

ENV NODE_ENV=production
# HTTP API (bootstrap/preferences endpoints) and the TCP microservice
# listener (auth-svc/community-svc send notification triggers here) are
# two separate ports on the same hybrid app.
EXPOSE 5011
EXPOSE 6011

# See auth-svc/Dockerfile's comment: runs from source via ts-node, matching
# nodemon.json's proven-working `exec`.
CMD ["npx", "ts-node", "-r", "tsconfig-paths/register", "--transpile-only", "src/main.ts"]
