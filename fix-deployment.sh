#!/bin/bash

echo "🔧 MyShop Deployment Fix Script"
echo "================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created from .env.example"
    else
        echo "❌ .env.example not found either!"
        echo "📝 Creating basic .env file..."
        cat > .env << EOF
APP_NAME="MyShop"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=http://localhost

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=myshop
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="\${APP_NAME}"

VITE_APP_NAME="\${APP_NAME}"
EOF
        echo "✅ Basic .env file created"
    fi
else
    echo "✅ .env file found"
fi

# Check if APP_NAME is set
if grep -q "APP_NAME=" .env; then
    current_name=$(grep "APP_NAME=" .env | cut -d'=' -f2 | tr -d '"')
    echo "📱 Current APP_NAME: $current_name"
    
    if [ "$current_name" = "Laravel" ] || [ "$current_name" = "" ]; then
        echo "🔄 Updating APP_NAME to 'MyShop'..."
        sed -i 's/APP_NAME=.*/APP_NAME="MyShop"/' .env
        echo "✅ APP_NAME updated to 'MyShop'"
    fi
else
    echo "📝 Adding APP_NAME to .env..."
    echo 'APP_NAME="MyShop"' >> .env
    echo "✅ APP_NAME added to .env"
fi

# Clear Laravel caches
echo "🧹 Clearing Laravel caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
echo "✅ Caches cleared"

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env; then
    echo "🔑 Generating application key..."
    php artisan key:generate
    echo "✅ Application key generated"
else
    echo "✅ Application key already exists"
fi

# Build frontend assets
echo "🏗️  Building frontend assets..."
npm run build
echo "✅ Frontend assets built"

# Set proper permissions
echo "🔐 Setting proper permissions..."
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || echo "⚠️  Could not set ownership (may need sudo)"
echo "✅ Permissions set"

echo ""
echo "🎉 Deployment fix completed!"
echo ""
echo "📋 Next steps:"
echo "1. Restart your web server (Apache/Nginx)"
echo "2. Restart your PHP-FPM service if applicable"
echo "3. Test the admin dashboard sidebar - should now show 'MyShop'"
echo "4. Test mobile responsiveness on various devices"
echo ""
echo "🔍 If issues persist, check the DEPLOYMENT_SETUP.md file for detailed troubleshooting"
echo ""
echo "📱 Test mobile responsiveness:"
echo "- Open browser DevTools (F12)"
echo "- Click device toggle button"
echo "- Test various mobile screen sizes"
echo "- Check for overlapping content or layout issues"
