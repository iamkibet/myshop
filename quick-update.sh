#!/bin/bash

# Quick UI Update Script for Hostinger
set -e

SSH_HOST="82.25.113.24"
SSH_PORT="65002"
SSH_USER="u453594823"
DOMAIN="kayzcollection.com"

echo "🚀 Starting quick UI update..."

echo "📤 Uploading built assets..."
rsync -avz -e "ssh -p $SSH_PORT" public/build/ "$SSH_USER@$SSH_HOST:domains/$DOMAIN/public_html/build/"

echo "📁 Uploading any changed source files..."
rsync -avz -e "ssh -p $SSH_PORT" --exclude=node_modules --exclude=.git --exclude=vendor --exclude=storage/logs resources/ "$SSH_USER@$SSH_HOST:domains/$DOMAIN/resources/"

echo "🧹 Clearing caches on server..."
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << EOF
cd domains/$DOMAIN
php artisan view:clear
php artisan route:clear
echo "✅ Caches cleared!"
EOF

echo ""
echo "🎉 UI update completed successfully!"
echo "🌐 Check your changes at: https://kayzcollection.com"
