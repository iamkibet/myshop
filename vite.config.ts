import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Vendor chunks
                    'vendor-react': ['react', 'react-dom'],
                    'vendor-inertia': ['@inertiajs/react'],
                    'vendor-ui': ['lucide-react'],
                    'vendor-charts': ['chart.js', 'react-chartjs-2'],
                    'vendor-amcharts': ['@amcharts/amcharts5', '@amcharts/amcharts5/xy', '@amcharts/amcharts5/percent'],
                    
                    // Feature chunks
                    'dashboard': [
                        './resources/js/pages/professional-admin-dashboard.tsx',
                        './resources/js/pages/dashboard.tsx'
                    ],
                    'products': [
                        './resources/js/pages/Products/Index.tsx',
                        './resources/js/pages/Products/Show.tsx',
                        './resources/js/pages/Products/Catalog.tsx'
                    ],
                    'sales': [
                        './resources/js/pages/Sales/Index.tsx',
                        './resources/js/pages/Sales/ManagerStats.tsx'
                    ],
                    'expenses': [
                        './resources/js/pages/Expenses/Index.tsx',
                        './resources/js/pages/Expenses/Show.tsx'
                    ]
                }
            }
        },
        chunkSizeWarningLimit: 1000
    }
});
