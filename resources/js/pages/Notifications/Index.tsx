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

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Notifications</h1>
                        <p className="text-muted-foreground">Manage and monitor all system notifications</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={syncNotifications} disabled={loading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Sync
                        </Button>
                        <Button variant="outline" onClick={markAllAsRead} disabled={loading || stats.unread === 0}>
                            <Eye className="mr-2 h-4 w-4" />
                            Mark All Read
                        </Button>
                        <Button variant="destructive" onClick={clearAllNotifications} disabled={loading}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total</CardTitle>
                            <Bell className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unread</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.unread}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inventory</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.inventory}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sales</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.sales}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Filter className="mr-2 h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 md:flex-row">
                            <div className="flex-1">
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute top-3 left-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search notifications..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="type-filter">Type</Label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by type" />
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
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="unread">Unread ({stats.unread})</TabsTrigger>
                        <TabsTrigger value="read">Read ({stats.total - stats.unread})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="unread" className="space-y-4">
                        <div className="space-y-4">
                            {filteredNotifications
                                .filter((notification) => !notification.is_read)
                                .map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className={`cursor-pointer transition-all hover:shadow-md ${
                                            notification.is_read ? 'opacity-75' : ''
                                        } ${getNotificationColor(notification.type)}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-1 items-start space-x-3">
                                                    {getNotificationIcon(notification.icon)}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1 flex items-center space-x-2">
                                                            <h4 className="font-medium">{notification.title}</h4>
                                                            {!notification.is_read && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    New
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="text-xs">
                                                                {notification.type}
                                                            </Badge>
                                                        </div>
                                                        <p className="mb-2 text-sm text-muted-foreground">{notification.message}</p>
                                                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
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
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                            {filteredNotifications.filter((n) => !n.is_read).length === 0 && (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="mb-2 text-lg font-medium">No unread notifications</h3>
                                        <p className="text-muted-foreground">
                                            {searchTerm || filterType !== 'all'
                                                ? 'Try adjusting your filters'
                                                : 'All caught up! No unread notifications.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="read" className="space-y-4">
                        <div className="space-y-4">
                            {filteredNotifications
                                .filter((notification) => notification.is_read)
                                .map((notification) => (
                                    <Card
                                        key={notification.id}
                                        className={`cursor-pointer opacity-75 transition-all hover:shadow-md ${getNotificationColor(notification.type)}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex flex-1 items-start space-x-3">
                                                    {getNotificationIcon(notification.icon)}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1 flex items-center space-x-2">
                                                            <h4 className="font-medium">{notification.title}</h4>
                                                            <Badge variant="outline" className="text-xs">
                                                                {notification.type}
                                                            </Badge>
                                                        </div>
                                                        <p className="mb-2 text-sm text-muted-foreground">{notification.message}</p>
                                                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                                            <span>{new Date(notification.created_at).toLocaleString()}</span>
                                                            {notification.read_by && <span>Read by {notification.read_by.name}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}

                            {filteredNotifications.filter((n) => n.is_read).length === 0 && (
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                        <h3 className="mb-2 text-lg font-medium">No read notifications</h3>
                                        <p className="text-muted-foreground">
                                            {searchTerm || filterType !== 'all' ? 'Try adjusting your filters' : 'No read notifications yet.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Pagination */}
                {notifications.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Showing {(notifications.current_page - 1) * notifications.per_page + 1} to{' '}
                            {Math.min(notifications.current_page * notifications.per_page, notifications.total)} of {notifications.total}{' '}
                            notifications
                        </p>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={notifications.current_page === 1}
                                onClick={() => router.get('/notifications', { page: notifications.current_page - 1 })}
                            >
                                Previous
                            </Button>
                            <span className="text-sm">
                                Page {notifications.current_page} of {notifications.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={notifications.current_page === notifications.last_page}
                                onClick={() => router.get('/notifications', { page: notifications.current_page + 1 })}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
