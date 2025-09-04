import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    Search, 
    Plus, 
    Bell, 
    Settings, 
    Maximize2,
    Minimize2,
    AlertTriangle
} from 'lucide-react';
import { usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import NotificationsDropdown from '@/components/notifications-dropdown';
import AlertsDropdown from '@/components/alerts-dropdown';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager';
}

interface Notification {
    id: number;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    icon: string;
    action_data?: {
        type: string;
        url?: string;
        id?: number;
        product_id?: number;
        product_name?: string;
        variant_id?: number;
    };
    category: string;
    is_read: boolean;
    created_at: string;
}

interface PageProps {
    auth: {
        user: User;
    };
    notifications?: {
        recent: Notification[];
        unreadCount: number;
    };
    analytics?: {
        professional: {
            lowStockAlerts: any[];
            outOfStockAlerts: any[];
            recentExpenses: any[];
        };
    };
    [key: string]: unknown;
}

interface AlertCounts {
    lowStock: number;
    outOfStock: number;
    pendingExpenses: number;
    total: number;
}

export function ProfessionalHeader({ alertCounts, analytics: propAnalytics }: { alertCounts?: AlertCounts; analytics?: any }) {
    const { auth, notifications, analytics } = usePage<PageProps>().props;
    const user = auth.user;
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);

    // Fullscreen functionality
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Search functionality
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.get('/products', { search: searchQuery.trim() });
        }
    };


    // Handle add new product
    const handleAddNew = () => {
        router.get('/products/create');
    };

    // Handle settings
    const handleSettings = () => {
        router.get('/settings/profile');
    };

    // Keyboard shortcut for search (Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                const searchInput = document.querySelector('input[placeholder="Search products..."]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/50 px-4 sm:px-6 bg-white">
            {/* Left Section - Search */}
            <div className="flex items-center gap-4">
                <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search products..." 
                        className="pl-10 pr-16 w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
                        ⌘K
                    </div>
                </form>
            </div>

            {/* Right Section - Controls and User */}
            <div className="flex items-center gap-3">
                {/* Add New Button */}
                <Button 
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={handleAddNew}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New
                </Button>

                {/* Fullscreen */}
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>

                {/* Alerts Dropdown */}
                {alertCounts && alertCounts.total > 0 && (propAnalytics?.professional || analytics?.professional) && (
                    <AlertsDropdown 
                        alerts={{
                            lowStock: (propAnalytics?.professional || analytics?.professional)?.lowStockAlerts || [],
                            outOfStock: (propAnalytics?.professional || analytics?.professional)?.outOfStockAlerts || [],
                            pendingExpenses: (propAnalytics?.professional || analytics?.professional)?.recentExpenses?.filter((expense: any) => expense.status === 'pending') || []
                        }}
                        alertCounts={alertCounts}
                        onAlertResolved={(alertId, alertType) => {
                            // Handle alert resolution if needed
                            console.log('Alert resolved:', alertId, alertType);
                        }}
                    />
                )}

                {/* Notifications */}
                <NotificationsDropdown 
                    notifications={notifications?.recent || []}
                    unreadCount={notifications?.unreadCount || 0}
                />

                {/* Settings - Desktop Only */}
                <div className="hidden lg:block">
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleSettings}
                        title="Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>

                {/* User Avatar - Desktop Only */}
                <div className="hidden lg:block">
                    <Avatar className="h-8 w-8 cursor-pointer" onClick={handleSettings}>
                        <AvatarImage src="/placeholder-avatar.jpg" alt={user.name} />
                        <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </header>
    );
}
