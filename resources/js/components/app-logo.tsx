import AppLogoIcon from './app-logo-icon';
import { usePage } from '@inertiajs/react';

export default function AppLogo() {
    const { app } = usePage().props;
    // Get app name from shared data or fallback to environment variable
    const appName = (app as any)?.name || import.meta.env.VITE_APP_NAME || 'MyShop';

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold">{appName}</span>
            </div>
        </>
    );
}
