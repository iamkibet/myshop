import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { CreditCard, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface Wallet {
    id: number;
    balance: number;
    total_earned: number;
    total_paid_out: number;
}

interface Payout {
    id: number;
    amount: number;
    status: string;
    notes?: string;
    created_at: string;
    processed_by: {
        name: string;
    };
}



interface Props {
    wallet: Wallet;
    totalSales: number;
    qualifiedSales: number;
    carryForwardAmount: number;
    commissionBreakdown: {
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
    nextMilestoneAmount: number;
    expectedCommission: number;
    commissionDifference: number;
    totalEarnedFromQualifiedSales: number;
    recentPayouts: Payout[];
}

export default function WalletIndex({ 
    wallet, 
    totalSales, 
    qualifiedSales,
    carryForwardAmount,
    commissionBreakdown, 
    nextMilestoneAmount, 
    expectedCommission, 
    commissionDifference, 
    totalEarnedFromQualifiedSales,
    recentPayouts
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'My Wallet',
            href: '/wallet',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Wallet" />

            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 pb-20 sm:pb-6">
                {/* Header */}
                <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Wallet</h1>
                    <p className="text-sm sm:text-base text-muted-foreground">Track your earnings and payout history</p>
                </div>

                {/* Wallet Overview - Mobile Optimized */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Main Balance Card */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100">Available Balance</CardTitle>
                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                    <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl sm:text-4xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                {formatCurrency(wallet.balance)}
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Ready for withdrawal</p>
                            {commissionDifference > 0 && (
                                <div className="mt-3 flex items-center text-sm text-green-600 dark:text-green-400">
                                    <TrendingUp className="h-4 w-4 mr-1" />
                                    +{formatCurrency(commissionDifference)} pending
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sales Performance Card */}
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-100">Sales Performance</CardTitle>
                                <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center sm:text-left">
                                    <div className="text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                                        {formatCurrency(totalSales)}
                                    </div>
                                    <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">Total Sales</p>
                                </div>
                                <div className="text-center sm:text-left">
                                    <div className="text-xl sm:text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                                        {formatCurrency(qualifiedSales)}
                                    </div>
                                    <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300">Commissionable Sales</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Earnings Summary Card */}
                <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200 dark:border-purple-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base sm:text-lg font-semibold text-purple-900 dark:text-purple-100">Earnings Summary</CardTitle>
                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800">
                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center sm:text-left">
                                <div className="text-xl sm:text-2xl font-bold text-purple-900 dark:text-purple-100">
                                    {formatCurrency(totalEarnedFromQualifiedSales)}
                                </div>
                                <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">Earnings Available</p>
                            </div>
                            <div className="text-center sm:text-left">
                                <div className="text-xl sm:text-2xl font-bold text-violet-900 dark:text-violet-100">
                                    {formatCurrency(wallet.total_paid_out)}
                                </div>
                                <p className="text-xs sm:text-sm text-violet-700 dark:text-violet-300">Total Paid Out</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">Payment History</CardTitle>
                        <CardDescription className="text-sm">Your recent withdrawal transactions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                            {recentPayouts.length === 0 ? (
                                <div className="py-6 sm:py-8 text-center">
                                    <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted">
                                        <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">No payments received yet</p>
                                </div>
                            ) : (
                                recentPayouts.map((payout) => (
                                    <div key={payout.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-3 sm:p-4 hover:bg-muted/50 transition-colors space-y-3 sm:space-y-0">
                                        <div className="flex items-center space-x-3 sm:space-x-4">
                                            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">Payment #{payout.id}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(payout.created_at).toLocaleDateString()}</p>
                                                {payout.notes && <p className="text-xs text-muted-foreground truncate">{payout.notes}</p>}
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(payout.amount)}</p>
                                            <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'} className="mt-1 text-xs">
                                                {payout.status === 'completed' ? 'Paid' : payout.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Earnings Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">Earnings Breakdown</CardTitle>
                        <CardDescription className="text-sm">How your commission is calculated based on sales performance</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                            {!commissionBreakdown?.breakdown || commissionBreakdown.breakdown.length === 0 ? (
                                <div className="py-6 sm:py-8 text-center">
                                    <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted">
                                        <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">Start making sales to earn bonuses</p>
                                </div>
                            ) : (
                                commissionBreakdown.breakdown.map((item, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 p-3 sm:p-4 border border-green-200 dark:border-green-800 space-y-3 sm:space-y-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm sm:text-base font-medium text-green-900 dark:text-green-100">
                                                {formatCurrency(item.commission_per_threshold)} bonus for {formatCurrency(item.threshold)} sales
                                            </p>
                                            <p className="text-xs sm:text-sm text-green-700 dark:text-green-300">
                                                {item.multiplier} × {formatCurrency(item.threshold)} = {formatCurrency(item.commission_earned)}
                                            </p>
                                            {item.description && (
                                                <p className="text-xs text-green-600 dark:text-green-400 truncate">{item.description}</p>
                                            )}
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <div className="text-base sm:text-lg font-bold text-green-900 dark:text-green-100">{formatCurrency(item.commission_earned)}</div>
                                            <Badge variant="outline" className="border-green-300 text-green-700 dark:border-green-600 dark:text-green-300 text-xs">{item.multiplier}×</Badge>
                                        </div>
                                    </div>
                                ))
                            )}

                            {nextMilestoneAmount > 0 && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-600 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950 space-y-3 sm:space-y-0">
                                    <div className="text-center sm:text-left">
                                        <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100">Next Bonus Target</p>
                                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                                            {formatCurrency(nextMilestoneAmount)} more sales needed
                                        </p>
                                    </div>
                                    <div className="text-center sm:text-right">
                                        <div className="text-base sm:text-lg font-bold text-blue-900 dark:text-blue-100">{formatCurrency(qualifiedSales + nextMilestoneAmount)}</div>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">Target amount</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 p-4 sm:p-6 border border-blue-200 dark:border-blue-800 space-y-3 sm:space-y-0">
                                <div className="text-center sm:text-left">
                                    <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100">Total Earnings Available</p>
                                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">Based on your sales performance</p>
                                </div>
                                <div className="text-center sm:text-right">
                                    <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">{formatCurrency(expectedCommission)}</div>
                                    {commissionDifference > 0 && (
                                        <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">
                                            +{formatCurrency(commissionDifference)} pending
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
