import AppLogoIcon from '@/components/app-logo-icon';
import { useAppearance } from '@/hooks/use-appearance';
import { Moon, Sun } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: PropsWithChildren<AuthLayoutProps>) {
    const { appearance, updateAppearance } = useAppearance();

    const toggleAppearance = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Appearance Toggle Button */}
            <button
                onClick={toggleAppearance}
                className="fixed top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/90 hover:shadow-xl dark:bg-gray-800/80 dark:hover:bg-gray-800/90"
                aria-label="Toggle appearance"
            >
                {appearance === 'dark' ? (
                    <Sun className="h-5 w-5 text-amber-500 transition-transform duration-200 hover:rotate-12" />
                ) : (
                    <Moon className="h-5 w-5 text-slate-600 transition-transform duration-200 hover:rotate-12" />
                )}
            </button>

            <div className="w-full max-w-md">
                {/* Logo and Brand */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
                        <AppLogoIcon className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title || 'MyShop'}</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">{description || 'Inventory & Sales Management System'}</p>
                </div>

                {/* Content */}
                {children}
            </div>
        </div>
    );
}
