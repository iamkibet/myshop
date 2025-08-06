import NotificationsDropdown from '@/components/notifications-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    Calendar,
    DollarSign,
    Package,
    Plus,
    Receipt,
    RefreshCw,
    ShoppingCart,
    Target,
    TrendingUp,
    User,
    Users,
    XCircle,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Utility function to format large numbers for charts
const formatChartNumber = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin-dashboard',
    },
];

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
        variant_count?: number;
    };
    category: string;
    is_read: boolean;
    created_at: string;
}

interface SalesData {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    salesTrends: Array<{
        date: string;
        orders: number;
        revenue: number;
    }>;
    bestSellingProducts: Array<{
        product_name: string;
        variant_info: string;
        total_sold: number;
        total_revenue: number;
    }>;
    salesByCategory: Array<{
        category: string;
        total_sold: number;
        total_revenue: number;
    }>;
}

interface InventoryData {
    totalProducts: number;
    lowStockProducts: Array<{
        product_variant_id?: number;
        product_name: string;
        variant_info: string;
        current_stock: number;
        low_stock_threshold: number;
    }>;
    outOfStockProducts: Array<{
        product_variant_id?: number;
        product_name: string;
        variant_info: string;
        last_restocked: string;
    }>;
    totalCostValue: number;
    totalRetailValue: number;
    inventoryTurnoverRate: number;
}

interface ProfitData {
    totalProfit: number;
    totalRevenue: number;
    profitMargin: number;
    profitTrends: Array<{
        date: string;
        daily_profit: number;
        daily_revenue: number;
    }>;
}

interface TopEntities {
    topManagers: Array<{
        manager_name: string;
        manager_id: number;
        sales_count: number;
        total_revenue: number;
    }>;
    topProducts: Array<{
        product_name: string;
        variant_info: string;
        total_sold: number;
        total_revenue: number;
    }>;
    topCategories: Array<{
        category: string;
        total_sold: number;
        total_revenue: number;
    }>;
}

interface AnalyticsData {
    sales: SalesData;
    inventory: InventoryData;
    profits: ProfitData;
    topEntities: TopEntities;
    notifications: Notification[];
}

