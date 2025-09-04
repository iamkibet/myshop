import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    alertCounts?: {
        lowStock: number;
        outOfStock: number;
        pendingExpenses: number;
        total: number;
    };
    analytics?: {
        professional: {
            lowStockAlerts: any[];
            outOfStockAlerts: any[];
            recentExpenses: any[];
        };
    };
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
    </AppLayoutTemplate>
);
