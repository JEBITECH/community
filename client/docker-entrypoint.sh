#!/bin/sh
set -e

echo "🔧 Setting up ERP Client..."

# Fix permissions for node_modules volume (run as root initially)
if [ "$(id -u)" = "0" ]; then
    echo "🔧 Fixing volume permissions..."
    mkdir -p /app/client/node_modules
    chown -R nodejs:nodejs /app/client/node_modules
    chmod 755 /app/client/node_modules
    
    # Switch to nodejs user and re-run script
    exec su-exec nodejs:nodejs "$0" "$@"
fi

# Now running as nodejs user
echo "📦 Running as user: $(whoami) ($(id))"

# Check if node_modules exists and has content, if not install dependencies
if [ ! -d "/app/client/node_modules" ] || [ -z "$(ls -A /app/client/node_modules 2>/dev/null)" ]; then
    echo "📦 Installing client dependencies..."
    cd /app/client && npm install
fi

echo "✅ Dependencies ready, starting development server..."
cd /app/client && npm run dev