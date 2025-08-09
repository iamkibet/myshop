#!/bin/bash

# Final deployment setup script for Hostinger
set -e

SSH_HOST="82.25.113.24"
SSH_PORT="65002"
SSH_USER="u453594823"
DOMAIN="kayzcollection.com"

echo "🚀 Finishing deployment setup..."

# Execute final setup commands on server
ssh -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" << 'EOF'
cd domains/kayzcollection.com

echo "Setting up database..."
# Create SQLite database if it doesn't exist
touch database/database.sqlite

echo "Setting proper permissions..."
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/framework
chmod 664 database/database.sqlite

echo "Running migrations..."
php artisan migrate --force

echo "Creating storage symlink..."
php artisan storage:link

echo "Clearing and caching..."
php artisan config:clear
php artisan cache:clear
php artisan config:cache
php artisan view:cache

echo "Optimizing application..."
php artisan optimize

echo "✅ Deployment setup completed!"

echo "Checking Laravel status..."
php artisan --version
php artisan about --only=Application,Environment,Debug

echo "Testing application..."
php -S localhost:8000 -t public_html > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2
curl -s http://localhost:8000 | head -20
kill $SERVER_PID 2>/dev/null || true

EOF

echo ""
echo "🎉 Your Laravel application is now deployed!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Visit https://kayzcollection.com to test your application"
echo "2. If you see errors, check logs in storage/logs/"
echo "3. Update your .env file with proper database credentials if needed"
echo "4. Set up SSL certificate if not already configured"
echo ""
echo "🔧 Useful commands:"
echo "   SSH: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST"
echo "   View logs: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'tail -f domains/$DOMAIN/storage/logs/laravel.log'"
echo "   Clear cache: ssh -p $SSH_PORT $SSH_USER@$SSH_HOST 'cd domains/$DOMAIN && php artisan cache:clear'"
