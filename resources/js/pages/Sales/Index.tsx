import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Calendar, Check, Download, Eye, Filter, Package, Receipt, Search, TrendingUp, User, X, DollarSign, ShoppingCart, Target, Award, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
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
    const initialPage = parseInt(urlParams.get('page') || '1');

    const [search, setSearch] = useState(initialSearch);
    const [dateFilter, setDateFilter] = useState(initialDateFilter);
    const [statusFilter, setStatusFilter] = useState(initialStatusFilter);
    const [currentPage, setCurrentPage] = useState(initialPage);

    const handleSearch = (value: string) => {
        setSearch(value);
        setCurrentPage(1); // Reset to first page when searching
        router.get(
            '/sales',
            { search: value, date_filter: dateFilter, status_filter: statusFilter, page: 1 },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDateFilter = (value: string) => {
        setDateFilter(value);
        setCurrentPage(1); // Reset to first page when filtering
        router.get(
            '/sales',
            { search, date_filter: value, status_filter: statusFilter, page: 1 },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1); // Reset to first page when filtering
        router.get(
            '/sales',
            { search, date_filter: dateFilter, status_filter: value, page: 1 },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        router.get(
            '/sales',
            { search, date_filter: dateFilter, status_filter: statusFilter, page },
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

    // Helper function to format numbers without currency symbol
    const formatNumber = (value: number) => {
        if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
        } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
        }
        return value.toLocaleString();
    };

    // Pagination helper functions
    const getPageNumbers = () => {
        const pages = [];
        const totalPages = sales?.last_page || 1;
        const current = sales?.current_page || 1;
        
        // Always show first page
        pages.push(1);
        
        // Show pages around current page
        const start = Math.max(2, current - 1);
        const end = Math.min(totalPages - 1, current + 1);
        
        if (start > 2) {
            pages.push('...');
        }
        
        for (let i = start; i <= end; i++) {
            if (i > 1 && i < totalPages) {
                pages.push(i);
            }
        }
        
        if (end < totalPages - 1) {
            pages.push('...');
        }
        
        // Always show last page if there's more than one page
        if (totalPages > 1) {
            pages.push(totalPages);
        }
        
        return pages;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-3 sm:gap-6 overflow-x-auto rounded-xl p-2 sm:p-6 pb-20 sm:pb-6">
                {/* Success/Error Messages */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3 sm:p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success!</h3>
                                <div className="mt-1 text-sm text-green-700 dark:text-green-300">{flash.success}</div>
                            </div>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-3 sm:p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error!</h3>
                                <div className="mt-1 text-sm text-red-700 dark:text-red-300">{flash.error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile Header - Compact Design */}
                <div className="sm:hidden">
                    <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <Receipt className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Sales</h1>
                                <p className="text-xs text-green-100">
                                    {isAdmin ? 'All transactions' : 'Your sales'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium">{sales?.total || 0}</p>
                            <p className="text-xs text-green-100">Total</p>
                        </div>
                    </div>
                </div>

                {/* Desktop Hero Header */}
                <div className="hidden sm:block relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950 border border-green-200 dark:border-green-800">
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

                {/* Sales Performance Overview - Mobile Optimized */}
                {stats && (
                    <div className="grid gap-3 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
                        {/* Mobile Summary Cards */}
                        <div className="sm:hidden grid grid-cols-2 gap-3">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-3 border border-blue-200 cursor-help">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                                                    <TrendingUp className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-blue-600">Revenue</p>
                                                    <p className="text-lg font-bold text-blue-800">
                                                        {formatNumber(stats.totalSales)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Total sales in KSH</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-3 border border-green-200 cursor-help">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                                    <Calendar className="h-4 w-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-green-600">Today</p>
                                                    <p className="text-lg font-bold text-green-800">
                                                        {formatNumber(stats.todaySales)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Today's sales in KSH</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>

                        {/* Desktop Stats Cards */}
                        <Card className="hidden sm:block bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
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

                        <Card className="hidden sm:block bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
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
                                <p className="text-sm text-purple-700 dark:text-blue-300">
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

                        <Card className="hidden sm:block bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
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

                        <Card className="hidden sm:block bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg font-semibold text-green-900 dark:text-green-100">Monthly Sales</CardTitle>
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

                {/* Search and Filters - Mobile Optimized */}
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Search & Filter</CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-400">Find and filter sales by date, manager, or search terms</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:space-x-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search sales by ID, product, or manager..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10 h-10 sm:h-12 text-base"
                                />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="w-full sm:w-48">
                                    <Select value={dateFilter} onValueChange={handleDateFilter}>
                                        <SelectTrigger className="h-10 sm:h-12">
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
                                            <SelectTrigger className="h-10 sm:h-12">
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

                {/* Sales Transactions - Mobile Optimized with Pagination */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg sm:text-xl font-semibold">Recent Transactions</CardTitle>
                                <CardDescription>
                                    {sales?.data.length || 0} transaction{sales?.data.length !== 1 ? 's' : ''} found
                                    {sales && sales.total > sales.data.length && (
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            (Showing {sales.data.length} of {sales.total})
                                        </span>
                                    )}
                                </CardDescription>
                            </div>
                            {sales && sales.last_page > 1 && (
                                <div className="mt-3 sm:mt-0 text-sm text-muted-foreground">
                                    Page {sales.current_page} of {sales.last_page}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {sales && sales.data.length > 0 ? (
                            <>
                                <div className="space-y-3 sm:space-y-4">
                                    {sales.data.map((sale) => (
                                        <div key={sale.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 sm:p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 mb-3 sm:mb-0">
                                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0">
                                                    <Receipt className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm sm:text-base">Sale #{sale.id}</p>
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs sm:text-sm text-muted-foreground mt-1 space-y-1 sm:space-y-0">
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
                                                                    className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800"
                                                                >
                                                                    <Package className="h-3 w-3 text-muted-foreground" />
                                                                </div>
                                                            ))}
                                                            {sale.sale_items.length > 3 && (
                                                                <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 text-xs">
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
                                            <div className="flex flex-col sm:flex-col-reverse sm:items-end space-y-2 sm:space-y-0">
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.total_amount)}</p>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
                                                        onClick={() => handleViewReceipt(sale.id)}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 px-2 sm:px-3 text-xs sm:text-sm"
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

                                {/* Pagination */}
                                {sales && sales.last_page > 1 && (
                                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                            <div className="text-center sm:text-left">
                                                <p className="text-sm text-muted-foreground">
                                                    Showing <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {((sales.current_page - 1) * sales.per_page) + 1}
                                                    </span> to <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {Math.min(sales.current_page * sales.per_page, sales.total)}
                                                    </span> of <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {sales.total}
                                                    </span> results
                                                </p>
                                            </div>
                                            
                                        {/* Mobile Pagination */}
                                        <div className="sm:hidden">
                                            <div className="flex items-center justify-center space-x-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChange(sales.current_page - 1)}
                                                    disabled={sales.current_page === 1}
                                                    className="h-10 w-10 p-0 rounded-full border-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft className="h-5 w-5" />
                                                </Button>
                                                
                                                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-full px-3 py-2">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        {sales.current_page}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 mx-1">of</span>
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        {sales.last_page}
                                                    </span>
                                                </div>
                                                
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChange(sales.current_page + 1)}
                                                    disabled={sales.current_page === sales.last_page}
                                                    className="h-10 w-10 p-0 rounded-full border-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronRight className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            
                                            {/* Mobile Page Info */}
                                            <div className="mt-3 text-center">
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Showing {((sales.current_page - 1) * sales.per_page) + 1} to {Math.min(sales.current_page * sales.per_page, sales.total)} of {sales.total} results
                                                </p>
                                            </div>
                                        </div>

                                        {/* Desktop Pagination */}
                                        <div className="hidden sm:flex items-center space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(sales.current_page - 1)}
                                                disabled={sales.current_page === 1}
                                                className="h-9 px-3 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft className="h-4 w-4 mr-2" />
                                                Previous
                                            </Button>
                                            
                                            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                                                {getPageNumbers().map((page, index) => (
                                                    <div key={index}>
                                                        {page === '...' ? (
                                                            <div className="px-3 py-2 text-muted-foreground">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                variant={page === sales.current_page ? "default" : "ghost"}
                                                                size="sm"
                                                                onClick={() => handlePageChange(page as number)}
                                                                className={`h-8 w-8 p-0 rounded-md ${
                                                                    page === sales.current_page 
                                                                        ? "bg-blue-600 text-white hover:bg-blue-700" 
                                                                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                                                                }`}
                                                            >
                                                                {page}
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handlePageChange(sales.current_page + 1)}
                                                disabled={sales.current_page === sales.last_page}
                                                className="h-9 px-3 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </div>
                                    </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="py-8 sm:py-12 text-center">
                                <div className="mx-auto mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    <Receipt className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
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
