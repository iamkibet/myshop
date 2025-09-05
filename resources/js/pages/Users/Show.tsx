import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, DollarSign, Edit, Receipt, ShoppingCart, TrendingUp, UserCheck, Calendar, Mail, Shield, Users, CreditCard, Target, Award } from 'lucide-react';
import { useState } from 'react';

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

interface Sale {
    id: number;
    total_amount: number;
    created_at: string;
    sale_items: SaleItem[];
}

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager';
    created_at: string;
    sales?: Sale[];
}

interface SalesStats {
    total_sales: number;
    total_revenue: number;
    total_products_sold: number;
    average_sale_value: number;
    today_sales?: number;
    this_week_sales?: number;
    this_month_sales?: number;
}

interface UsersShowProps {
    user: User;
    salesStats: SalesStats;
    recentSales?: Sale[];
    // Commission data for managers
    totalSales?: number;
    qualifiedSales?: number;
    carryForwardAmount?: number;
    commissionBreakdown?: {
        breakdown: Array<{
            threshold: number;
            commission_per_threshold: number;
            multiplier: number;
            commission_earned: number;
            description: string | null;
        }>;
        total_commission: number;
        remaining_sales: number;
    };
    nextMilestoneAmount?: number;
    expectedCommission?: number;
    commissionDifference?: number;
    wallet?: {
        balance: number;
        total_earned: number;
        total_paid_out: number;
        paid_sales: number;
    };
}

