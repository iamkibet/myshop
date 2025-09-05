#!/bin/bash

# Laravel Deployment Script for Hostinger
# Usage: ./deploy.sh [domain_name]

set -e

# Configuration
SSH_HOST="82.25.113.24"
SSH_PORT="65002"
SSH_USER="u453594823"
DOMAIN=${1:-"kayzcollection.com"}  # Default domain, can be overridden
REMOTE_PATH="domains/$DOMAIN"
LOCAL_PATH="."

echo "🚀 Starting deployment to $DOMAIN..."

# Create temporary deployment directory
TEMP_DIR="/tmp/myshop_deploy_$(date +%s)"
mkdir -p "$TEMP_DIR"

echo "📦 Preparing files for deployment..."

# Copy necessary files (excluding node_modules, .git, etc.)
rsync -av --exclude-from=<(cat <<'EOF'
node_modules/
.git/
.env
public/hot
storage/logs/*.log
storage/framework/cache/data/*
storage/framework/sessions/*
storage/framework/views/*
bootstrap/cache/*.php
.DS_Store
*.log
.vscode/
.idea/
tests/
.phpunit.result.cache
EOF
) "$LOCAL_PATH/" "$TEMP_DIR/"

# Copy .env.example as .env template
cp "$LOCAL_PATH/.env.example" "$TEMP_DIR/.env"

echo "📤 Uploading files to server..."

# Upload files to server
rsync -avz -e "ssh -p $SSH_PORT" "$TEMP_DIR/" "$SSH_USER@$SSH_HOST:$REMOTE_PATH/"

echo "🔧 Running server-side setup..."

# Execute commands on server
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
cd $REMOTE_PATH

echo "Installing/updating Composer dependencies..."
composer install --optimize-autoloader --no-dev

echo "Setting up Laravel..."
php artisan key:generate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Setting permissions..."
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/framework

echo "Creating symlink for storage..."
php artisan storage:link

echo "Running migrations..."
php artisan migrate --force

echo "Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan view:clear

echo "Copying public folder to public_html..."
cp -r public/* public_html/ 2>/dev/null || true

# Copy build files from public/public_html/build to public_html/build
echo "Copying build files to public_html..."
if [ -d public/public_html/build ]; then
    cp -r public/public_html/build public_html/ 2>/dev/null || true
    echo "Build files copied successfully"
else
    echo "No build directory found in public/public_html/build"
fi

echo "✅ Deployment completed successfully!"
EOF

# Clean up
rm -rf "$TEMP_DIR"

echo "🎉 Deployment to $DOMAIN completed!"
echo ""
echo "⚠️  IMPORTANT: Don't forget to:"
echo "1. Update your .env file on the server with production values"
echo "2. Generate APP_KEY: php artisan key:generate"
echo "3. Configure your database settings"
echo "4. Set up your domain to point to the public_html directory"
echo ""
echo "🔗 SSH into your server: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
