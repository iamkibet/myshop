import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Calendar, Check, Download, Eye, Filter, Package, Receipt, Search, TrendingUp, User, X } from 'lucide-react';
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
        totalSales: number;
        totalOrders: number;
        averageOrderValue: number;
        todaySales: number;
        thisWeekSales: number;
        thisMonthSales: number;
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
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                {/* Success/Error Messages */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                        <div className="flex items-start gap-3">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                            <div>
                                <h3 className="font-medium">Success!</h3>
                                <p className="text-sm">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                        <div className="flex items-start gap-3">
                            <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                            <div>
                                <h3 className="font-medium">Error!</h3>
                                <p className="text-sm">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold tracking-tight sm:text-2xl md:text-3xl">Sales Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                            {isAdmin ? 'Comprehensive sales analytics and history' : 'Your sales performance overview'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard">
                            <Button variant="outline" className="hidden md:inline-flex">
                                <Package className="mr-2 h-4 w-4" />
                                Back to Shop
                            </Button>
                            <Button variant="outline" size="icon" className="md:hidden">
                                <Package className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-sm dark:from-blue-900/30 dark:to-blue-900/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Sales</CardTitle>
                                <TrendingUp className="h-5 w-5 text-blue-400 dark:text-blue-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-800 dark:text-blue-100">{formatCurrency(stats.totalSales)}</div>
                                <p className="text-xs text-blue-600 dark:text-blue-300">
                                    {stats.totalOrders} {stats.totalOrders === 1 ? 'order' : 'orders'}
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-sm dark:from-purple-900/30 dark:to-purple-900/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg. Order Value</CardTitle>
                                <BarChart3 className="h-5 w-5 text-purple-400 dark:text-purple-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-800 dark:text-purple-100">
                                    {formatCurrency(stats.averageOrderValue)}
                                </div>
                                <p className="text-xs text-purple-600 dark:text-purple-300">per transaction</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-green-50 to-green-100 shadow-sm dark:from-green-900/30 dark:to-green-900/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-green-600 dark:text-green-400">Today's Sales</CardTitle>
                                <Calendar className="h-5 w-5 text-green-400 dark:text-green-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-800 dark:text-green-100">{formatCurrency(stats.todaySales)}</div>
                                <p className="text-xs text-green-600 dark:text-green-300">24 hour period</p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100 shadow-sm dark:from-amber-900/30 dark:to-amber-900/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-amber-600 dark:text-amber-400">Monthly Sales</CardTitle>
                                <Calendar className="h-5 w-5 text-amber-400 dark:text-amber-300" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-amber-800 dark:text-amber-100">{formatCurrency(stats.thisMonthSales)}</div>
                                <p className="text-xs text-amber-600 dark:text-amber-300">current month</p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="px-4 py-4 md:px-6">
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-muted-foreground" />
                            <span>Filters</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 md:px-6">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search sales by ID, product, or manager..."
                                        value={search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <Select value={dateFilter} onValueChange={handleDateFilter}>
                                    <SelectTrigger className="w-full sm:w-[140px]">
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
                                {isAdmin && (
                                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-[140px]">
                                            <SelectValue placeholder="Manager" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Managers</SelectItem>
                                            <SelectItem value="me">My Sales</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales List */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="px-4 py-4 md:px-6">
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        {sales && sales.data.length > 0 ? (
                            <div className="divide-y">
                                <div className="hidden grid-cols-12 gap-4 bg-gray-50 px-4 py-3 text-sm font-medium md:grid md:px-6 dark:bg-gray-800">
                                    <div className="col-span-2">SALE ID</div>
                                    <div className="col-span-3">ITEMS</div>
                                    <div className="col-span-3">DATE/TIME</div>
                                    <div className="col-span-2">MANAGER</div>
                                    <div className="col-span-2 text-right">TOTAL</div>
                                </div>
                                {sales.data.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="block space-y-3 px-4 py-4 transition-colors hover:bg-gray-50 md:grid md:grid-cols-12 md:gap-4 md:space-y-0 md:px-6 dark:hover:bg-gray-800/50"
                                    >
                                        {/* Mobile Layout */}
                                        <div className="flex items-center justify-between md:hidden">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">#{sale.id}</span>
                                            </div>
                                            <span className="font-semibold">{formatCurrency(sale.total_amount)}</span>
                                        </div>

                                        {/* Desktop Layout */}
                                        <div className="hidden md:col-span-2 md:flex md:items-center">
                                            <Receipt className="mr-2 h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">#{sale.id}</span>
                                        </div>

                                        {/* Items - Mobile & Desktop */}
                                        <div className="md:col-span-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {sale.sale_items.slice(0, 3).map((item, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
                                                        >
                                                            <Package className="h-3 w-3 text-muted-foreground" />
                                                        </div>
                                                    ))}
                                                    {sale.sale_items.length > 3 && (
                                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs dark:bg-gray-700">
                                                            +{sale.sale_items.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm text-muted-foreground">
                                                    {sale.sale_items.length} {sale.sale_items.length === 1 ? 'item' : 'items'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Date/Time - Desktop Only */}
                                        <div className="hidden md:col-span-3 md:block">
                                            <div className="text-sm">{new Date(sale.created_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {/* Manager - Desktop Only */}
                                        <div className="hidden md:col-span-2 md:block">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm">{sale.manager.name}</span>
                                            </div>
                                        </div>

                                        {/* Date/Time - Mobile Only */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground md:hidden">
                                            <Calendar className="h-4 w-4" />
                                            <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>

                                        {/* Manager - Mobile Only */}
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground md:hidden">
                                            <User className="h-4 w-4" />
                                            <span>{sale.manager.name}</span>
                                        </div>

                                        {/* Actions - Mobile & Desktop */}
                                        <div className="flex items-center justify-end gap-2 md:col-span-2">
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleViewReceipt(sale.id)}
                                                    title="View receipt"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleDownloadReceipt(sale.id)}
                                                    title="Download receipt"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    <Receipt className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <h3 className="mb-3 text-xl font-semibold">No sales found</h3>
                                <p className="mx-auto max-w-md text-muted-foreground">
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
