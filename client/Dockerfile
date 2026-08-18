# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy project files
COPY . .

# Vite bakes VITE_* vars into the built bundle at build time, not runtime —
# override these at `docker build --build-arg` (or via docker-compose's
# `build.args`) to point at your real gateway/community-svc URLs.
ARG VITE_API_URL=http://localhost:4000/api
ARG VITE_COMMUNITY_WS_URL=http://localhost:5021
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_COMMUNITY_WS_URL=$VITE_COMMUNITY_WS_URL

# Build React app
RUN npm run build

# ---- Production Stage ----
FROM nginx:stable-alpine

# Copy build files to nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copy default nginx config (for SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
