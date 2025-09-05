#!/bin/bash

# Enhanced MyShop Production Deployment Script
# Usage: ./deploy-production.sh

set -e

# Configuration
SSH_HOST="82.25.113.24"
SSH_PORT="65002"
SSH_USER="u453594823"
DOMAIN="kayzcollection.com"
REMOTE_PATH="domains/$DOMAIN"
LOCAL_PATH="."

echo "🚀 Starting PRODUCTION deployment to $DOMAIN..."
echo "📅 $(date)"
echo ""

# Pre-deployment checks
echo "🔍 Running pre-deployment checks..."

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "⚠️  WARNING: You're not on main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
fi

# Run local tests
echo "🧪 Running local tests..."
npm run types
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Deployment cancelled."
    exit 1
fi

echo "✅ Pre-deployment checks passed"
echo ""

# Create backup timestamp
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "📦 Creating backup timestamp: $BACKUP_TIMESTAMP"

# Create temporary deployment directory
TEMP_DIR="/tmp/myshop_deploy_$BACKUP_TIMESTAMP"
mkdir -p "$TEMP_DIR"

echo "📦 Preparing files for deployment..."

# Copy necessary files (excluding development files)
rsync -av --exclude-from=<(cat <<'EOF'
node_modules/
.git/
.env
.env.local
.env.development
.env.testing
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
*.md
deploy*.sh
fix-*.sh
quick-*.sh
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

echo "📋 Server deployment started at \$(date)"

# Create backup of current .env
if [ -f .env ]; then
    cp .env .env.backup.$BACKUP_TIMESTAMP
    echo "✅ Backed up current .env file"
fi

# Install/update Composer dependencies
echo "📦 Installing Composer dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction

# Set up Laravel (avoiding problematic config:cache)
echo "🔧 Setting up Laravel..."
php artisan key:generate --force

# Set permissions
echo "🔐 Setting file permissions..."
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/framework

# Create storage symlink
echo "🔗 Creating storage symlink..."
php artisan storage:link

# SKIP MIGRATIONS - Live database with user data
echo "🛡️  SKIPPING database migrations (live application with user data)"
echo "   Database structure will remain unchanged"

# Cache routes and views (avoiding config cache)
echo "⚡ Caching routes and views..."
php artisan route:cache
php artisan view:cache

# Clear problematic caches
echo "🧹 Clearing problematic caches..."
php artisan config:clear
php artisan cache:clear

# Copy entire public folder to public_html (Hostinger web root)
echo "📁 Copying public folder to public_html..."
cp -r public/* public_html/ 2>/dev/null || true

# Copy build files from public/public_html/build to public_html/build
echo "📁 Copying build files to public_html..."
if [ -d public/public_html/build ]; then
    cp -r public/public_html/build public_html/ 2>/dev/null || true
    echo "✅ Build files copied successfully"
else
    echo "⚠️  No build directory found in public/public_html/build"
fi

echo "✅ Public files copied successfully"

# Remove hot file if it exists
rm -f public_html/hot
echo "✅ Removed hot file"

# Final permissions check
chmod -R 755 public_html
chmod -R 755 storage bootstrap/cache

echo "✅ Server setup completed at \$(date)"
EOF

# Clean up
rm -rf "$TEMP_DIR"

echo ""
echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "📅 $(date)"
echo ""
echo "🌐 Your application is now live at: https://$DOMAIN"
echo ""
echo "📋 POST-DEPLOYMENT CHECKLIST:"
echo "1. ✅ Test the application at https://$DOMAIN"
echo "2. ✅ Verify admin dashboard functionality"
echo "3. ✅ Test sale completion process"
echo "4. ✅ Check notification system"
echo "5. ✅ Verify file uploads work"
echo "6. ✅ Test mobile responsiveness"
echo ""
echo "🔧 If you need to troubleshoot:"
echo "   ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
echo "   cd $REMOTE_PATH"
echo "   tail -f storage/logs/laravel.log"
echo ""
echo "🚀 Deployment completed successfully!"
