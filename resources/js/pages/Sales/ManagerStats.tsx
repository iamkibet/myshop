import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Calendar, Download, Eye, Filter, Package, Receipt, Search, TrendingUp, User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin-dashboard',
    },
    {
        title: 'Manager Stats',
        href: '#',
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

interface Manager {
    id: number;
    name: string;
    email: string;
}

interface Stats {
    manager: Manager;
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    todaySales: number;
    thisWeekSales: number;
    thisMonthSales: number;
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
    stats: Stats;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function ManagerStats() {
    const { auth, sales, stats, flash } = usePage<PageProps>().props;
    const user = auth.user;

    const [search, setSearch] = useState('');
    const [dateFilter, setDateFilter] = useState('all');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            `/manager/${stats.manager.id}`,
            { search: value, date_filter: dateFilter },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDateFilter = (value: string) => {
        setDateFilter(value);
        router.get(
            `/manager/${stats.manager.id}`,
            { search, date_filter: value },
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
            const response = await fetch(`/receipts/${saleId}/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${saleId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Failed to download receipt:', error);
        }
    };

    const getVariantInfo = (variant: any) => {
        const parts = [];
        if (variant.color) parts.push(variant.color);
        if (variant.size) parts.push(variant.size);
        return parts.length > 0 ? parts.join(' - ') : 'Standard';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${stats.manager.name} - Manager Stats`} />
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
                    <div className="flex items-center space-x-4">
                        <Link href="/admin-dashboard">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{stats.manager.name}</h1>
                            <p className="text-muted-foreground">Manager Performance Analytics</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Link href={`/users/${stats.manager.id}`}>
                            <Button variant="outline" size="sm">
                                <User className="mr-2 h-4 w-4" />
                                View Profile
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Manager Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <User className="mr-2 h-5 w-5" />
                            Manager Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Name</label>
                                <p className="text-lg font-semibold">{stats.manager.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Email</label>
                                <p className="text-lg font-semibold">{stats.manager.email}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Manager ID</label>
                                <p className="text-lg font-semibold">#{stats.manager.id}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
                            <p className="text-xs text-muted-foreground">{stats.totalOrders} orders</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
                            <p className="text-xs text-muted-foreground">per order</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.todaySales)}</div>
                            <p className="text-xs text-muted-foreground">today</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.thisMonthSales)}</div>
                            <p className="text-xs text-muted-foreground">this month</p>
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
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Search sales..."
                                        value={search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Select value={dateFilter} onValueChange={handleDateFilter}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Time</SelectItem>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">This Week</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sales List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sales History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sales && sales.data.length > 0 ? (
                            <div className="space-y-4">
                                {sales.data.map((sale) => (
                                    <div key={sale.id} className="rounded-lg border p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Receipt className="h-5 w-5 text-muted-foreground" />
                                                <div>
                                                    <h3 className="font-medium">Sale #{sale.id}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(sale.created_at).toLocaleDateString()} at{' '}
                                                        {new Date(sale.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-lg font-bold">{formatCurrency(sale.total_amount)}</span>
                                                <div className="flex space-x-1">
                                                    <Button variant="outline" size="sm" onClick={() => handleViewReceipt(sale.id)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(sale.id)}>
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sale Items */}
                                        <div className="space-y-2">
                                            {sale.sale_items.map((item) => (
                                                <div key={item.id} className="flex items-center justify-between rounded-md bg-muted p-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">{item.product_variant.product.name}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {getVariantInfo(item.product_variant)} • Qty: {item.quantity}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium">{formatCurrency(item.total_price)}</p>
                                                        <p className="text-sm text-muted-foreground">{formatCurrency(item.unit_price)} each</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <Receipt className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No sales found for this manager.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
