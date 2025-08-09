import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Calendar, Check, Download, Eye, Filter, Package, Receipt, Search, TrendingUp, User, X, DollarSign, ShoppingCart, Target, Award } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '/sales',
    },
];

interface Sale {
    id: number;
    total_amount: number;
    created_at: string;
    sale_items: SaleItem[];
    manager: {
        id: number;
        name: string;
        email: string;
    };
}

interface SaleItem {
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_variant: {
        id: number;
        sku: string;
        color?: string;
        size?: string;
        product: {
            id: number;
            name: string;
            brand: string;
            category: string;
        };
    };
}

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'admin' | 'manager';
        };
    };
    sales?: {
        data: Sale[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats?: {
        totalSales: number; // All-time total
        totalOrders: number; // All-time total
        averageOrderValue: number; // All-time average
        periodSales: number; // Period-specific total
        periodOrders: number; // Period-specific total
        todaySales: number;
        thisWeekSales: number;
        thisMonthSales: number;
        currentFilter: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function SalesIndex() {
    const { auth, sales, stats, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user.role === 'admin';

    // Get initial values from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearch = urlParams.get('search') || '';
    const initialDateFilter = urlParams.get('date_filter') || 'all';
    const initialStatusFilter = urlParams.get('status_filter') || 'all';

    const [search, setSearch] = useState(initialSearch);
    const [dateFilter, setDateFilter] = useState(initialDateFilter);
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/sales',
            { search: value, date_filter: dateFilter, status_filter: statusFilter },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDateFilter = (value: string) => {
        setDateFilter(value);
        router.get(
            '/sales',
            { search, date_filter: value, status_filter: statusFilter },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        router.get(
            '/sales',
            { search, date_filter: dateFilter, status_filter: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleViewReceipt = (saleId: number) => {
        window.open(`/receipts/${saleId}`, '_blank');
    };

    const handleDownloadReceipt = async (saleId: number) => {
        try {
            const response = await fetch(`/receipts/${saleId}/download`, {
                method: 'GET',
                headers: {
                    Accept: 'text/html',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download receipt');
            }

            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Download the HTML file
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${saleId}.html`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Clean up the URL object after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            // Show instructions for converting to PDF
            alert(
                'Receipt downloaded! To convert to PDF:\n1. Open the HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Choose "Save as PDF" in the print dialog',
            );
        } catch (error) {
            console.error('Failed to download receipt:', error);
            alert('Failed to download receipt. Please try again.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto rounded-xl p-6">
                {/* Success/Error Messages */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Check className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success!</h3>
                                <div className="mt-1 text-sm text-green-700 dark:text-green-300">{flash.success}</div>
                            </div>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <X className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error!</h3>
                                <div className="mt-1 text-sm text-red-700 dark:text-red-300">{flash.error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border border-green-200 dark:border-green-800">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
                    <div className="relative p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                                    <Receipt className="h-8 w-8" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">Sales Dashboard</h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                                        {isAdmin ? 'Comprehensive sales analytics and transaction history' : 'Your sales performance overview'}
                                    </p>
                                    <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center space-x-1">
                                            <ShoppingCart className="h-4 w-4" />
                                            <span>{sales?.total || 0} Total Sales</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <DollarSign className="h-4 w-4" />
                                            <span>{stats?.totalOrders || 0} Orders</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <Target className="h-4 w-4" />
                                            <span>{formatCurrency(stats?.averageOrderValue || 0)} Avg. Order</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link href="/dashboard">
                                <Button variant="outline" size="lg" className="border-gray-300 dark:border-gray-600">
                                    <Package className="mr-2 h-5 w-5" />
                                    Back to Shop
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sales Performance Overview */}
                {stats && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                        All-Time Revenue
                                    </CardTitle>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                    {formatCurrency(stats.totalSales)}
                                </div>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    {stats.totalOrders} {stats.totalOrders === 1 ? 'order' : 'orders'} processed
                                </p>
                                {dateFilter !== 'all' && stats.periodSales !== stats.totalSales && (
                                    <div className="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                            {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : 'This Year'}: {formatCurrency(stats.periodSales)}
                                        </p>
                                        <p className="text-xs text-blue-600 dark:text-blue-300">
                                            {stats.periodOrders} orders in this period
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                                        All-Time Average Order
                                    </CardTitle>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800">
                                        <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                                    {formatCurrency(stats.averageOrderValue)}
                                </div>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    Per transaction (all-time average)
                                </p>
                                {dateFilter !== 'all' && stats.periodOrders > 0 && (
                                    <div className="mt-3 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <p className="text-xs font-medium text-purple-800 dark:text-purple-200">
                                            {dateFilter === 'today' ? 'Today' : dateFilter === 'week' ? 'This Week' : dateFilter === 'month' ? 'This Month' : 'This Year'} Average: {formatCurrency(stats.periodSales / stats.periodOrders)}
                                        </p>
                                        <p className="text-xs text-purple-600 dark:text-purple-300">
                                            Based on {stats.periodOrders} orders
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold text-green-900 dark:text-green-100">Today's Sales</CardTitle>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                                        <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                                    {formatCurrency(stats.todaySales)}
                                </div>
                                <p className="text-sm text-green-700 dark:text-green-300">24 hour period</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold text-amber-900 dark:text-amber-100">Monthly Sales</CardTitle>
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-800">
                                        <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-amber-900 dark:text-amber-100 mb-2">
                                    {formatCurrency(stats.thisMonthSales)}
                                </div>
                                <p className="text-sm text-amber-700 dark:text-amber-300">Current month</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Search and Filters */}
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Search & Filter</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">Find and filter sales by date, manager, or search terms</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:space-x-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search sales by ID, product, or manager..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10 h-12 text-base"
                                />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="w-full sm:w-48">
                                    <Select value={dateFilter} onValueChange={handleDateFilter}>
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Date range" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="today">Today</SelectItem>
                                            <SelectItem value="week">This Week</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="year">This Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {isAdmin && (
                                    <div className="w-full sm:w-48">
                                        <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Manager" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Managers</SelectItem>
                                                <SelectItem value="me">My Sales</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Recent Transactions</CardTitle>
                        <CardDescription>
                            {sales?.data.length || 0} transaction{sales?.data.length !== 1 ? 's' : ''} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sales && sales.data.length > 0 ? (
                            <div className="space-y-4">
                                {sales.data.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                                <Receipt className="h-6 w-6 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">Sale #{sale.id}</p>
                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <User className="h-3 w-3" />
                                                        <span>{sale.manager.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 mt-2">
                                                    <div className="flex -space-x-1">
                                                        {sale.sale_items.slice(0, 3).map((item, index) => (
                                                            <div
                                                                key={index}
                                                                className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"
                                                            >
                                                                <Package className="h-3 w-3 text-muted-foreground" />
                                                            </div>
                                                        ))}
                                                        {sale.sale_items.length > 3 && (
                                                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 text-xs">
                                                                +{sale.sale_items.length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {sale.sale_items.length} {sale.sale_items.length === 1 ? 'item' : 'items'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.total_amount)}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3"
                                                    onClick={() => handleViewReceipt(sale.id)}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 px-3"
                                                    onClick={() => handleDownloadReceipt(sale.id)}
                                                >
                                                    <Download className="h-3 w-3 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    <Receipt className="h-8 w-8 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">No sales found</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {search ? 'Try adjusting your search filters' : 'No sales have been recorded yet'}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