interface PageProps {
    auth: {
        user: User;
    };
    analytics?: AnalyticsData;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

interface RestockItem {
    product_variant_id: number;
    product_name: string;
    variant_info: string;
    current_stock: number;
    new_quantity: number;
}

export default function AdminDashboard() {
    const { analytics, flash } = usePage<PageProps>().props;

    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(analytics || null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('month');
    const [restockDialogOpen, setRestockDialogOpen] = useState(false);
    const [smartRestockDialogOpen, setSmartRestockDialogOpen] = useState(false);
    const [restockItems, setRestockItems] = useState<RestockItem[]>([]);
    const [restockLoading, setRestockLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [restockRecommendations, setRestockRecommendations] = useState<{
        product_name: string;
        recommendations: Array<{
            variant_id: number;
            variant_info: string;
            current_quantity: number;
            recommended_quantity: number;
            cost_price: number;
            selling_price: number;
        }>;
    } | null>(null);
    const [selectedProductForRestock, setSelectedProductForRestock] = useState<number | null>(null);
    const [localNotifications, setLocalNotifications] = useState(analytics?.notifications || []);
    const [localUnreadCount, setLocalUnreadCount] = useState(analytics?.notifications?.filter((n) => !n.is_read).length || 0);

    // Update local notifications when analytics data changes
    useEffect(() => {
        if (analytics?.notifications) {
            setLocalNotifications(analytics.notifications);
            setLocalUnreadCount(analytics.notifications.filter((n) => !n.is_read).length);
        }
    }, [analytics?.notifications]);

    // Fetch real-time notification data periodically
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await fetch('/notifications/recent');
                if (response.ok) {
                    const data = await response.json();
                    setLocalNotifications(data.notifications || []);
                    setLocalUnreadCount(data.unread_count || 0);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        // Fetch immediately
        fetchNotifications();

        // Set up interval to fetch every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, []);

    // Callback to update local state when notifications are marked as read
    const handleNotificationRead = (notificationId: number) => {
        setLocalNotifications((prev) =>
            prev.map((notification) => (notification.id === notificationId ? { ...notification, is_read: true } : notification)),
        );
        setLocalUnreadCount((prev) => Math.max(0, prev - 1));
    };

    // Fetch analytics data
    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/dashboard/analytics?period=${dateRange}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.error) {
                console.error('Analytics error:', data.message);
                setAnalyticsData(getDefaultAnalyticsData());
            } else {
                console.log('Analytics data received:', data);
                console.log('Profit trends:', data.profits?.profitTrends);
                console.log('Sales trends:', data.sales?.salesTrends);
                setAnalyticsData(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            setAnalyticsData(getDefaultAnalyticsData());
        } finally {
            setLoading(false);
        }
    };

    const getDefaultAnalyticsData = (): AnalyticsData => ({
        sales: {
            totalSales: 0,
            totalOrders: 0,
            averageOrderValue: 0,
            salesTrends: [],
            bestSellingProducts: [],
            salesByCategory: [],
        },
        inventory: {
            totalProducts: 0,
            lowStockProducts: [],
            outOfStockProducts: [],
            totalCostValue: 0,
            totalRetailValue: 0,
            inventoryTurnoverRate: 0,
        },
        profits: {
            totalProfit: 0,
            totalRevenue: 0,
            profitMargin: 0,
            profitTrends: [],
        },
        topEntities: {
            topManagers: [],
            topProducts: [],
            topCategories: [],
        },
        notifications: [],
    });

    useEffect(() => {
        if (!analyticsData) {
            fetchAnalytics();
        }
    }, []);

    // Refetch analytics when date range changes
    useEffect(() => {
        if (analyticsData) {
            fetchAnalytics();
        }
    }, [dateRange]);

    // Create safe analytics data with proper fallbacks
    const safeAnalyticsData = useMemo(() => {
        const data = analyticsData
            ? {
                  sales: {
                      totalSales: analyticsData.sales?.totalSales || 0,
                      totalOrders: analyticsData.sales?.totalOrders || 0,
                      averageOrderValue: analyticsData.sales?.averageOrderValue || 0,
                      bestSellingProducts: Array.isArray(analyticsData.sales?.bestSellingProducts) ? analyticsData.sales.bestSellingProducts : [],
                      salesByCategory: Array.isArray(analyticsData.sales?.salesByCategory) ? analyticsData.sales.salesByCategory : [],
                      salesTrends: Array.isArray(analyticsData.sales?.salesTrends) ? analyticsData.sales.salesTrends : [],
                  },
                  inventory: {
                      totalProducts: analyticsData.inventory?.totalProducts || 0,
                      lowStockProducts: Array.isArray(analyticsData.inventory?.lowStockProducts) ? analyticsData.inventory.lowStockProducts : [],
                      outOfStockProducts: Array.isArray(analyticsData.inventory?.outOfStockProducts)
                          ? analyticsData.inventory.outOfStockProducts
                          : [],
                      totalCostValue: analyticsData.inventory?.totalCostValue || 0,
                      totalRetailValue: analyticsData.inventory?.totalRetailValue || 0,
                      inventoryTurnoverRate: analyticsData.inventory?.inventoryTurnoverRate || 0,
                  },
                  profits: {
                      totalProfit: analyticsData.profits?.totalProfit || 0,
                      totalRevenue: analyticsData.profits?.totalRevenue || 0,
                      profitMargin: analyticsData.profits?.profitMargin || 0,
                      profitTrends: Array.isArray(analyticsData.profits?.profitTrends) ? analyticsData.profits.profitTrends : [],
                  },
                  topEntities: {
                      topManagers: Array.isArray(analyticsData.topEntities?.topManagers) ? analyticsData.topEntities.topManagers : [],
                      topProducts: Array.isArray(analyticsData.topEntities?.topProducts) ? analyticsData.topEntities.topProducts : [],
                      topCategories: Array.isArray(analyticsData.topEntities?.topCategories) ? analyticsData.topEntities.topCategories : [],
                  },
                  notifications: Array.isArray(analyticsData.notifications) ? analyticsData.notifications : [],
              }
            : null;

        console.log('Safe analytics data:', data);
        return data;
    }, [analyticsData]);

    // Prepare restock items
    useEffect(() => {
        if (safeAnalyticsData?.inventory?.lowStockProducts && safeAnalyticsData?.inventory?.outOfStockProducts) {
            const items: RestockItem[] = [
                ...(Array.isArray(safeAnalyticsData.inventory.lowStockProducts) ? safeAnalyticsData.inventory.lowStockProducts : []).map(
                    (item: { product_variant_id?: number; product_name: string; variant_info: string; current_stock: number }) => ({
                        product_variant_id: item.product_variant_id || 0,
                        product_name: item.product_name || 'Unknown',
                        variant_info: item.variant_info || 'Standard',
                        current_stock: item.current_stock || 0,
                        new_quantity: (item.current_stock || 0) + 10,
                    }),
                ),
                ...(Array.isArray(safeAnalyticsData.inventory.outOfStockProducts) ? safeAnalyticsData.inventory.outOfStockProducts : []).map(
                    (item: { product_variant_id?: number; product_name: string; variant_info: string }) => ({
                        product_variant_id: item.product_variant_id || 0,
                        product_name: item.product_name || 'Unknown',
                        variant_info: item.variant_info || 'Standard',
                        current_stock: 0,
                        new_quantity: 20,
                    }),
                ),
            ];
            setRestockItems(items);
        }
    }, [safeAnalyticsData]);

    // Fetch restock recommendations when smart restock dialog opens
    useEffect(() => {
        if (smartRestockDialogOpen && selectedProductForRestock && !restockRecommendations) {
            fetchRestockRecommendations(selectedProductForRestock);
        }
    }, [smartRestockDialogOpen, selectedProductForRestock]);

    const handleRestock = async () => {
        setRestockLoading(true);
        try {
            console.log('Restocking items:', restockItems);
            await router.post('/restock', { items: restockItems } as any);
            setRestockDialogOpen(false);
            // The page will refresh automatically due to the redirect
        } catch (error) {
            console.error('Restock failed:', error);
        } finally {
            setRestockLoading(false);
        }
    };

    const updateRestockQuantity = (index: number, quantity: number) => {
        setRestockItems((prev) => prev.map((item, i) => (i === index ? { ...item, new_quantity: quantity } : item)));
    };

    const fetchRestockRecommendations = async (productId: number) => {
        try {
            const response = await fetch(`/dashboard/restock-recommendations?product_id=${productId}`);
            if (response.ok) {
                const data = await response.json();
                setRestockRecommendations(data);
            }
        } catch (error) {
            console.error('Failed to fetch restock recommendations:', error);
        }
    };

    const handleSmartRestock = async () => {
        if (!restockRecommendations) return;

        setRestockLoading(true);
        try {
            const items = restockRecommendations.recommendations.map((rec: { variant_id: number; recommended_quantity: number }) => ({
                product_variant_id: rec.variant_id,
                new_quantity: rec.recommended_quantity,
            }));

            await router.post('/restock', { items: items });
            setSmartRestockDialogOpen(false);
            setRestockRecommendations(null);
            setSelectedProductForRestock(null);
        } catch (error) {
            console.error('Smart restock failed:', error);
        } finally {
            setRestockLoading(false);
        }
    };

    if (!analyticsData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Admin Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="flex h-64 items-center justify-center">
                        <div className="flex items-center space-x-2">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span>Loading analytics...</span>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const sales = safeAnalyticsData?.sales || {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        bestSellingProducts: [],
        salesByCategory: [],
        salesTrends: [],
    };
    const inventory = safeAnalyticsData?.inventory || {
        totalProducts: 0,
        lowStockProducts: [],
        outOfStockProducts: [],
        totalCostValue: 0,
        totalRetailValue: 0,
        inventoryTurnoverRate: 0,
    };
    const profits = safeAnalyticsData?.profits || { totalProfit: 0, totalRevenue: 0, profitMargin: 0, profitTrends: [] };
    const topEntities = safeAnalyticsData?.topEntities || { topManagers: [], topProducts: [], topCategories: [] };

    console.log('Chart data - Sales trends:', sales.salesTrends);
    console.log('Chart data - Profit trends:', profits.profitTrends);

    // If safeAnalyticsData is null, show loading state
    if (!safeAnalyticsData) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Admin Dashboard" />
                <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                    <div className="flex h-64 items-center justify-center">
                        <div className="flex items-center space-x-2">
                            <RefreshCw className="h-6 w-6 animate-spin" />
                            <span>Loading analytics...</span>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Success/Error Messages */}
                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                                <p className="text-sm text-green-700">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error!</h3>
                                <p className="text-sm text-red-700">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="space-y-4">
                    {/* Mobile Header - Compact and Creative */}
                    <div className="sm:hidden">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                                    <BarChart3 className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
                                    <p className="text-xs text-muted-foreground">Analytics Overview</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={fetchAnalytics}
                                    disabled={loading}
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                                >
                                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                                <NotificationsDropdown
                                    notifications={localNotifications}
                                    unreadCount={localUnreadCount}
                                    onNotificationRead={handleNotificationRead}
                                />
                            </div>
                        </div>

                        {/* Mobile Filter Bar */}
                        <div className="mt-4 flex items-center justify-between rounded-xl border bg-gradient-to-r from-gray-50 to-white p-3 shadow-sm dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
                            </div>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="h-8 w-32 border-0 bg-transparent p-0 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                    <SelectItem value="year">This Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden sm:flex sm:items-center sm:justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <Select value={dateRange} onValueChange={setDateRange}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="day">Today</SelectItem>
                                        <SelectItem value="week">This Week</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                        <SelectItem value="year">This Year</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button onClick={fetchAnalytics} disabled={loading} variant="outline" size="sm" className="shadow-sm">
                                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>
                        <NotificationsDropdown
                            notifications={localNotifications}
                            unreadCount={localUnreadCount}
                            onNotificationRead={handleNotificationRead}
                        />
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-lg font-bold sm:text-xl lg:text-2xl">{formatCurrency(sales?.totalSales || 0)}</div>
                            <p className="text-xs text-muted-foreground">{sales?.totalOrders || 0} orders</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">Total Profit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-lg font-bold sm:text-xl lg:text-2xl">{formatCurrency(profits?.totalProfit || 0)}</div>
                            <p className="text-xs text-muted-foreground">{(profits?.profitMargin || 0).toFixed(1)}% margin</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">Average Order</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-lg font-bold sm:text-xl lg:text-2xl">{formatCurrency(sales?.averageOrderValue || 0)}</div>
                            <p className="text-xs text-muted-foreground">per order</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">Inventory Value</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-lg font-bold sm:text-xl lg:text-2xl">{formatCurrency(inventory?.totalRetailValue || 0)}</div>
                            <p className="text-xs text-muted-foreground">{inventory?.totalProducts || 0} products</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Analytics */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="sales">Sales</TabsTrigger>
                        <TabsTrigger value="inventory">Inventory</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {/* Sales Trends Chart */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="px-4 py-4 md:px-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                        <span>Sales Performance (30 Days) - KSH</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-6 md:px-6">
                                    {Array.isArray(sales?.salesTrends) && sales.salesTrends.length > 0 ? (
                                        <div className="space-y-6">
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                                                <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 dark:from-green-900/30 dark:to-green-900/20">
                                                    <div className="mb-1 text-xs font-medium text-green-600 sm:text-sm dark:text-green-400">
                                                        Total Revenue
                                                    </div>
                                                    <div className="text-lg font-bold text-green-800 sm:text-xl lg:text-2xl dark:text-green-100">
                                                        {formatChartNumber(
                                                            sales.salesTrends.reduce(
                                                                (sum: number, day: { revenue: number }) => sum + (day.revenue || 0),
                                                                0,
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 dark:from-blue-900/30 dark:to-blue-900/20">
                                                    <div className="mb-1 text-xs font-medium text-blue-600 sm:text-sm dark:text-blue-400">
                                                        Total Orders
                                                    </div>
                                                    <div className="text-lg font-bold text-blue-800 sm:text-xl lg:text-2xl dark:text-blue-100">
                                                        {sales.salesTrends.reduce(
                                                            (sum: number, day: { orders: number }) => sum + (day.orders || 0),
                                                            0,
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 dark:from-purple-900/30 dark:to-purple-900/20">
                                                    <div className="mb-1 text-xs font-medium text-purple-600 sm:text-sm dark:text-purple-400">
                                                        Avg Daily Revenue
                                                    </div>
                                                    <div className="text-lg font-bold text-purple-800 sm:text-xl lg:text-2xl dark:text-purple-100">
                                                        {sales.salesTrends.length > 0
                                                            ? formatChartNumber(
                                                                  Math.round(
                                                                      sales.salesTrends.reduce(
                                                                          (sum: number, day: { revenue: number }) => sum + (day.revenue || 0),
                                                                          0,
                                                                      ) / sales.salesTrends.length,
                                                                  ),
                                                              )
                                                            : formatChartNumber(0)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chart */}
                                            <div className="h-48 sm:h-64 lg:h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={sales.salesTrends} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                                                        <defs>
                                                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickFormatter={(value) =>
                                                                new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                            }
                                                            stroke="#6b7280"
                                                            fontSize={12}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickMargin={10}
                                                        />
                                                        <YAxis
                                                            stroke="#6b7280"
                                                            fontSize={12}
                                                            tickFormatter={(value) => formatChartNumber(value)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            width={60}
                                                        />
                                                        <Tooltip
                                                            content={({ payload, label }) => (
                                                                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                                                    <p className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                                                                        {label
                                                                            ? new Date(label).toLocaleDateString('en-US', {
                                                                                  weekday: 'short',
                                                                                  month: 'short',
                                                                                  day: 'numeric',
                                                                              })
                                                                            : ''}
                                                                    </p>
                                                                    {payload?.map((entry, index) => (
                                                                        <div key={`tooltip-${index}`} className="flex items-center justify-between">
                                                                            <div className="flex items-center">
                                                                                <div
                                                                                    className="mr-2 h-3 w-3 rounded-full"
                                                                                    style={{ backgroundColor: entry.color }}
                                                                                />
                                                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                                                    {entry.name === 'revenue' ? 'Revenue' : 'Orders'}
                                                                                </span>
                                                                            </div>
                                                                            <span className="ml-4 font-medium text-gray-900 dark:text-gray-100">
                                                                                {entry.name === 'revenue'
                                                                                    ? formatChartNumber(entry.value as number)
                                                                                    : entry.value}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="#10b981"
                                                            fill="url(#revenueGradient)"
                                                            strokeWidth={2}
                                                            activeDot={{ r: 6, strokeWidth: 2 }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="orders"
                                                            stroke="#3b82f6"
                                                            strokeWidth={2}
                                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                                            activeDot={{ r: 6, strokeWidth: 2 }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-48 items-center justify-center text-muted-foreground sm:h-64 lg:h-80">
                                            <div className="text-center">
                                                <BarChart3 className="mx-auto mb-4 h-12 w-12" />
                                                <p className="text-base font-medium">No sales data available</p>
                                                <p className="mt-1 text-sm">Sales data will appear here once available</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Profit Trends Chart */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="px-4 py-4 md:px-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                        <span>Profit Analysis (30 Days) - KSH</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-6 md:px-6">
                                    {Array.isArray(profits?.profitTrends) && profits.profitTrends.length > 0 ? (
                                        <div className="space-y-6">
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                                <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 dark:from-green-900/30 dark:to-green-900/20">
                                                    <div className="mb-1 text-xs font-medium text-green-600 sm:text-sm dark:text-green-400">
                                                        Total Profit
                                                    </div>
                                                    <div className="text-lg font-bold text-green-800 sm:text-xl lg:text-2xl dark:text-green-100">
                                                        {formatChartNumber(
                                                            profits.profitTrends.reduce((sum, day) => sum + (day.daily_profit || 0), 0),
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 dark:from-purple-900/30 dark:to-purple-900/20">
                                                    <div className="mb-1 text-xs font-medium text-purple-600 sm:text-sm dark:text-purple-400">
                                                        Avg Daily Profit
                                                    </div>
                                                    <div className="text-lg font-bold text-purple-800 sm:text-xl lg:text-2xl dark:text-purple-100">
                                                        {profits.profitTrends.length > 0
                                                            ? formatChartNumber(
                                                                  Math.round(
                                                                      profits.profitTrends.reduce((sum, day) => sum + (day.daily_profit || 0), 0) /
                                                                          profits.profitTrends.length,
                                                                  ),
                                                              )
                                                            : formatChartNumber(0)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chart */}
                                            <div className="h-48 sm:h-64 lg:h-80">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={profits.profitTrends} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickFormatter={(value) =>
                                                                new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                                            }
                                                            stroke="#6b7280"
                                                            fontSize={12}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tickMargin={10}
                                                        />
                                                        <YAxis
                                                            stroke="#6b7280"
                                                            fontSize={12}
                                                            tickFormatter={(value) => formatChartNumber(value)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                            width={60}
                                                        />
                                                        <Tooltip
                                                            content={({ payload, label }) => (
                                                                <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                                                    <p className="mb-1 font-medium text-gray-900 dark:text-gray-100">
                                                                        {label
                                                                            ? new Date(label).toLocaleDateString('en-US', {
                                                                                  weekday: 'short',
                                                                                  month: 'short',
                                                                                  day: 'numeric',
                                                                              })
                                                                            : ''}
                                                                    </p>
                                                                    {payload?.map((entry, index) => (
                                                                        <div key={`tooltip-${index}`} className="flex items-center justify-between">
                                                                            <div className="flex items-center">
                                                                                <div
                                                                                    className="mr-2 h-3 w-3 rounded-full"
                                                                                    style={{
                                                                                        backgroundColor: entry.color,
                                                                                    }}
                                                                                />
                                                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                                                    Profit
                                                                                </span>
                                                                            </div>
                                                                            <span className="ml-4 font-medium text-gray-900 dark:text-gray-100">
                                                                                {formatChartNumber(entry.value as number)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="daily_profit"
                                                            stroke="#10b981"
                                                            strokeWidth={3}
                                                            dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                                                            activeDot={{ r: 6, strokeWidth: 2 }}
                                                            name="Profit"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-48 items-center justify-center text-muted-foreground sm:h-64 lg:h-80">
                                            <div className="text-center">
                                                <TrendingUp className="mx-auto mb-4 h-12 w-12" />
                                                <p className="text-base font-medium">No profit data available</p>
                                                <p className="mt-1 text-sm">Profit data will appear here once available</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="sales" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {/* Best Selling Products */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Target className="mr-2 h-5 w-5" />
                                        Best Selling Products
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Array.isArray(sales?.bestSellingProducts)
                                            ? (Array.isArray(sales.bestSellingProducts) ? sales.bestSellingProducts.slice(0, 5) : []).map(
                                                  (product, index) => (
                                                      <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                          <div>
                                                              <p className="font-medium">{product.product_name}</p>
                                                              <p className="text-sm text-muted-foreground">{product.variant_info}</p>
                                                          </div>
                                                          <div className="text-right">
                                                              <p className="font-medium">{product.total_sold} sold</p>
                                                              <p className="text-sm text-muted-foreground">{formatCurrency(product.total_revenue)}</p>
                                                          </div>
                                                      </div>
                                                  ),
                                              )
                                            : null}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sales by Category */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <ShoppingCart className="mr-2 h-5 w-5" />
                                        Sales by Category
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Array.isArray(sales?.salesByCategory)
                                            ? (Array.isArray(sales.salesByCategory) ? sales.salesByCategory.slice(0, 5) : []).map(
                                                  (category, index) => (
                                                      <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                          <div>
                                                              <p className="font-medium">{category.category}</p>
                                                              <p className="text-sm text-muted-foreground">{category.total_sold} units</p>
                                                          </div>
                                                          <div className="text-right">
                                                              <p className="font-medium">{formatCurrency(category.total_revenue)}</p>
                                                          </div>
                                                      </div>
                                                  ),
                                              )
                                            : null}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {/* Low Stock Products */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <AlertTriangle className="mr-2 h-5 w-5" />
                                        Low Stock Products
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Array.isArray(inventory?.lowStockProducts)
                                            ? (Array.isArray(inventory.lowStockProducts) ? inventory.lowStockProducts.slice(0, 5) : []).map(
                                                  (product, index) => (
                                                      <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                          <div>
                                                              <p className="font-medium">{product.product_name}</p>
                                                              <p className="text-sm text-muted-foreground">{product.variant_info}</p>
                                                          </div>
                                                          <div className="text-right">
                                                              <Badge variant="secondary">{product.current_stock} left</Badge>
                                                          </div>
                                                      </div>
                                                  ),
                                              )
                                            : null}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Out of Stock Products */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <XCircle className="mr-2 h-5 w-5" />
                                        Out of Stock Products
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Array.isArray(inventory?.outOfStockProducts)
                                            ? (Array.isArray(inventory.outOfStockProducts) ? inventory.outOfStockProducts.slice(0, 5) : []).map(
                                                  (product, index) => (
                                                      <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                          <div>
                                                              <p className="font-medium">{product.product_name}</p>
                                                              <p className="text-sm text-muted-foreground">{product.variant_info}</p>
                                                          </div>
                                                          <div className="text-right">
                                                              <Badge variant="destructive">Out of Stock</Badge>
                                                          </div>
                                                      </div>
                                                  ),
                                              )
                                            : null}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Restock Action */}
                        {restockItems.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Zap className="mr-2 h-5 w-5" />
                                        Quick Restock
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Dialog open={restockDialogOpen} onOpenChange={setRestockDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full">
                                                <Plus className="mr-2 h-4 w-4" />
                                                Restock Low Stock Items
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Restock Inventory</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                {restockItems.map((item, index) => (
                                                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                        <div className="flex-1">
                                                            <p className="font-medium">{item.product_name}</p>
                                                            <p className="text-sm text-muted-foreground">{item.variant_info}</p>
                                                            <p className="text-xs text-muted-foreground">Current: {item.current_stock}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <Label htmlFor={`quantity-${index}`}>New Quantity:</Label>
                                                            <Input
                                                                id={`quantity-${index}`}
                                                                type="number"
                                                                value={item.new_quantity}
                                                                onChange={(e) => updateRestockQuantity(index, parseInt(e.target.value) || 0)}
                                                                className="w-20"
                                                                min="0"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                <Separator />
                                                <div className="flex justify-end space-x-2">
                                                    <Button variant="outline" onClick={() => setRestockDialogOpen(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={handleRestock} disabled={restockLoading}>
                                                        {restockLoading ? (
                                                            <>
                                                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                                Restocking...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                Restock Items
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Zap className="mr-2 h-5 w-5" />
                                        Inventory Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="py-4 text-center">
                                        <Package className="mx-auto mb-2 h-12 w-12 text-green-500" />
                                        <p className="text-lg font-medium text-green-600">All Products Well Stocked!</p>
                                        <p className="text-sm text-muted-foreground">No low stock or out of stock items found.</p>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Smart Restock Dialog */}
                        <Dialog open={smartRestockDialogOpen} onOpenChange={setSmartRestockDialogOpen}>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Smart Restock - {restockRecommendations?.product_name || 'Product'}</DialogTitle>
                                </DialogHeader>
                                {selectedProductForRestock && !restockRecommendations && (
                                    <div className="flex items-center justify-center py-8">
                                        <RefreshCw className="h-6 w-6 animate-spin" />
                                        <span className="ml-2">Loading recommendations...</span>
                                    </div>
                                )}
                                {restockRecommendations && (
                                    <div className="space-y-4">
                                        <div className="grid gap-4">
                                            {restockRecommendations.recommendations.map((rec, index: number) => (
                                                <div key={index} className="flex items-center justify-between rounded-lg border p-4">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{rec.variant_info}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Current: {rec.current_quantity} | Recommended: {rec.recommended_quantity}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Cost: {formatCurrency(rec.cost_price)} | Price: {formatCurrency(rec.selling_price)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Label htmlFor={`smart-quantity-${index}`}>Quantity:</Label>
                                                        <Input
                                                            id={`smart-quantity-${index}`}
                                                            type="number"
                                                            value={rec.recommended_quantity}
                                                            onChange={(e) => {
                                                                const newRecommendations = { ...restockRecommendations };
                                                                newRecommendations.recommendations[index].recommended_quantity =
                                                                    parseInt(e.target.value) || 0;
                                                                setRestockRecommendations(newRecommendations);
                                                            }}
                                                            className="w-20"
                                                            min="0"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator />
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setSmartRestockDialogOpen(false);
                                                    setRestockRecommendations(null);
                                                    setSelectedProductForRestock(null);
                                                }}
                                            >
                                                Cancel
                                            </Button>
                                            <Button onClick={handleSmartRestock} disabled={restockLoading}>
                                                {restockLoading ? (
                                                    <>
                                                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                                        Restocking...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Restock with Recommendations
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                            {/* Top Managers */}
                            {topEntities?.topManagers && topEntities.topManagers.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <User className="mr-2 h-5 w-5" />
                                            Top Performing Managers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {(Array.isArray(topEntities?.topManagers) ? topEntities.topManagers : []).map((manager, index) => (
                                                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{manager.manager_name}</p>
                                                            <p className="text-sm text-muted-foreground">{manager.sales_count} sales</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">{formatCurrency(manager.total_revenue)}</p>
                                                        <Link
                                                            href={`/manager/${manager.manager_id}`}
                                                            className="text-sm text-blue-600 hover:underline"
                                                        >
                                                            View Sales
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Top Categories */}
                            {topEntities?.topCategories?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center">
                                            <Package className="mr-2 h-5 w-5" />
                                            Top Categories
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {(Array.isArray(topEntities?.topCategories) ? topEntities.topCategories : []).map((category, index) => (
                                                <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                                                            {index + 1}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{category.category}</p>
                                                            <p className="text-sm text-muted-foreground">{category.total_sold} units sold</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">{formatCurrency(category.total_revenue)}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Link href="/products">
                                <Button className="w-full" variant="outline">
                                    <Package className="mr-2 h-4 w-4" />
                                    Manage Products
                                </Button>
                            </Link>
                            <Link href="/users">
                                <Button className="w-full" variant="outline">
                                    <Users className="mr-2 h-4 w-4" />
                                    Manage Users
                                </Button>
                            </Link>
                            <Link href="/sales">
                                <Button className="w-full" variant="outline">
                                    <Receipt className="mr-2 h-4 w-4" />
                                    View All Sales
                                </Button>
                            </Link>
                            <Button className="w-full" variant="outline" onClick={() => setRestockDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Restock Items
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