export default function UsersShow({ 
    user, 
    salesStats, 
    recentSales,
    totalSales,
    qualifiedSales,
    carryForwardAmount,
    commissionBreakdown,
    nextMilestoneAmount,
    expectedCommission,
    commissionDifference,
    wallet
}: UsersShowProps) {
    const [showPayoutDialog, setShowPayoutDialog] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Users',
            href: '/users',
        },
        {
            title: user.name,
            href: '#',
        },
    ];
    const getRoleBadgeVariant = (role: string) => {
        return role === 'admin' ? 'default' : 'secondary';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Ensure recentSales is always an array
    const safeRecentSales = recentSales || [];

    const handlePayout = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/wallets/${user.id}/payout`, {
            onSuccess: () => {
                setShowPayoutDialog(false);
                setData({ amount: '', notes: '' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`User: ${user.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-3 sm:p-4 pb-20 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                            <Link href="/users" className="flex-shrink-0">
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:px-3">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline ml-2">Back</span>
                                </Button>
                            </Link>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">
                                    {user.name}
                                </h1>
                                <p className="text-sm sm:text-base text-muted-foreground truncate">
                                    {user.email}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1">
                            {user.role === 'admin' ? 'Administrator' : 'Manager'}
                        </Badge>
                        <span className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Sales Performance Overview */}
                <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-lg font-semibold text-blue-900 dark:text-blue-100">Total Sales</CardTitle>
                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6">
                            <div className="text-xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1 sm:mb-2">
                                {salesStats.total_sales}
                            </div>
                            <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">Transactions processed</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-lg font-semibold text-green-900 dark:text-green-100">Total Revenue</CardTitle>
                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6">
                            <div className="text-xl sm:text-3xl font-bold text-green-900 dark:text-green-100 mb-1 sm:mb-2">
                                {formatCurrency(salesStats.total_revenue)}
                            </div>
                            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">Revenue generated</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-lg font-semibold text-purple-900 dark:text-purple-100">Products Sold</CardTitle>
                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6">
                            <div className="text-xl sm:text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1 sm:mb-2">
                                {salesStats.total_products_sold}
                            </div>
                            <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">Items sold</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 border-orange-200 dark:border-orange-800">
                        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm sm:text-lg font-semibold text-orange-900 dark:text-orange-100">Average Sale</CardTitle>
                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-800">
                                    <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-3 sm:px-6">
                            <div className="text-xl sm:text-3xl font-bold text-orange-900 dark:text-orange-100 mb-1 sm:mb-2">
                                {formatCurrency(salesStats.average_sale_value)}
                            </div>
                            <p className="text-xs sm:text-sm text-orange-700 dark:text-orange-300">Per transaction</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Manager Commission Section */}
                {user.role === 'manager' && commissionBreakdown && expectedCommission !== undefined && (
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Commission Overview */}
                        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-emerald-200 dark:border-emerald-800">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">Commission Overview</CardTitle>
                                <CardDescription className="text-emerald-700 dark:text-emerald-300">Performance-based earnings breakdown</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="text-center">
                                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
                                            <Target className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(qualifiedSales || 0)}</p>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300">Commissionable Sales</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-800">
                                            <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(expectedCommission || 0)}</p>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300">Available Commission</p>
                                    </div>
                                </div>
                                
                                {commissionDifference && commissionDifference > 0 && (
                                    <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Pending Amount</span>
                                            <span className="text-lg font-bold text-emerald-900 dark:text-emerald-100">+{formatCurrency(commissionDifference)}</span>
                                        </div>
                                    </div>
                                )}

                                {nextMilestoneAmount && nextMilestoneAmount > 0 && (
                                    <div className="rounded-lg border border-emerald-200 dark:border-emerald-700 p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Next Milestone</p>
                                                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    {formatCurrency(nextMilestoneAmount)} more needed
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                                                    {formatCurrency((qualifiedSales || 0) + nextMilestoneAmount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Process Payment */}
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold text-blue-900 dark:text-blue-100">Process Payment</CardTitle>
                                <CardDescription className="text-blue-700 dark:text-blue-300">Manage commission payouts</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                        <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                        {formatCurrency(wallet?.balance || 0)}
                                    </p>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">Current Balance</p>
                                </div>

                                {wallet && wallet.balance > 0 && (
                                    <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12">
                                                <CreditCard className="mr-2 h-5 w-5" />
                                                Pay Manager
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl">Process Payout</DialogTitle>
                                                <DialogDescription className="text-base">
                                                    Process a payout for <span className="font-semibold">{user.name}</span>
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form onSubmit={handlePayout}>
                                                <div className="space-y-6">
                                                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-4">
                                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                                            Available balance: <span className="font-bold text-blue-900 dark:text-blue-100">{formatCurrency(wallet.balance)}</span>
                                                        </p>
                                                    </div>
                                                    
                                                    <div>
                                                        <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
                                                        <Input
                                                            id="amount"
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            max={wallet.balance}
                                                            value={data.amount}
                                                            onChange={(e) => setData('amount', e.target.value)}
                                                            placeholder="Enter payout amount"
                                                            className="mt-2"
                                                        />
                                                        {errors.amount && <p className="mt-1 text-sm text-destructive">{errors.amount}</p>}
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
                                                        <Textarea
                                                            id="notes"
                                                            value={data.notes}
                                                            onChange={(e) => setData('notes', e.target.value)}
                                                            placeholder="Add any notes about this payout"
                                                            className="mt-2"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter className="mt-6">
                                                    <Button type="button" variant="outline" onClick={() => setShowPayoutDialog(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button type="submit" disabled={processing || !data.amount} className="bg-green-600 hover:bg-green-700">
                                                        {processing ? 'Processing...' : 'Process Payout'}
                                                    </Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Total Earned:</span>
                                        <span className="font-medium">{formatCurrency(wallet?.total_earned || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Total Paid Out:</span>
                                        <span className="font-medium">{formatCurrency(wallet?.total_paid_out || 0)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Commission Breakdown Details */}
                {user.role === 'manager' && commissionBreakdown && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-semibold">Earnings Breakdown</CardTitle>
                            <CardDescription>Detailed commission calculation based on sales thresholds</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {!commissionBreakdown?.breakdown || commissionBreakdown.breakdown.length === 0 ? (
                                    <div className="py-8 text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                            <Award className="h-8 w-8 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No commission earned yet</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start making sales to earn commission</p>
                                    </div>
                                ) : (
                                    commissionBreakdown.breakdown.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                                    <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        Bonus for {formatCurrency(item.threshold)} sales
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {item.multiplier} × {formatCurrency(item.threshold)} = {formatCurrency(item.commission_earned)}
                                                    </p>
                                                    {item.description && (
                                                        <p className="text-xs text-muted-foreground italic">"{item.description}"</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(item.commission_earned)}</p>
                                                <Badge variant="outline" className="mt-1">{item.multiplier}×</Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Recent Sales */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Recent Sales</CardTitle>
                        <CardDescription>Latest transactions and sales history</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {safeRecentSales.length > 0 ? (
                            <div className="space-y-4">
                                {safeRecentSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">Sale #{sale.id}</p>
                                                <p className="text-sm text-muted-foreground">{formatDate(sale.created_at)}</p>
                                                <p className="text-xs text-muted-foreground">{sale.sale_items?.length || 0} items</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(sale.total_amount)}</p>
                                            <div className="flex items-center space-x-2 mt-2">
                                                <Link href={`/receipts/${sale.id}`}>
                                                    <Button variant="outline" size="sm" className="h-8 px-3">
                                                        <Receipt className="h-3 w-3 mr-1" />
                                                        Receipt
                                                    </Button>
                                                </Link>
                                                {user.role === 'manager' && (
                                                    <Link href={`/manager/${user.id}`}>
                                                        <Button variant="outline" size="sm" className="h-8 px-3">
                                                            <TrendingUp className="h-3 w-3 mr-1" />
                                                            Sales
                                                        </Button>
                                                    </Link>
                                                )}
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
                                <p className="text-sm text-gray-500 dark:text-gray-400">No sales found for this user</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Sales will appear here once transactions are made</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
