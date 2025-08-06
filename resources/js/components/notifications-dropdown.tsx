import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { router } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Bell, CheckCircle, Info, TrendingUp, XCircle } from 'lucide-react';
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
    created_at: string;
}

interface NotificationsDropdownProps {
    notifications: Notification[];
    unreadCount: number;
    onNotificationRead?: (notificationId: number) => void;
}

export default function NotificationsDropdown({ notifications, unreadCount, onNotificationRead }: NotificationsDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [localNotifications, setLocalNotifications] = useState(notifications);
    const [localUnreadCount, setLocalUnreadCount] = useState(unreadCount);

    const getNotificationIcon = (icon: string) => {
        switch (icon) {
            case 'alert-triangle':
                return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'x-circle':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'trending-up':
                return <TrendingUp className="h-4 w-4 text-green-500" />;
            case 'check-circle':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'info':
                return <Info className="h-4 w-4 text-blue-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
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
            setLoading(true);

            const response = await fetch('/notifications/mark-read', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ notification_id: notificationId }),
            });

            if (response.ok) {
                // Update local state immediately
                setLocalNotifications((prev) =>
                    prev.map((notification) => (notification.id === notificationId ? { ...notification, is_read: true } : notification)),
                );

                // Update unread count
                setLocalUnreadCount((prev) => Math.max(0, prev - 1));

                // Notify parent component
                onNotificationRead?.(notificationId);
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
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

        setIsOpen(false);
    };

    const recentNotifications = localNotifications.slice(0, 5);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-9 w-9 rounded-md">
                    <Bell className="h-4 w-4" />
                    {localUnreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                        >
                            {localUnreadCount > 9 ? '9+' : localUnreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <Card className="border-0 shadow-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center justify-between text-sm">
                            <span>Recent Notifications</span>
                            <Button variant="ghost" size="sm" onClick={() => router.visit('/notifications')} className="h-6 px-2 text-xs">
                                View All
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="max-h-80 space-y-2 overflow-y-auto">
                            {recentNotifications.length > 0 ? (
                                recentNotifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`flex cursor-pointer items-start space-x-3 rounded-lg p-3 transition-all hover:shadow-sm ${
                                            notification.is_read ? 'opacity-75' : ''
                                        } ${getNotificationColor(notification.type)}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        {getNotificationIcon(notification.icon)}
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 flex items-center space-x-2">
                                                <h4 className="truncate text-sm font-medium">{notification.title}</h4>
                                                {!notification.is_read && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        New
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mb-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </span>
                                                <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6 text-center">
                                    <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">No notifications</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </PopoverContent>
        </Popover>
    );
}
