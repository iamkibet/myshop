import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import KPICard from '@/components/KPICard';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BarChart3, Calendar, Check, Download, Eye, Filter, Package, Receipt, Search, TrendingUp, User, X, DollarSign, ShoppingCart, Target, Award, ChevronLeft, ChevronRight, MoreHorizontal, TrendingDown, Hash, AtSign, Clock, Info } from 'lucide-react';
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
    product: {
        id: number;
        name: string;
        sku: string;
        brand: string;
        category: string;
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
            console.log('Starting receipt download for sale:', saleId);
            
            const response = await fetch(`/receipts/${saleId}/download`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`Failed to download receipt: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            console.log('Blob created:', blob.size, 'bytes');

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Download the HTML file
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${saleId}.html`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Clean up the URL object after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            // Show success message
            alert(
                'Receipt downloaded successfully!\n\nTo convert to PDF:\n1. Open the HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Choose "Save as PDF" in the print dialog\n4. Set margins to "Minimum" for best fit'
            );
        } catch (error) {
            console.error('Failed to download receipt:', error);
            alert(`Failed to download receipt: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`);
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
            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 bg-gray-50 pb-24 sm:pb-4">
                {/* Welcome Section */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Sales Dashboard</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            {isAdmin ? 'Comprehensive sales analytics and transaction history' : 'Your sales performance overview'}
                        </p>
                    </div>
                    
                    {/* Success/Error Messages */}
                    {flash?.success && (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">Success!</h3>
                                    <div className="mt-1 text-sm text-green-700">{flash.success}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {flash?.error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-400" />
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error!</h3>
                                    <div className="mt-1 text-sm text-red-700">{flash.error}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* KPI Cards - Matching Dashboard Style */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        <KPICard
                            title="Total Sales"
                            value={stats.totalSales}
                            change={25}
                            changeType="increase"
                            icon={DollarSign}
                            color="orange"
                            bgColor="bg-orange-800"
                            tooltip="Total revenue generated from all completed sales transactions. This includes the sum of all items sold to customers."
                        />
                        <KPICard
                            title="Total Orders"
                            value={stats.totalOrders}
                            change={15}
                            changeType="increase"
                            icon={TrendingDown}
                            color="blue"
                            bgColor="bg-blue-800"
                            format="number"
                            tooltip="Total number of completed sales transactions. Each order represents a single customer purchase containing one or more items."
                        />
                        <KPICard
                            title="Average Order Value"
                            value={stats.averageOrderValue}
                            change={8}
                            changeType="increase"
                            icon={AtSign}
                            color="green"
                            bgColor="bg-green-800"
                            tooltip="Average amount spent per transaction. Calculated by dividing total sales by total number of orders."
                        />
                        <KPICard
                            title="Today's Sales"
                            value={stats.todaySales}
                            change={12}
                            changeType="increase"
                            icon={Clock}
                            color="blue"
                            bgColor="bg-gray-900"
                            tooltip="Total sales revenue generated in the last 24 hours. Shows current day performance."
                        />
                    </div>
                )}

                {/* Search and Filters - Dashboard Style */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">Search & Filter</CardTitle>
                        <CardDescription className="text-gray-600">Find and filter sales by date, manager, or search terms</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:space-x-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search sales by ID, product, or manager..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10 h-10 sm:h-11 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="w-full sm:w-48">
                                    <Select value={dateFilter} onValueChange={handleDateFilter}>
                                        <SelectTrigger className="h-10 sm:h-11">
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
                                            <SelectTrigger className="h-10 sm:h-11">
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

                {/* Sales Transactions - Dashboard Style */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">Recent Transactions</CardTitle>
                                <CardDescription className="text-gray-600">
                                    {sales?.data.length || 0} transaction{sales?.data.length !== 1 ? 's' : ''} found
                                    {sales && sales.total > sales.data.length && (
                                        <span className="ml-2 text-xs text-gray-500">
                                            (Showing {sales.data.length} of {sales.total})
                                        </span>
                                    )}
                                </CardDescription>
                            </div>
                            {sales && sales.last_page > 1 && (
                                <div className="mt-3 sm:mt-0 text-sm text-gray-500">
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
                                        <div key={sale.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            {/* Mobile Layout */}
                                            <div className="block sm:hidden">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-medium text-green-600">
                                                                {sale.id}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">
                                                                Sale #{sale.id}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {new Date(sale.created_at).toLocaleDateString()} at {new Date(sale.created_at).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">{formatCurrency(sale.total_amount)}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <User className="h-4 w-4 text-gray-400" />
                                                            <span className="text-gray-600">Manager:</span>
                                                        </div>
                                                        <span className="font-medium text-gray-900">{sale.manager.name}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="flex items-center space-x-2">
                                                            <Package className="h-4 w-4 text-gray-400" />
                                                            <span className="text-gray-600">Items:</span>
                                                        </div>
                                                        <span className="font-medium text-gray-900">{sale.sale_items.length} items</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 h-9 text-sm"
                                                        onClick={() => handleViewReceipt(sale.id)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Receipt
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex-1 h-9 text-sm"
                                                        onClick={() => handleDownloadReceipt(sale.id)}
                                                    >
                                                        <Download className="h-4 w-4 mr-2" />
                                                        Download
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Desktop Layout */}
                                            <div className="hidden sm:flex items-center justify-between">
                                                <div className="flex items-center space-x-4 min-w-0 flex-1">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-medium text-green-600">
                                                            {sale.id}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                        Sale #{sale.id}
                                                    </p>
                                                        <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <User className="h-3 w-3" />
                                                            <span className="truncate">{sale.manager.name}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Package className="h-3 w-3" />
                                                            <span>{sale.sale_items.length} items</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                                <div className="flex items-center space-x-4 flex-shrink-0">
                                                <div className="text-right">
                                                        <p className="text-sm font-medium text-gray-900">{formatCurrency(sale.total_amount)}</p>
                                                        <p className="text-xs text-gray-500">{new Date(sale.created_at).toLocaleTimeString()}</p>
                                                </div>
                                                    <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                            className="h-8 px-3 text-xs"
                                                        onClick={() => handleViewReceipt(sale.id)}
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                            View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                            className="h-8 px-3 text-xs"
                                                        onClick={() => handleDownloadReceipt(sale.id)}
                                                    >
                                                        <Download className="h-3 w-3 mr-1" />
                                                            Download
                                                    </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination - Dashboard Style */}
                                {sales && sales.last_page > 1 && (
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                                            <div className="text-center sm:text-left">
                                                <p className="text-sm text-gray-500">
                                                    Showing <span className="font-medium text-gray-900">
                                                        {((sales.current_page - 1) * sales.per_page) + 1}
                                                    </span> to <span className="font-medium text-gray-900">
                                                        {Math.min(sales.current_page * sales.per_page, sales.total)}
                                                    </span> of <span className="font-medium text-gray-900">
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
                                                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    
                                                    <div className="flex items-center space-x-1 bg-gray-100 rounded-full px-3 py-1">
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {sales.current_page}
                                                        </span>
                                                        <span className="text-sm text-gray-500 mx-1">of</span>
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {sales.last_page}
                                                        </span>
                                                    </div>
                                                    
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handlePageChange(sales.current_page + 1)}
                                                        disabled={sales.current_page === sales.last_page}
                                                        className="h-8 w-8 p-0 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Desktop Pagination */}
                                            <div className="hidden sm:flex items-center space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handlePageChange(sales.current_page - 1)}
                                                    disabled={sales.current_page === 1}
                                                    className="h-8 px-3 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                                    Previous
                                                </Button>
                                                
                                                <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
                                                    {getPageNumbers().map((page, index) => (
                                                        <div key={index}>
                                                            {page === '...' ? (
                                                                <div className="px-2 py-1 text-gray-500">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </div>
                                                            ) : (
                                                                <Button
                                                                    variant={page === sales.current_page ? "default" : "ghost"}
                                                                    size="sm"
                                                                    onClick={() => handlePageChange(page as number)}
                                                                    className={`h-7 w-7 p-0 rounded text-xs ${
                                                                        page === sales.current_page 
                                                                            ? "bg-blue-600 text-white hover:bg-blue-700" 
                                                                            : "hover:bg-gray-100"
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
                                                    className="h-8 px-3 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    Next
                                                    <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="text-4xl mb-2">📊</div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Found</h3>
                                <p className="text-gray-500 text-sm max-w-sm">
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
