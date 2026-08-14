# Stage 1: Build
FROM node:24.12-alpine AS builder

# Set working directory
WORKDIR /app

# Copy only package files first for caching
COPY package*.json ./

# Install dependencies (handle peer deps conflicts)
RUN npm install --legacy-peer-deps

# Copy the rest of the service code
COPY . .

# Build TypeScript (assumes "build" script exists in package.json)
RUN npx tsc

# Stage 2: Run
FROM node:24.12-alpine

WORKDIR /app

# Copy package.json + lock + node_modules from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 4001

CMD ["node", "dist/index.js"]
