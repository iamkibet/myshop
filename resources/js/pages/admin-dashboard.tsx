import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, BarChart3, DollarSign, Package, RefreshCw, ShoppingCart, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

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

interface AnalyticsData {
    sales: {
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
    };
    inventory: {
        totalProducts: number;
        totalVariants: number;
        lowStockProducts: number;
        outOfStockProducts: number;
    };
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

export default function AdminDashboard() {
    const { auth, analytics, flash } = usePage<PageProps>().props;
    const user = auth.user;

    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(analytics || null);
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState('month');
    const [selectedCategory, setSelectedCategory] = useState('all');

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
                // Set default data instead of failing
                setAnalyticsData({
                    sales: {
                        daily: [],
                        weekly: [],
                        monthly: [],
                        yearly: [],
                        totalSales: 0,
                        totalOrders: 0,
                        averageOrderValue: 0,
                        bestSellingProducts: [],
                        salesByCategory: [],
                        salesBySize: [],
                        salesByColor: [],
                        salesTrends: [],
                    },
                    inventory: {
                        lowStockProducts: [],
                        outOfStockProducts: [],
                        inventoryTurnoverRate: 0,
                        totalCostValue: 0,
                        totalRetailValue: 0,
                        lowStockThreshold: 5,
                    },
                    topEntities: {
                        topManagers: [],
                        topProducts: [],
                        topCategories: [],
                    },
                    profits: {
                        totalProfit: 0,
                        totalRevenue: 0,
                        profitMargin: 0,
                        profitTrends: [],
                    },
                    notifications: [],
                });
            } else {
                setAnalyticsData(data);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            // Set default data on error
            setAnalyticsData({
                sales: {
                    daily: [],
                    weekly: [],
                    monthly: [],
                    yearly: [],
                    totalSales: 0,
                    totalOrders: 0,
                    averageOrderValue: 0,
                    bestSellingProducts: [],
                    salesByCategory: [],
                    salesBySize: [],
                    salesByColor: [],
                    salesTrends: [],
                },
                inventory: {
                    lowStockProducts: [],
                    outOfStockProducts: [],
                    inventoryTurnoverRate: 0,
                    totalCostValue: 0,
                    totalRetailValue: 0,
                    lowStockThreshold: 5,
                },
                topEntities: {
                    topManagers: [],
                    topProducts: [],
                    topCategories: [],
                },
                profits: {
                    totalProfit: 0,
                    totalRevenue: 0,
                    profitMargin: 0,
                    profitTrends: [],
                },
                notifications: [],
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!analyticsData) {
            fetchAnalytics();
        }
    }, []);

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

    const { sales, inventory } = analyticsData;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
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
                        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
                        <p className="text-muted-foreground">Comprehensive analytics and insights</p>
                    </div>
                    <div className="flex items-center space-x-2">
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
                    </div>
                </div>

                {/* Alerts Panel */}
                {(inventory.lowStockProducts > 0 || inventory.outOfStockProducts > 0) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <AlertTriangle className="mr-2 h-5 w-5" />
                                Inventory Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {inventory.lowStockProducts > 0 && (
                                    <div className="flex items-center rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                                        <AlertTriangle className="mr-3 h-4 w-4 text-yellow-600" />
                                        <div className="flex-1">
                                            <h4 className="font-medium">Low Stock Alert</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {inventory.lowStockProducts} products are running low on stock
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {inventory.outOfStockProducts > 0 && (
                                    <div className="flex items-center rounded-lg border border-red-200 bg-red-50 p-3">
                                        <XCircle className="mr-3 h-4 w-4 text-red-600" />
                                        <div className="flex-1">
                                            <h4 className="font-medium">Out of Stock Alert</h4>
                                            <p className="text-sm text-muted-foreground">{inventory.outOfStockProducts} products are out of stock</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Key Metrics */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(sales.totalSales)}</div>
                            <p className="text-xs text-muted-foreground">{sales.totalOrders} orders completed</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(sales.averageOrderValue)}</div>
                            <p className="text-xs text-muted-foreground">per order</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inventory.totalProducts}</div>
                            <p className="text-xs text-muted-foreground">products</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Variants</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inventory.totalVariants}</div>
                            <p className="text-xs text-muted-foreground">variants</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                            <Link href="/dashboard">
                                <Button className="w-full" variant="outline">
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    View Shop
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
