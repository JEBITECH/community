#!/bin/sh
set -e

echo "🔧 Setting up Gateway Service..."

# Fix permissions for node_modules volumes (run as root initially)
if [ "$(id -u)" = "0" ]; then
    echo "🔧 Fixing volume permissions..."
    mkdir -p /app/server/platform/common/node_modules
    mkdir -p /app/server/platform/gateway/node_modules
    chown -R nodejs:nodejs /app/server/platform/common/node_modules
    chown -R nodejs:nodejs /app/server/platform/gateway/node_modules
    chmod 755 /app/server/platform/common/node_modules
    chmod 755 /app/server/platform/gateway/node_modules
    
    # Switch to nodejs user and re-run script
    exec su-exec nodejs:nodejs "$0" "$@"
fi

# Now running as nodejs user
echo "📦 Running as user: $(whoami) ($(id))"

# Check if node_modules exists and has content, if not install dependencies

cd /app/server/platform/common

# check if common dependencies have missing packages, version mismatch or corrupted node_modules
if ! npm ls --depth=0 --silent >/dev/null 2>&1; then    
    echo "📦 Installing common dependencies..."
    npm install --legacy-peer-deps 
fi

cd /app/server/platform/gateway 

if [ -z "$(ls -A /app/server/services/gateway/node_modules 2>/dev/null)" ] || ! npm ls --depth=0 --silent >/dev/null 2>&1; then
    echo "📦 Installing gateway dependencies..."
    npm install --legacy-peer-deps 
fi

echo "✅ Dependencies ready, starting development server..."
cd /app/server/platform/gateway && npm run dev