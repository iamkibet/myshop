import NotificationsDropdown from '@/components/notifications-dropdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { PieChart } from '@/components/ui/pie-chart';

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
            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-2 sm:p-4 pb-20 sm:pb-4">
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
                <div className="space-y-3 sm:space-y-4">
                    {/* Mobile Header - Professional Design */}
                    <div className="sm:hidden">
                        <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center space-x-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                    <BarChart3 className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold">Dashboard</h1>
                                    <p className="text-sm text-blue-100">Inventory Management</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={fetchAnalytics}
                                    disabled={loading}
                                    variant="ghost"
                                    size="icon"
                                    className="h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 text-white border-0"
                                >
                                    <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                                </Button>
                                <NotificationsDropdown
                                    notifications={localNotifications}
                                    unreadCount={localUnreadCount}
                                    onNotificationRead={handleNotificationRead}
                                />
                            </div>
                        </div>

                        {/* Mobile Filter Bar - Compact */}
                        <div className="mt-3 flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                            <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Period:</span>
                            </div>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="h-8 w-28 border-0 bg-transparent p-0 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="day">Today</SelectItem>
                                    <SelectItem value="week">Week</SelectItem>
                                    <SelectItem value="month">Month</SelectItem>
                                    <SelectItem value="year">Year</SelectItem>
                                    <SelectItem value="lifetime">Lifetime</SelectItem>
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
                                        <SelectItem value="lifetime">Lifetime</SelectItem>
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
                <div className="grid grid-cols-1 gap-2 sm:gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">
                                {dateRange === 'day' ? 'Today\'s Revenue' : 
                                 dateRange === 'week' ? 'This Week\'s Revenue' : 
                                 dateRange === 'month' ? 'This Month\'s Revenue' : 
                                 dateRange === 'year' ? 'This Year\'s Revenue' : 
                                 dateRange === 'lifetime' ? 'Lifetime Revenue' : 'Period Revenue'}
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-lg font-bold sm:text-xl lg:text-2xl">{formatCurrency(sales?.totalSales || 0)}</div>
                            <p className="text-xs text-muted-foreground">
                                {sales?.totalOrders || 0} orders
                                <span className="block text-xs text-green-600 dark:text-green-400 mt-1">
                                    {dateRange === 'day' ? 'Today only' : 
                                     dateRange === 'week' ? 'This week only' : 
                                     dateRange === 'month' ? 'This month only' : 
                                     dateRange === 'year' ? 'This year only' : 
                                     dateRange === 'lifetime' ? 'All time' : 'Selected period'}
                                </span>
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">Net Profit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-lg font-bold sm:text-xl lg:text-2xl">{formatCurrency(profits?.totalProfit || 0)}</div>
                            <p className="text-xs text-muted-foreground">Sales minus expenses • {(profits?.profitMargin || 0).toFixed(1)}% margin</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-xs font-medium sm:text-sm">
                                {dateRange === 'day' ? 'Today\'s Avg Order' : 
                                 dateRange === 'week' ? 'This Week\'s Avg Order' : 
                                 dateRange === 'month' ? 'This Month\'s Avg Order' : 
                                 dateRange === 'year' ? 'This Year\'s Avg Order' : 
                                 dateRange === 'lifetime' ? 'Lifetime Avg Order' : 'Period Avg Order'}
                            </CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-lg font-bold sm:text-xl lg:text-2xl">{formatCurrency(sales?.averageOrderValue || 0)}</div>
                            <p className="text-xs text-muted-foreground">
                                per order
                                <span className="block text-xs text-purple-600 dark:text-purple-400 mt-1">
                                    {dateRange === 'day' ? 'Today only' : 
                                     dateRange === 'week' ? 'This week only' : 
                                     dateRange === 'month' ? 'This month only' : 
                                     dateRange === 'year' ? 'This year only' : 
                                     dateRange === 'lifetime' ? 'All time' : 'Selected period'}
                                </span>
                            </p>
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
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
                    {/* Mobile Tabs - Horizontal Scrollable */}
                    <div className="sm:hidden">
                        <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                    activeTab === 'overview'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Overview
                            </button>
                            <button
                                onClick={() => setActiveTab('sales')}
                                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                    activeTab === 'sales'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Sales
                            </button>
                            <button
                                onClick={() => setActiveTab('inventory')}
                                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                    activeTab === 'inventory'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Inventory
                            </button>
                            <button
                                onClick={() => setActiveTab('performance')}
                                className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                                    activeTab === 'performance'
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                Performance
                            </button>
                        </div>
                    </div>

                    {/* Desktop Tabs */}
                    <TabsList className="hidden sm:grid w-full grid-cols-2 lg:grid-cols-4 overflow-x-auto">
                        <TabsTrigger value="overview" className="whitespace-nowrap">Overview</TabsTrigger>
                        <TabsTrigger value="sales" className="whitespace-nowrap">Sales</TabsTrigger>
                        <TabsTrigger value="inventory" className="whitespace-nowrap">Inventory</TabsTrigger>
                        <TabsTrigger value="performance" className="whitespace-nowrap">Performance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-3 sm:space-y-4">
                        {/* Mobile Overview Summary Cards */}
                        <div className="sm:hidden space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 dark:from-green-900/30 dark:to-green-900/20">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                                            <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-green-600 dark:text-green-400">
                                                {dateRange === 'day' ? 'Today\'s Revenue' : 
                                                 dateRange === 'week' ? 'Week Revenue' : 
                                                 dateRange === 'month' ? 'Month Revenue' : 
                                                 dateRange === 'year' ? 'Year Revenue' : 
                                                 dateRange === 'lifetime' ? 'Lifetime Revenue' : 'Revenue'}
                                            </p>
                                            <p className="text-lg font-bold text-green-800 dark:text-green-100">
                                                {Array.isArray(sales?.salesTrends) && sales.salesTrends.length > 0
                                                    ? formatCurrency(
                                                          sales.salesTrends.reduce(
                                                              (sum: number, day: { revenue: number }) => sum + (day.revenue || 0),
                                                              0,
                                                          ),
                                                      )
                                                    : '0'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:from-blue-900/30 dark:to-blue-900/20">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                                                {dateRange === 'day' ? 'Today\'s Orders' : 
                                                 dateRange === 'week' ? 'Week Orders' : 
                                                 dateRange === 'month' ? 'Month Orders' : 
                                                 dateRange === 'year' ? 'Year Orders' : 
                                                 dateRange === 'lifetime' ? 'Lifetime Orders' : 'Orders'}
                                            </p>
                                            <p className="text-lg font-bold text-blue-800 dark:text-blue-100">
                                                {Array.isArray(sales?.salesTrends) && sales.salesTrends.length > 0
                                                    ? sales.salesTrends.reduce(
                                                          (sum: number, day: { orders: number }) => sum + (day.orders || 0),
                                                          0,
                                                      )
                                                    : '0'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Period Summary Banner */}
                        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                        {dateRange === 'day' ? 'Today\'s Performance' : 
                                         dateRange === 'week' ? 'This Week\'s Performance' : 
                                         dateRange === 'month' ? 'This Month\'s Performance' : 
                                         dateRange === 'year' ? 'This Year\'s Performance' : 
                                         dateRange === 'lifetime' ? 'Lifetime Performance' : 'Period Performance'}
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        {dateRange === 'day' ? 'Real-time data for today' : 
                                         dateRange === 'week' ? 'Weekly aggregated data' : 
                                         dateRange === 'month' ? 'Monthly aggregated data' : 
                                         dateRange === 'year' ? 'Yearly aggregated data' : 
                                         dateRange === 'lifetime' ? 'Complete business history' : 'Last 30 days data'}
                                    </p>
                                </div>
                                <Button 
                                    onClick={fetchAnalytics} 
                                    disabled={loading} 
                                    variant="outline" 
                                    size="sm"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/30"
                                >
                                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                    Refresh
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
                            {/* Sales Trends Chart */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="px-4 py-4 md:px-6">
                                    <CardTitle className="flex items-center gap-2">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm sm:text-base">
                                            Sales Performance 
                                            {dateRange === 'day' ? ' (Today)' : 
                                             dateRange === 'week' ? ' (This Week)' : 
                                             dateRange === 'month' ? ' (This Month)' : 
                                             dateRange === 'year' ? ' (This Year)' : 
                                             dateRange === 'lifetime' ? ' (All Time)' : ' (30 Days)'} - KSH
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-6 md:px-6">
                                    {loading ? (
                                        <div className="flex h-48 items-center justify-center text-muted-foreground sm:h-64 lg:h-80">
                                            <div className="text-center">
                                                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
                                                <p className="text-base font-medium">Loading sales data...</p>
                                                <p className="mt-1 text-sm">Please wait while we fetch your data</p>
                                            </div>
                                        </div>
                                    ) : Array.isArray(sales?.salesTrends) && sales.salesTrends.length > 0 ? (
                                        <div className="space-y-4 sm:space-y-6">
                                            {/* Summary Cards - Desktop Only */}
                                            <div className="hidden sm:grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
                                                <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 dark:from-green-900/30 dark:to-green-900/20">
                                                    <div className="mb-1 text-xs font-medium text-green-600 sm:text-sm dark:text-green-400">
                                                        {dateRange === 'day' ? 'Today\'s Revenue' : 
                                                         dateRange === 'week' ? 'Week Revenue' : 
                                                         dateRange === 'month' ? 'Month Revenue' : 
                                                         dateRange === 'year' ? 'Year Revenue' : 
                                                         dateRange === 'lifetime' ? 'Lifetime Revenue' : 'Total Revenue'}
                                                    </div>
                                                    <div className="text-lg font-bold text-green-800 sm:text-xl lg:text-2xl dark:text-green-100">
                                                        {formatCurrency(
                                                            sales.salesTrends.reduce(
                                                                (sum: number, day: { revenue: number }) => sum + (day.revenue || 0),
                                                                0,
                                                            ),
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 dark:from-blue-900/30 dark:to-blue-900/20">
                                                    <div className="mb-1 text-xs font-medium text-blue-600 sm:text-sm dark:text-blue-400">
                                                        {dateRange === 'day' ? 'Today\'s Orders' : 
                                                         dateRange === 'week' ? 'Week Orders' : 
                                                         dateRange === 'month' ? 'Month Orders' : 
                                                         dateRange === 'year' ? 'Year Orders' : 
                                                         dateRange === 'lifetime' ? 'Lifetime Orders' : 'Total Orders'}
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
                                                        {dateRange === 'day' ? 'Today\'s Revenue' : 
                                                         dateRange === 'week' ? 'Avg Daily Revenue' : 
                                                         dateRange === 'month' ? 'Avg Daily Revenue' : 
                                                         dateRange === 'year' ? 'Avg Daily Revenue' : 
                                                         dateRange === 'lifetime' ? 'Avg Monthly Revenue' : 'Avg Daily Revenue'}
                                                    </div>
                                                    <div className="text-lg font-bold text-purple-800 sm:text-xl lg:text-2xl dark:text-green-100">
                                                        {sales.salesTrends.length > 0
                                                            ? formatCurrency(
                                                                  Math.round(
                                                                      sales.salesTrends.reduce(
                                                                          (sum: number, day: { revenue: number }) => sum + (day.revenue || 0),
                                                                          0,
                                                                      ) / sales.salesTrends.length,
                                                                  ),
                                                              )
                                                            : formatCurrency(0)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chart Legend & Insights */}
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-center space-x-6 text-sm">
                                                    <div className="flex items-center space-x-2">
                                                        <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                                        <span className="text-green-700 dark:text-green-300">Revenue</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                                        <span className="text-blue-700 dark:text-blue-300">Orders</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Data Insights */}
                                                {sales.salesTrends.length > 1 && (
                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                            <p className="text-green-600 dark:text-green-400 font-medium">Trend</p>
                                                            <p className="text-green-800 dark:text-green-200">
                                                                {(() => {
                                                                    const firstHalf = sales.salesTrends.slice(0, Math.ceil(sales.salesTrends.length / 2));
                                                                    const secondHalf = sales.salesTrends.slice(Math.ceil(sales.salesTrends.length / 2));
                                                                    const firstAvg = firstHalf.reduce((sum: number, day: { revenue: number }) => sum + (day.revenue || 0), 0) / firstHalf.length;
                                                                    const secondAvg = secondHalf.reduce((sum: number, day: { revenue: number }) => sum + (day.revenue || 0), 0) / secondHalf.length;
                                                                    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
                                                                    return change > 0 ? `↗️ +${change.toFixed(1)}%` : 
                                                                           change < 0 ? `↘️ ${change.toFixed(1)}%` : '→ Stable';
                                                                })()}
                                                            </p>
                                                        </div>
                                                        <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                            <p className="text-blue-600 dark:text-blue-400 font-medium">Peak Day</p>
                                                            <p className="text-blue-800 dark:text-blue-200">
                                                                {(() => {
                                                                    const peakDay = sales.salesTrends.reduce((max: { revenue: number; date: string; orders: number }, day: { revenue: number; date: string; orders: number }) => 
                                                                        (day.revenue || 0) > (max.revenue || 0) ? day : max
                                                                    );
                                                                    return peakDay.date ? new Date(peakDay.date).toLocaleDateString('en-US', { 
                                                                        month: 'short', 
                                                                        day: 'numeric' 
                                                                    }) : 'N/A';
                                                                })()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Chart */}
                                            <div className="h-48 sm:h-64 lg:h-80 w-full overflow-hidden">
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
                                                                                    ? formatCurrency(entry.value as number)
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
                                                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                                <p className="text-base font-medium">No sales data available</p>
                                                <p className="mt-1 text-sm">
                                                    {dateRange === 'lifetime' ? 'No sales data found for the selected period' : 
                                                     'Sales data will appear here once available'}
                                                </p>
                                                <Button 
                                                    onClick={fetchAnalytics} 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="mt-3"
                                                >
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Refresh Data
                                                </Button>
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
                                        <span className="text-sm sm:text-base">
                                            Net Profit Analysis 
                                            {dateRange === 'day' ? ' (Today)' : 
                                             dateRange === 'week' ? ' (This Week)' : 
                                             dateRange === 'month' ? ' (This Month)' : 
                                             dateRange === 'year' ? ' (This Year)' : 
                                             dateRange === 'lifetime' ? ' (All Time)' : ' (30 Days)'} - KSH
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-6 md:px-6">
                                    {loading ? (
                                        <div className="flex h-48 items-center justify-center text-muted-foreground sm:h-64 lg:h-80">
                                            <div className="text-center">
                                                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-600"></div>
                                                <p className="text-base font-medium">Loading profit data...</p>
                                                <p className="mt-1 text-sm">Please wait while we fetch your data</p>
                                            </div>
                                        </div>
                                    ) : Array.isArray(profits?.profitTrends) && profits.profitTrends.length > 0 ? (
                                        <div className="space-y-4 sm:space-y-6">
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                                                <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 dark:from-green-900/30 dark:to-green-900/20">
                                                    <div className="mb-1 text-xs font-medium text-green-600 sm:text-sm dark:text-green-400">
                                                        Net Profit
                                                    </div>
                                                    <div className="text-lg font-bold text-green-800 sm:text-xl lg:text-2xl dark:text-green-100">
                                                        {formatCurrency(
                                                            profits.profitTrends.reduce((sum, day) => sum + (day.daily_profit || 0), 0),
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                                        Sales minus expenses
                                                    </div>
                                                </div>

                                                <div className="rounded-lg border bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 dark:from-purple-900/30 dark:to-purple-900/20">
                                                    <div className="mb-1 text-xs font-medium text-purple-600 sm:text-sm dark:text-purple-400">
                                                        Avg Daily Net Profit
                                                    </div>
                                                    <div className="text-lg font-bold text-purple-800 sm:text-xl lg:text-2xl dark:text-purple-100">
                                                        {profits.profitTrends.length > 0
                                                            ? formatCurrency(
                                                                  Math.round(
                                                                      profits.profitTrends.reduce((sum, day) => sum + (day.daily_profit || 0), 0) /
                                                                          profits.profitTrends.length,
                                                                  ),
                                                              )
                                                            : formatCurrency(0)}
                                                    </div>
                                                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                                        After expenses
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Chart Legend */}
                                            <div className="flex items-center justify-center space-x-6 text-sm">
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                                                    <span className="text-green-700 dark:text-green-300">Net Profit</span>
                                                </div>
                                            </div>

                                            {/* Chart */}
                                            <div className="h-48 sm:h-64 lg:h-80 w-full overflow-hidden">
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
                                                                                    Net Profit
                                                                                </span>
                                                                            </div>
                                                                            <span className="ml-4 font-medium text-gray-900 dark:text-gray-100">
                                                                                {formatCurrency(entry.value as number)}
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
                                                            name="Net Profit"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-48 items-center justify-center text-muted-foreground sm:h-64 lg:h-80">
                                            <div className="text-center">
                                                <TrendingUp className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                                <p className="text-base font-medium">No net profit data available</p>
                                                <p className="mt-1 text-sm">
                                                    {dateRange === 'lifetime' ? 'No profit data found for the selected period' : 
                                                     'Net profit data will appear here once available'}
                                                </p>
                                                <Button 
                                                    onClick={fetchAnalytics} 
                                                    variant="outline" 
                                                    size="sm" 
                                                    className="mt-3"
                                                >
                                                    <RefreshCw className="mr-2 h-4 w-4" />
                                                    Refresh Data
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Product Performance Overview - Overview Section */}
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
                            {/* Top Products by Sales Volume */}
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="h-5 w-5 text-green-600" />
                                        <span className="text-sm sm:text-base">Top Products by Sales Volume</span>
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Products with highest units sold
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {Array.isArray(sales?.bestSellingProducts) && sales.bestSellingProducts.length > 0 ? (
                                            sales.bestSellingProducts.slice(0, 5).map((product, index) => (
                                                <Link 
                                                    key={index} 
                                                    href={`/products?search=${encodeURIComponent(product.product_name)}`}
                                                    className="block"
                                                >
                                                    <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer hover:border-green-300 hover:shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600 dark:bg-green-800 dark:text-green-400">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate hover:text-green-700 dark:hover:text-green-300">
                                                                    {product.product_name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {product.variant_info}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium">{product.total_sold} sold</p>
                                                            <p className="text-xs text-muted-foreground">{formatCurrency(product.total_revenue)}</p>
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-muted-foreground">
                                                <Target className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                <p className="text-sm">No product data available</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            
                        </div>
                    </TabsContent>

                    <TabsContent value="sales" className="space-y-3 sm:space-y-4">
                        {/* Mobile Sales Summary Cards */}
                        <div className="sm:hidden space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 dark:from-green-900/30 dark:to-green-900/20">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                                            <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-green-600 dark:text-green-400">Top Products</p>
                                            <p className="text-lg font-bold text-green-800 dark:text-green-100">
                                                {Array.isArray(sales?.bestSellingProducts) ? sales.bestSellingProducts.length : 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 dark:from-blue-900/30 dark:to-blue-900/20">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                            <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Categories</p>
                                            <p className="text-lg font-bold text-blue-800 dark:text-blue-100">
                                                {Array.isArray(sales?.salesByCategory) ? sales.salesByCategory.length : 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Grid Layout */}
                        <div className="hidden sm:grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
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
                                                      <Link 
                                                          key={index} 
                                                          href={`/products?search=${encodeURIComponent(product.product_name)}`}
                                                          className="block"
                                                      >
                                                          <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer hover:border-green-300 hover:shadow-sm">
                                                              <div>
                                                                  <p className="font-medium hover:text-green-700 dark:hover:text-green-300">{product.product_name}</p>
                                                                  <p className="text-sm text-muted-foreground">{product.variant_info}</p>
                                                              </div>
                                                              <div className="text-right">
                                                                  <p className="font-medium">{product.total_sold} sold</p>
                                                                  <p className="text-sm text-muted-foreground">{formatCurrency(product.total_revenue)}</p>
                                                              </div>
                                                          </div>
                                                      </Link>
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

                        {/* Mobile Product Cards */}
                        <div className="sm:hidden space-y-3">
                            {/* Best Selling Products Mobile */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-base">
                                        <Target className="mr-2 h-5 w-5 text-green-600" />
                                        Best Selling Products
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {Array.isArray(sales?.bestSellingProducts)
                                            ? (Array.isArray(sales.bestSellingProducts) ? sales.bestSellingProducts.slice(0, 3) : []).map(
                                                  (product, index) => (
                                                      <Link 
                                                          key={index} 
                                                          href={`/products?search=${encodeURIComponent(product.product_name)}`}
                                                          className="block"
                                                      >
                                                          <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer hover:border-green-300 hover:shadow-sm">
                                                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600 dark:bg-green-800 dark:text-green-400">
                                                                {index + 1}
                                                            </div>
                                                              <div className="flex-1 min-w-0">
                                                                  <p className="font-medium text-sm truncate hover:text-green-700 dark:hover:text-green-300">{product.product_name}</p>
                                                                  <p className="text-xs text-muted-foreground truncate">{product.variant_info}</p>
                                                              </div>
                                                              <div className="text-right">
                                                                  <p className="text-sm font-medium">{product.total_sold} sold</p>
                                                                  <p className="text-xs text-muted-foreground">{formatCurrency(product.total_revenue)}</p>
                                                              </div>
                                                          </div>
                                                      </Link>
                                                  ),
                                              )
                                            : (
                                                <div className="text-center py-6 text-muted-foreground">
                                                    <Target className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-sm">No sales data available</p>
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Sales by Category Mobile */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-base">
                                        <ShoppingCart className="mr-2 h-5 w-5 text-blue-600" />
                                        Sales by Category
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {Array.isArray(sales?.salesByCategory)
                                            ? (Array.isArray(sales.salesByCategory) ? sales.salesByCategory.slice(0, 3) : []).map(
                                                  (category, index) => (
                                                      <div key={index} className="flex items-center space-x-3 rounded-lg border p-3">
                                                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-800 dark:text-blue-400">
                                                            {index + 1}
                                                        </div>
                                                          <div className="flex-1 min-w-0">
                                                              <p className="font-medium text-sm truncate">{category.category}</p>
                                                              <p className="text-xs text-muted-foreground">{category.total_sold} units sold</p>
                                                          </div>
                                                          <div className="text-right">
                                                              <p className="text-sm font-medium">{formatCurrency(category.total_revenue)}</p>
                                                          </div>
                                                      </div>
                                                  ),
                                              )
                                            : (
                                                <div className="text-center py-6 text-muted-foreground">
                                                    <ShoppingCart className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-sm">No category data available</p>
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="inventory" className="space-y-3 sm:space-y-4">
                        {/* Mobile Inventory Summary Cards */}
                        <div className="sm:hidden space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 p-4 dark:from-amber-900/30 dark:to-amber-900/20">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-800">
                                            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Low Stock</p>
                                            <p className="text-lg font-bold text-amber-800 dark:text-amber-100">
                                                {Array.isArray(inventory?.lowStockProducts) ? inventory.lowStockProducts.length : 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-red-50 to-red-100 p-4 dark:from-red-900/30 dark:to-red-900/20">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-800">
                                            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-red-600 dark:text-red-400">Out of Stock</p>
                                            <p className="text-lg font-bold text-red-800 dark:text-red-100">
                                                {Array.isArray(inventory?.outOfStockProducts) ? inventory.outOfStockProducts.length : 0}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Grid Layout */}
                        <div className="hidden sm:grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-2">
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

                        {/* Mobile Inventory Cards */}
                        <div className="sm:hidden space-y-3">
                            {/* Low Stock Products Mobile */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-base">
                                        <AlertTriangle className="mr-2 h-5 w-5 text-amber-600" />
                                        Low Stock Products
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {Array.isArray(inventory?.lowStockProducts) && inventory.lowStockProducts.length > 0
                                            ? (Array.isArray(inventory.lowStockProducts) ? inventory.lowStockProducts.slice(0, 3) : []).map(
                                                  (product, index) => (
                                                      <div key={index} className="flex items-center space-x-3 rounded-lg border p-3">
                                                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600 dark:bg-amber-800 dark:text-amber-400">
                                                            {index + 1}
                                                        </div>
                                                          <div className="flex-1 min-w-0">
                                                              <p className="font-medium text-sm truncate">{product.product_name}</p>
                                                              <p className="text-xs text-muted-foreground truncate">{product.variant_info}</p>
                                                          </div>
                                                          <div className="text-right">
                                                              <Badge variant="secondary" className="text-xs">{product.current_stock} left</Badge>
                                                          </div>
                                                      </div>
                                                  ),
                                              )
                                            : (
                                                <div className="text-center py-6 text-muted-foreground">
                                                    <AlertTriangle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-sm">No low stock products</p>
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Out of Stock Products Mobile */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center text-base">
                                        <XCircle className="mr-2 h-5 w-5 text-red-600" />
                                        Out of Stock Products
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-3">
                                        {Array.isArray(inventory?.outOfStockProducts) && inventory.outOfStockProducts.length > 0
                                            ? (Array.isArray(inventory.outOfStockProducts) ? inventory.outOfStockProducts.slice(0, 3) : []).map(
                                                  (product, index) => (
                                                      <div key={index} className="flex items-center space-x-3 rounded-lg border p-3">
                                                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-600 dark:bg-red-800 dark:text-red-400">
                                                            {index + 1}
                                                        </div>
                                                          <div className="flex-1 min-w-0">
                                                              <p className="font-medium text-sm truncate">{product.product_name}</p>
                                                              <p className="text-xs text-muted-foreground truncate">{product.variant_info}</p>
                                                          </div>
                                                          <div className="text-right">
                                                              <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                                          </div>
                                                      </div>
                                                  ),
                                              )
                                            : (
                                                <div className="text-center py-6 text-muted-foreground">
                                                    <XCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                                    <p className="text-sm">No out of stock products</p>
                                                </div>
                                            )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Restock Action */}
                        <div className="pb-4 sm:pb-0">
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
                        </div>

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

                    <TabsContent value="performance" className="space-y-3 sm:space-y-4">
                        {/* Performance Overview Header */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Performance Analytics</h2>
                            <p className="text-gray-600 dark:text-gray-400">Top performers across products, managers, and categories</p>
                        </div>

                        {/* Mobile Performance Summary Cards */}
                        <div className="sm:hidden space-y-3">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 dark:from-emerald-900/30 dark:to-emerald-900/20">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800 mb-2">
                                            <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Top Products</p>
                                        <p className="text-lg font-bold text-emerald-800 dark:text-emerald-100">
                                            {topEntities?.topProducts?.length || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 dark:from-purple-900/30 dark:to-purple-900/20">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800 mb-2">
                                            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Top Managers</p>
                                        <p className="text-lg font-bold text-purple-800 dark:text-purple-100">
                                            {topEntities?.topManagers?.length || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 dark:from-indigo-900/30 dark:to-indigo-900/20">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-800 mb-2">
                                            <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Top Categories</p>
                                        <p className="text-lg font-bold text-indigo-800 dark:text-indigo-100">
                                            {topEntities?.topCategories?.length || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Desktop Performance Grid */}
                        <div className="hidden sm:grid grid-cols-1 gap-6 xl:grid-cols-3">
                            {/* Top Selling Products */}
                            {topEntities?.topProducts && topEntities.topProducts.length > 0 && (
                                <Card className="xl:col-span-1">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center text-lg">
                                            <Package className="mr-2 h-5 w-5 text-emerald-600" />
                                            Top Selling Products
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">Best performing products by units sold</p>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            {(Array.isArray(topEntities?.topProducts) ? topEntities.topProducts : []).slice(0, 5).map((product, index) => (
                                                <div key={index} className="group relative">
                                                    <Link 
                                                        href={`/products?search=${encodeURIComponent(product.product_name)}`}
                                                        className="block"
                                                    >
                                                        <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer group-hover:border-emerald-300 group-hover:shadow-sm">
                                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-800 dark:text-emerald-400">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{product.product_name}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{product.variant_info}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-emerald-600">{product.total_sold} sold</p>
                                                                <p className="text-xs text-muted-foreground">{formatCurrency(product.total_revenue)}</p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                    {index === 0 && (
                                                        <div className="absolute -top-2 -right-2">
                                                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-yellow-300">
                                                                🏆
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Top Performing Managers */}
                            {topEntities?.topManagers && topEntities.topManagers.length > 0 && (
                                <Card className="xl:col-span-1">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center text-lg">
                                            <User className="mr-2 h-5 w-5 text-purple-600" />
                                            Top Performing Managers
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">Managers with highest sales performance</p>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            {(Array.isArray(topEntities?.topManagers) ? topEntities.topManagers : []).slice(0, 5).map((manager, index) => (
                                                <div key={index} className="group relative">
                                                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600 dark:bg-purple-800 dark:text-purple-400">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{manager.manager_name}</p>
                                                            <p className="text-xs text-muted-foreground">{manager.sales_count} sales</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-purple-600">{formatCurrency(manager.total_revenue)}</p>
                                                            <Link
                                                                href={`/manager/${manager.manager_id}`}
                                                                className="text-xs text-blue-600 hover:underline block mt-1"
                                                            >
                                                                View Details
                                                            </Link>
                                                        </div>
                                                    </div>
                                                    {index === 0 && (
                                                        <div className="absolute -top-2 -right-2">
                                                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-yellow-300">
                                                                🏆
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Top Categories */}
                            {topEntities?.topCategories && topEntities.topCategories.length > 0 && (
                                <Card className="xl:col-span-1">
                                    <CardHeader className="pb-4">
                                        <CardTitle className="flex items-center text-lg">
                                            <BarChart3 className="mr-2 h-5 w-5 text-indigo-600" />
                                            Top Categories
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground">Categories with highest sales volume</p>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            {(Array.isArray(topEntities?.topCategories) ? topEntities.topCategories : []).slice(0, 5).map((category, index) => (
                                                <div key={index} className="group relative">
                                                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-800 dark:text-indigo-400">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{category.category}</p>
                                                            <p className="text-xs text-muted-foreground">{category.total_sold} units sold</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-indigo-600">{formatCurrency(category.total_revenue)}</p>
                                                        </div>
                                                    </div>
                                                    {index === 0 && (
                                                        <div className="absolute -top-2 -right-2">
                                                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-yellow-300">
                                                                🏆
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Mobile Performance Cards */}
                        <div className="sm:hidden space-y-3">
                            {/* Top Products Mobile */}
                            {topEntities?.topProducts && topEntities.topProducts.length > 0 ? (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center text-base">
                                            <Package className="mr-2 h-5 w-5 text-emerald-600" />
                                            Top Selling Products
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            {(Array.isArray(topEntities?.topProducts) ? topEntities.topProducts : []).slice(0, 3).map((product, index) => (
                                                <div key={index} className="group relative">
                                                    <Link 
                                                        href={`/products?search=${encodeURIComponent(product.product_name)}`}
                                                        className="block"
                                                    >
                                                        <div className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer group-hover:border-emerald-300 group-hover:shadow-sm">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-600 dark:bg-emerald-800 dark:text-emerald-400">
                                                                {index + 1}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300">{product.product_name}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{product.variant_info}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium text-emerald-600">{product.total_sold} sold</p>
                                                                <p className="text-xs text-muted-foreground">{formatCurrency(product.total_revenue)}</p>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                    {index === 0 && (
                                                        <div className="absolute -top-2 -right-2">
                                                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-yellow-300">
                                                                🏆
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center text-base">
                                            <Package className="mr-2 h-5 w-5 text-emerald-600" />
                                            Top Selling Products
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="text-center py-6 text-muted-foreground">
                                            <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-sm">No product data available</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Top Managers Mobile */}
                            {topEntities?.topManagers && topEntities.topManagers.length > 0 ? (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center text-base">
                                            <User className="mr-2 h-5 w-5 text-purple-600" />
                                            Top Performing Managers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            {(Array.isArray(topEntities?.topManagers) ? topEntities.topManagers : []).slice(0, 3).map((manager, index) => (
                                                <div key={index} className="group relative">
                                                    <div className="flex items-center space-x-3 rounded-lg border p-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600 dark:bg-purple-800 dark:text-purple-400">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{manager.manager_name}</p>
                                                            <p className="text-xs text-muted-foreground">{manager.sales_count} sales</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium">{formatCurrency(manager.total_revenue)}</p>
                                                            <Link
                                                                href={`/manager/${manager.manager_id}`}
                                                                className="text-xs text-blue-600 hover:underline block mt-1"
                                                            >
                                                                View Sales
                                                            </Link>
                                                        </div>
                                                    </div>
                                                    {index === 0 && (
                                                        <div className="absolute -top-2 -right-2">
                                                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-yellow-300">
                                                                🏆
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center text-base">
                                            <User className="mr-2 h-5 w-5 text-purple-600" />
                                            Top Performing Managers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="text-center py-6 text-muted-foreground">
                                            <User className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-sm">No manager data available</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Top Categories Mobile */}
                            {topEntities?.topCategories?.length > 0 ? (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center text-base">
                                            <Package className="mr-2 h-5 w-5 text-indigo-600" />
                                            Top Categories
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="space-y-3">
                                            {(Array.isArray(topEntities?.topCategories) ? topEntities.topCategories : []).slice(0, 3).map((category, index) => (
                                                <div key={index} className="group relative">
                                                    <div className="flex items-center space-x-3 rounded-lg border p-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-600 dark:bg-indigo-800 dark:text-indigo-400">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm truncate">{category.category}</p>
                                                            <p className="text-xs text-muted-foreground">{category.total_sold} units sold</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium">{formatCurrency(category.total_revenue)}</p>
                                                        </div>
                                                    </div>
                                                    {index === 0 && (
                                                        <div className="absolute -top-2 -right-2">
                                                            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-sm border border-yellow-300">
                                                                🏆
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center text-base">
                                            <Package className="mr-2 h-5 w-5 text-indigo-600" />
                                            Top Categories
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <div className="text-center py-6 text-muted-foreground">
                                            <Package className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                            <p className="text-sm">No category data available</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Quick Actions - Desktop Only */}
                <Card className="hidden sm:block mb-6">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                        <CardDescription>Manage your shop operations efficiently</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                            <Link href="/products">
                                <Button className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2" variant="outline">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    <span className="text-sm font-medium">Products</span>
                                </Button>
                            </Link>
                            <Link href="/users">
                                <Button className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2" variant="outline">
                                    <Users className="h-5 w-5 text-green-600" />
                                    <span className="text-sm font-medium">Users</span>
                                </Button>
                            </Link>
                            <Link href="/wallets">
                                <Button className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2" variant="outline">
                                    <DollarSign className="h-5 w-5 text-yellow-600" />
                                    <span className="text-sm font-medium">Wallets</span>
                                </Button>
                            </Link>
                            <Link href="/expenses">
                                <Button className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2" variant="outline">
                                    <Receipt className="h-5 w-5 text-purple-600" />
                                    <span className="text-sm font-medium">Expenses</span>
                                </Button>
                            </Link>
                            <Link href="/sales">
                                <Button className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2" variant="outline">
                                    <Receipt className="h-5 w-5 text-indigo-600" />
                                    <span className="text-sm font-medium">Sales</span>
                                </Button>
                            </Link>
                            <Button className="w-full h-auto py-4 px-3 flex flex-col items-center gap-2" variant="outline" onClick={() => setRestockDialogOpen(true)}>
                                <Plus className="h-5 w-5 text-red-600" />
                                <span className="text-sm font-medium">Restock</span>
                            </Button>
                        </div>
                    </CardContent>
                </Card>








            </div>
        </AppLayout>
    );
}
