# MyShop - Deployment Notes

## ✅ Successfully Deployed to Hostinger

**URL**: https://kayzcollection.com
**Server**: Hostinger
**Laravel Version**: 12.21.0
**PHP Version**: 8.2.27

## Database Configuration
- **Type**: MySQL
- **Database**: u453594823_kayzcollection
- **Username**: u453594823_kayzcollection
- **Host**: localhost
- **Port**: 3306

## Important Notes

### Caching Issue
⚠️ **IMPORTANT**: Do not run `php artisan config:cache` on this server. It causes a 500 error related to encryption key parsing.

**Safe caching commands:**
```bash
php artisan route:cache
php artisan view:cache
```

**If you get 500 errors, run:**
```bash
php artisan config:clear
php artisan cache:clear
```

### File Structure
- Laravel app root: `/home/u453594823/domains/kayzcollection.com/`
- Web root: `/home/u453594823/domains/kayzcollection.com/public_html/`
- Storage symlink: `public_html/storage -> ../storage/app/public`

### Deployment Commands
```bash
# Connect to server
ssh -p 65002 u453594823@82.25.113.24

# Navigate to app
cd domains/kayzcollection.com

# Update code (after uploading files)
php artisan migrate --force
php artisan route:cache
php artisan view:cache

# Clear caches if needed
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
```

### Assets
- Built assets are in `public_html/build/`
- Remove `public_html/hot` file to use production assets
- Never run Vite dev server on production

## Troubleshooting

### 500 Error
1. Check logs: `tail -f storage/logs/laravel.log`
2. Clear config cache: `php artisan config:clear`
3. Ensure .env file has correct values
4. Check file permissions

### CORS Errors (Vite)
1. Remove `hot` file: `rm public_html/hot`
2. Ensure assets exist in `public_html/build/`

### Database Issues
1. Verify database credentials in .env
2. Test connection: `php artisan migrate:status`
3. Run migrations: `php artisan migrate --force`

## File Permissions
```bash
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/framework
```

## Useful Scripts
- `deploy.sh` - Full deployment script
- `finish_deploy.sh` - Final setup script
