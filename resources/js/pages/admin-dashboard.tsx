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
    Bell,
    Clock,
    DollarSign,
    Package,
    Plus,
    Receipt,
    RefreshCw,
    ShoppingCart,
    Target,
    TrendingDown,
    TrendingUp,
    User,
    Users,
    XCircle,
    Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

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
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: string;
    icon: string;
    action?: {
        type: 'sale' | 'low_stock' | 'out_of_stock' | 'product';
        url?: string;
        id?: number;
        product_id?: number;
        product_name?: string;
        variant_count?: number;
    };
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
    const [restockRecommendations, setRestockRecommendations] = useState<any>(null);
    const [selectedProductForRestock, setSelectedProductForRestock] = useState<number | null>(null);

    // Fetch analytics data
    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const response = await fetch('/dashboard/analytics');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            if (data.error) {
                console.error('Analytics error:', data.message);
                setAnalyticsData(getDefaultAnalyticsData());
            } else {
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

    // Create safe analytics data with proper fallbacks
    const safeAnalyticsData = useMemo(() => {
        return analyticsData
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
            await router.post('/restock', { items: restockItems as unknown });
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
            const items = restockRecommendations.recommendations.map((rec: any) => ({
                product_variant_id: rec.variant_id,
                new_quantity: rec.recommended_quantity,
            }));

            await router.post('/restock', { items: items as unknown });
            setSmartRestockDialogOpen(false);
            setRestockRecommendations(null);
            setSelectedProductForRestock(null);
        } catch (error) {
            console.error('Smart restock failed:', error);
        } finally {
            setRestockLoading(false);
        }
    };

    const getNotificationIcon = (icon: string) => {
        switch (icon) {
            case 'alert-triangle':
                return <AlertTriangle className="h-4 w-4" />;
            case 'x-circle':
                return <XCircle className="h-4 w-4" />;
            case 'clock':
                return <Clock className="h-4 w-4" />;
            case 'trending-up':
                return <TrendingUp className="h-4 w-4" />;
            case 'trending-down':
                return <TrendingDown className="h-4 w-4" />;
            default:
                return <Bell className="h-4 w-4" />;
        }
    };

    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'border-green-200 bg-green-50 text-green-800';
            case 'warning':
                return 'border-yellow-200 bg-yellow-50 text-yellow-800';
            case 'error':
                return 'border-red-200 bg-red-50 text-red-800';
            case 'info':
                return 'border-blue-200 bg-blue-50 text-blue-800';
            default:
                return 'border-gray-200 bg-gray-50 text-gray-800';
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
    const notifications = safeAnalyticsData?.notifications || [];

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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Comprehensive analytics and insights</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="day">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={fetchAnalytics} disabled={loading} variant="outline" size="sm">
                            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                        <NotificationsDropdown
                            notifications={safeAnalyticsData?.notifications || []}
                            unreadCount={safeAnalyticsData?.notifications?.filter((n) => !n.is_read).length || 0}
                        />
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border-l-4 border-l-green-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(sales?.totalSales || 0)}</div>
                            <p className="text-xs text-muted-foreground">{sales?.totalOrders || 0} orders completed</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(profits?.totalProfit || 0)}</div>
                            <p className="text-xs text-muted-foreground">{(profits?.profitMargin || 0).toFixed(1)}% margin</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(sales?.averageOrderValue || 0)}</div>
                            <p className="text-xs text-muted-foreground">per order</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(inventory?.totalRetailValue || 0)}</div>
                            <p className="text-xs text-muted-foreground">{inventory?.totalProducts || 0} products</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts and Analytics */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
                        <TabsTrigger value="inventory">Inventory</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                            {/* Sales Trends Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Activity className="mr-2 h-5 w-5" />
                                        Sales Trends (Last 30 Days)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {Array.isArray(sales?.salesTrends) && sales.salesTrends.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {formatCurrency(
                                                            sales.salesTrends.reduce(
                                                                (sum: number, day: { revenue: number }) => sum + (day.revenue || 0),
                                                                0,
                                                            ),
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        {sales.salesTrends.reduce(
                                                            (sum: number, day: { orders: number }) => sum + (day.orders || 0),
                                                            0,
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Total Orders</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-purple-600">
                                                        {sales.salesTrends.length > 0
                                                            ? Math.round(
                                                                  sales.salesTrends.reduce(
                                                                      (sum: number, day: { revenue: number }) => sum + (day.revenue || 0),
                                                                      0,
                                                                  ) / sales.salesTrends.length,
                                                              )
                                                            : 0}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Avg Daily Revenue</p>
                                                </div>
                                            </div>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={sales.salesTrends}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                                            stroke="#888888"
                                                            fontSize={12}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            stroke="#888888"
                                                            fontSize={12}
                                                            tickFormatter={(value) => formatCurrency(value)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <Tooltip
                                                            formatter={(value: number, name: string) => [
                                                                name === 'revenue' ? formatCurrency(value) : value,
                                                                name === 'revenue' ? 'Revenue' : 'Orders',
                                                            ]}
                                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                            }}
                                                        />
                                                        <Area
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            stroke="#10b981"
                                                            fill="#10b981"
                                                            fillOpacity={0.2}
                                                            strokeWidth={3}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="orders"
                                                            stroke="#3b82f6"
                                                            strokeWidth={2}
                                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                                            <div className="text-center">
                                                <BarChart3 className="mx-auto mb-2 h-12 w-12" />
                                                <p>No sales data available</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Profit Trends Chart */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <TrendingUp className="mr-2 h-5 w-5" />
                                        Profit Trends (Last 30 Days)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {Array.isArray(profits?.profitTrends) && profits.profitTrends.length > 0 ? (
                                        <div className="space-y-4">
                                            <div className="mb-6 grid grid-cols-3 gap-4 text-center">
                                                <div>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {formatCurrency(profits.profitTrends.reduce((sum, day) => sum + (day.daily_profit || 0), 0))}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Total Profit</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-blue-600">
                                                        {formatCurrency(profits.profitTrends.reduce((sum, day) => sum + (day.daily_revenue || 0), 0))}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Total Revenue</p>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-purple-600">
                                                        {profits.profitTrends.length > 0
                                                            ? Math.round(
                                                                  profits.profitTrends.reduce((sum, day) => sum + (day.daily_profit || 0), 0) /
                                                                      profits.profitTrends.length,
                                                              )
                                                            : 0}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">Avg Daily Profit</p>
                                                </div>
                                            </div>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={profits.profitTrends}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                        <XAxis
                                                            dataKey="date"
                                                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                                                            stroke="#888888"
                                                            fontSize={12}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <YAxis
                                                            stroke="#888888"
                                                            fontSize={12}
                                                            tickFormatter={(value) => formatCurrency(value)}
                                                            axisLine={false}
                                                            tickLine={false}
                                                        />
                                                        <Tooltip
                                                            formatter={(value: number, name: string) => [
                                                                formatCurrency(value),
                                                                name === 'daily_profit' ? 'Profit' : 'Revenue',
                                                            ]}
                                                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                                            contentStyle={{
                                                                backgroundColor: 'white',
                                                                border: '1px solid #e5e7eb',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                                            }}
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="daily_profit"
                                                            stroke="#10b981"
                                                            strokeWidth={3}
                                                            dot={{ fill: '#10b981', strokeWidth: 2, r: 5 }}
                                                            name="Profit"
                                                        />
                                                        <Line
                                                            type="monotone"
                                                            dataKey="daily_revenue"
                                                            stroke="#3b82f6"
                                                            strokeWidth={2}
                                                            strokeDasharray="5 5"
                                                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                                                            name="Revenue"
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex h-64 items-center justify-center text-muted-foreground">
                                            <div className="text-center">
                                                <TrendingUp className="mx-auto mb-2 h-12 w-12" />
                                                <p>No profit data available</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="sales" className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                                            {restockRecommendations.recommendations.map((rec: any, index: number) => (
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
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
