import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { BottomNavigation } from '@/components/bottom-navigation';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ 
    children, 
    breadcrumbs = [],
    alertCounts,
    analytics
}: PropsWithChildren<{ 
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
}>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs} alertCounts={alertCounts} analytics={analytics} />
                {children}
                <BottomNavigation />
            </AppContent>
        </AppShell>
    );
}
