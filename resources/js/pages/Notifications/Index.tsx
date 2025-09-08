import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Bell, CheckCircle, Eye, Filter, Info, RefreshCw, Search, Trash2, TrendingUp, XCircle } from 'lucide-react';
import { useState } from 'react';

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
    read_at?: string;
    read_by?: {
        id: number;
        name: string;
    };
    metadata?: any;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    notifications: {
        data: Notification[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    categories: Record<string, string>;
    stats: {
        total: number;
        unread: number;
        inventory: number;
        sales: number;
        system: number;
    };
    currentCategory: string;
}

export default function NotificationsIndex({ notifications, categories, stats, currentCategory }: PageProps) {
    const [activeTab, setActiveTab] = useState('unread');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [loading, setLoading] = useState(false);

    const getNotificationIcon = (icon: string) => {
        switch (icon) {
            case 'alert-triangle':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'x-circle':
                return <XCircle className="h-5 w-5 text-red-500" />;
            case 'trending-up':
                return <TrendingUp className="h-5 w-5 text-green-500" />;
            case 'check-circle':
                return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'info':
                return <Info className="h-5 w-5 text-blue-500" />;
            default:
                return <Bell className="h-5 w-5 text-gray-500" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'border-l-green-500 bg-green-50';
            case 'warning':
                return 'border-l-yellow-500 bg-yellow-50';
            case 'error':
                return 'border-l-red-500 bg-red-50';
            case 'info':
                return 'border-l-blue-500 bg-blue-50';
            default:
                return 'border-l-gray-500 bg-gray-50';
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            await fetch('/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ notification_id: notificationId }),
            });

            // Trigger storage event to notify other components
            localStorage.setItem('notifications-updated', Date.now().toString());
            localStorage.removeItem('notifications-updated');

            // Refresh the page to update the notification status
            router.reload();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        setLoading(true);
        try {
            await fetch('/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            // Trigger storage event to notify other components
            localStorage.setItem('notifications-updated', Date.now().toString());
            localStorage.removeItem('notifications-updated');

            router.reload();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        } finally {
            setLoading(false);
        }
    };

    const syncNotifications = async () => {
        setLoading(true);
        try {
            await fetch('/notifications/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            router.reload();
        } catch (error) {
            console.error('Failed to sync notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const clearAllNotifications = async () => {
        if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await fetch('/notifications/clear-all', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            router.reload();
        } catch (error) {
            console.error('Failed to clear all notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.action_data) return;

        const action = notification.action_data;

        // Mark as read immediately when clicked
        if (!notification.is_read) {
            await markAsRead(notification.id);
        }

        // Navigate to the appropriate page
        switch (action.type) {
            case 'sale':
                if (action.url) {
                    window.location.href = action.url;
                } else if (action.id) {
                    router.visit(`/receipts/${action.id}`);
                }
                break;
            case 'product':
                if (action.id) {
                    router.visit(`/products/${action.id}`);
                }
                break;
            case 'low_stock':
            case 'out_of_stock':
                router.visit('/admin-dashboard?tab=inventory');
                break;
            default:
                if (action.url) {
                    window.location.href = action.url;
                }
        }
    };

    const filteredNotifications = notifications.data.filter((notification) => {
        const matchesSearch =
            notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notification.message.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || notification.type === filterType;

        return matchesSearch && matchesType;
    });

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/admin-dashboard' },
                { title: 'Notifications', href: '/notifications' },
            ]}
        >
            <Head title="Notifications" />

            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 bg-gray-50 pb-24 sm:pb-4">
                {/* Header Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                                <Bell className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
                                <p className="text-sm text-gray-500 hidden sm:block">Manage and monitor all system notifications</p>
                            </div>
                        </div>
                        
                        {/* Action Buttons - Responsive */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                            <Button 
                                variant="outline" 
                                onClick={syncNotifications} 
                                disabled={loading}
                                className="flex items-center justify-center gap-2 text-sm"
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Sync</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={markAllAsRead} 
                                disabled={loading || stats.unread === 0}
                                className="flex items-center justify-center gap-2 text-sm text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">Mark All Read</span>
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={clearAllNotifications} 
                                disabled={loading}
                                className="flex items-center justify-center gap-2 text-sm text-red-600 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Clear All</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                </div>
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Bell className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Unread</p>
                                    <p className="text-2xl font-bold text-orange-600">{stats.unread}</p>
                                </div>
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Inventory</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.inventory}</p>
                                </div>
                                <div className="p-2 bg-red-100 rounded-lg">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Sales</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.sales}</p>
                                </div>
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-lg">
                            <Filter className="h-5 w-5 mr-2 text-blue-600" />
                            <span className="text-base">Filters</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="search" className="text-sm font-medium text-gray-700">Search Notifications</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="search"
                                        placeholder="Search by title or message..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="type-filter" className="text-sm font-medium text-gray-700">Filter by Type</Label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                        <SelectValue placeholder="All notification types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="warning">Warning</SelectItem>
                                        <SelectItem value="error">Error</SelectItem>
                                        <SelectItem value="info">Info</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center text-lg">
                            <Bell className="h-5 w-5 mr-2 text-blue-600" />
                            <span className="text-base">Notifications</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 mb-6 h-auto bg-gray-100">
                                <TabsTrigger 
                                    value="unread" 
                                    className="text-sm font-semibold py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600"
                                >
                                    Unread ({stats.unread})
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="read" 
                                    className="text-sm font-semibold py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
                                >
                                    Read ({stats.total - stats.unread})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="unread" className="mt-0">
                                <div className="space-y-3">
                                    {filteredNotifications
                                        .filter((notification) => !notification.is_read)
                                        .map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`border border-gray-200 rounded-lg p-4 cursor-pointer transition-all hover:shadow-md hover:border-gray-300 ${
                                                    notification.is_read ? 'opacity-75' : ''
                                                } ${getNotificationColor(notification.type)}`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex flex-1 items-start space-x-3">
                                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                                            {getNotificationIcon(notification.icon)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-2 flex items-center space-x-2">
                                                                <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                                                                {!notification.is_read && (
                                                                    <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                                                        New
                                                                    </Badge>
                                                                )}
                                                                <Badge 
                                                                    variant="outline" 
                                                                    className={`text-xs ${
                                                                        notification.type === 'success' ? 'border-green-200 text-green-800' :
                                                                        notification.type === 'warning' ? 'border-yellow-200 text-yellow-800' :
                                                                        notification.type === 'error' ? 'border-red-200 text-red-800' :
                                                                        'border-blue-200 text-blue-800'
                                                                    }`}
                                                                >
                                                                    {notification.type}
                                                                </Badge>
                                                            </div>
                                                            <p className="mb-2 text-sm text-gray-600 leading-relaxed">{notification.message}</p>
                                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                <span>{new Date(notification.created_at).toLocaleString()}</span>
                                                                {notification.is_read && notification.read_by && (
                                                                    <span>Read by {notification.read_by.name}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        {!notification.is_read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    markAsRead(notification.id);
                                                                }}
                                                                className="h-8 w-8 p-0 hover:bg-blue-50"
                                                            >
                                                                <Eye className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {filteredNotifications.filter((n) => !n.is_read).length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Bell className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No unread notifications</h3>
                                            <p className="text-gray-500">
                                                {searchTerm || filterType !== 'all'
                                                    ? 'Try adjusting your filters to see more notifications'
                                                    : 'All caught up! No unread notifications.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="read" className="mt-0">
                                <div className="space-y-3">
                                    {filteredNotifications
                                        .filter((notification) => notification.is_read)
                                        .map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`border border-gray-200 rounded-lg p-4 cursor-pointer opacity-75 transition-all hover:shadow-md hover:border-gray-300 ${getNotificationColor(notification.type)}`}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex flex-1 items-start space-x-3">
                                                        <div className="p-2 bg-white rounded-lg shadow-sm">
                                                            {getNotificationIcon(notification.icon)}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-2 flex items-center space-x-2">
                                                                <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                                                                <Badge 
                                                                    variant="outline" 
                                                                    className={`text-xs ${
                                                                        notification.type === 'success' ? 'border-green-200 text-green-800' :
                                                                        notification.type === 'warning' ? 'border-yellow-200 text-yellow-800' :
                                                                        notification.type === 'error' ? 'border-red-200 text-red-800' :
                                                                        'border-blue-200 text-blue-800'
                                                                    }`}
                                                                >
                                                                    {notification.type}
                                                                </Badge>
                                                            </div>
                                                            <p className="mb-2 text-sm text-gray-600 leading-relaxed">{notification.message}</p>
                                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                <span>{new Date(notification.created_at).toLocaleString()}</span>
                                                                {notification.read_by && <span>Read by {notification.read_by.name}</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}

                                    {filteredNotifications.filter((n) => n.is_read).length === 0 && (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Bell className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No read notifications</h3>
                                            <p className="text-gray-500">
                                                {searchTerm || filterType !== 'all' ? 'Try adjusting your filters to see more notifications' : 'No read notifications yet.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <Card className="bg-white border-0 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <p className="text-sm text-gray-600">
                                    Showing <span className="font-semibold">{(notifications.current_page - 1) * notifications.per_page + 1}</span> to{' '}
                                    <span className="font-semibold">{Math.min(notifications.current_page * notifications.per_page, notifications.total)}</span> of{' '}
                                    <span className="font-semibold">{notifications.total}</span> notifications
                                </p>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={notifications.current_page === 1}
                                        onClick={() => router.get('/notifications', { page: notifications.current_page - 1 })}
                                        className="text-sm"
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm font-medium text-gray-700 px-3">
                                        Page {notifications.current_page} of {notifications.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={notifications.current_page === notifications.last_page}
                                        onClick={() => router.get('/notifications', { page: notifications.current_page + 1 })}
                                        className="text-sm"
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
