import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { renderToString } from 'react-dom/server';

createInertiaApp({
    title: (title) => {
        // Get app name from shared data or fallback to environment variable
        const appName = import.meta.env.VITE_APP_NAME || 'Laravel';
        return title ? `${title} - ${appName}` : appName;
    },
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ App, props }: any): any {
        return renderToString(<App {...props} />);
    },
});
