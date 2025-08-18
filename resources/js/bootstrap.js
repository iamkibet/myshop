import axios from 'axios';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Set CSRF token for all axios requests
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token) {
    window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

// Echo configuration for real-time notifications
window.Echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
});

// Listen for sale notifications (admin only)
if (window.auth && window.auth.user && window.auth.user.role === 'admin') {
    window.Echo.private('admin-sales')
        .listen('SaleCreated', (e) => {
            // Show notification
            const notification = new Notification('New Sale Completed', {
                body: `Sale #${e.sale.id} completed by ${e.sale.manager_name} for $${e.sale.total_amount}`,
                icon: '/favicon.ico',
            });

            // Add click handler to view receipt
            notification.onclick = () => {
                window.open(e.sale.receipt_url, '_blank');
            };
        });
} 