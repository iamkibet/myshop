# Deployment Setup Guide

## Fixing the "Laravel" Name Issue

The admin dashboard sidebar is currently showing "Laravel" instead of your app name. This happens because the app name isn't properly configured in your environment.

### Solution 1: Set Environment Variable (Recommended)

1. **Create or update your `.env` file** in your project root:
   ```bash
   APP_NAME="Your App Name Here"
   ```

2. **Clear Laravel cache** after updating:
   ```bash
   php artisan config:clear
   php artisan cache:clear
   ```

3. **Restart your application** if using a process manager like PM2 or Supervisor.

### Solution 2: Update Laravel Config

If you can't modify the `.env` file, you can update `config/app.php`:

```php
'name' => env('APP_NAME', 'Your App Name Here'),
```

### Solution 3: Set Vite Environment Variable

You can also set the app name in your `vite.config.ts`:

```typescript
export default defineConfig({
    define: {
        'import.meta.env.VITE_APP_NAME': JSON.stringify('Your App Name Here'),
    },
    // ... rest of config
});
```

## Mobile Responsiveness Improvements

The following improvements have been made to ensure better mobile experience:

### Admin Dashboard
- ✅ Responsive grid layouts for metrics cards
- ✅ Mobile-optimized header with compact spacing
- ✅ Improved chart containers with proper overflow handling
- ✅ Better spacing on mobile devices (reduced gaps)
- ✅ Responsive tabs with horizontal scrolling

### Products Form
- ✅ Mobile-friendly form layouts
- ✅ Responsive grid systems for form fields
- ✅ Better button layouts on mobile
- ✅ Improved spacing and padding for small screens

### Sidebar
- ✅ Enhanced mobile sidebar behavior
- ✅ Proper z-index handling
- ✅ Responsive header spacing

## Testing Mobile Responsiveness

1. **Use Browser DevTools**:
   - Open Chrome DevTools (F12)
   - Click the device toggle button
   - Test various mobile screen sizes

2. **Test Key Areas**:
   - Sidebar navigation on mobile
   - Dashboard metrics layout
   - Form inputs and buttons
   - Chart responsiveness
   - Tab navigation

3. **Common Mobile Issues to Check**:
   - Content overlapping
   - Text readability
   - Touch target sizes
   - Horizontal scrolling
   - Form field spacing

## Environment Variables Reference

Here are the key environment variables you should set:

```bash
# App Configuration
APP_NAME="Your App Name"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database
DB_CONNECTION=mysql
DB_HOST=your_db_host
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password

# Cache and Sessions
CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

# File Storage
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_DEFAULT_REGION=your_region
AWS_BUCKET=your_bucket
```

## After Deployment

1. **Verify the app name** appears correctly in the sidebar
2. **Test mobile responsiveness** on various devices
3. **Check for any console errors** in the browser
4. **Verify all functionality** works on mobile devices

## Troubleshooting

### App Name Still Shows "Laravel"
- Clear all caches: `php artisan optimize:clear`
- Check if `.env` file is being loaded
- Verify `config/app.php` has the correct fallback

### Mobile Issues Persist
- Check browser console for JavaScript errors
- Verify CSS is being loaded correctly
- Test on different mobile devices/browsers
- Check if any CSS conflicts exist

### Performance Issues
- Enable Laravel caching: `php artisan config:cache`
- Optimize assets: `npm run build`
- Check server response times
- Monitor memory usage
