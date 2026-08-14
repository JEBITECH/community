FROM node:24.12-alpine

WORKDIR /app

# Copy package files
COPY server/platform/gateway/package*.json ./

# Remove the @erp/common dependency temporarily for Docker
RUN sed -i '/"@erp\/common":/d' package.json

# Install dependencies
RUN npm install

# Copy common files to the gateway
COPY server/platform/common ./common

# Copy gateway source code
COPY server/platform/gateway/src ./src
COPY server/platform/gateway/tsconfig.json ./

# Port will be set by environment variables
ARG GATEWAY_PORT=4000
EXPOSE ${GATEWAY_PORT}

# Start development server
CMD ["npm", "run", "dev"]