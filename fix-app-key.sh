#!/bin/bash

echo "🔑 Fixing Laravel APP_KEY issue..."
echo "=================================="

# Server details
SERVER="u453594823@82.25.113.24"
PORT="65002"
REMOTE_DIR="/home/u453594823/public_html"

echo "📡 Connecting to server..."
echo "Server: $SERVER"
echo "Port: $PORT"
echo "Directory: $REMOTE_DIR"
echo ""

# Generate the application key
echo "🔐 Generating Laravel application key..."
ssh -p $PORT $SERVER "cd $REMOTE_DIR && php artisan key:generate"

# Clear all caches
echo "🧹 Clearing Laravel caches..."
ssh -p $PORT $SERVER "cd $REMOTE_DIR && php artisan config:clear"
ssh -p $PORT $SERVER "cd $REMOTE_DIR && php artisan cache:clear"
ssh -p $PORT $SERVER "cd $REMOTE_DIR && php artisan view:clear"
ssh -p $PORT $SERVER "cd $REMOTE_DIR && php artisan route:clear"

# Verify the key was generated
echo "✅ Verifying APP_KEY was generated..."
ssh -p $PORT $SERVER "cd $REMOTE_DIR && grep 'APP_KEY=' .env | head -1"

echo ""
echo "🎉 APP_KEY fix completed!"
echo "Your Laravel application should now work properly."
echo ""
echo "If you still get errors, try refreshing your browser."
