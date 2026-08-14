# ---- Build Stage ----
FROM node:24.12-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy project files
COPY . .

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
