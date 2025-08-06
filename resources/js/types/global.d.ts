import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;

    interface Window {
        __INERTIA_PROPS__?: {
            app?: {
                name?: string;
            };
        };
    }
}
