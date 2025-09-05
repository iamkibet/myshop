import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import KPICard from '@/components/KPICard';
import { Head } from '@inertiajs/react';
import { 
    CreditCard, 
    DollarSign, 
    TrendingUp, 
    ArrowRight, 
    Wallet, 
    Receipt, 
    BarChart3, 
    Target,
    Info,
    Calendar,
    Clock,
    CheckCircle
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import { useState } from 'react';


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
    const [selectedPeriod, setSelectedPeriod] = useState('1M');
    
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'My Wallet',
            href: '/wallet',
        },
    ];


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Wallet" />

            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 bg-gray-50 pb-24 sm:pb-4">
                {/* Welcome Section */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Wallet</h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Track your earnings, commission, and payout history
                        </p>
                    </div>
                </div>

                {/* KPI Cards - Matching Dashboard Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <KPICard
                        title="Available Balance"
                        value={wallet.balance}
                        change={commissionDifference > 0 ? 100 : 0}
                        changeType={commissionDifference > 0 ? 'increase' : 'increase'}
                        icon={Wallet}
                        color="blue"
                        bgColor="bg-blue-800"
                        tooltip="Current commission balance available for withdrawal. This is calculated based on your total sales using the tiered commission system."
                    />
                    <KPICard
                        title="Total Sales"
                        value={totalSales}
                        change={15}
                        changeType="increase"
                        icon={Receipt}
                        color="green"
                        bgColor="bg-green-800"
                        tooltip="Total amount of sales you have made. This is the basis for calculating your commission earnings."
                    />
                    <KPICard
                        title="Total Earned"
                        value={wallet.total_earned}
                        change={25}
                        changeType="increase"
                        icon={TrendingUp}
                        color="purple"
                        bgColor="bg-purple-800"
                        tooltip="Total commission earned from all your sales. This includes both available balance and previously paid out amounts."
                    />
                    <KPICard
                        title="Total Paid Out"
                        value={wallet.total_paid_out}
                        change={8}
                        changeType="increase"
                        icon={CheckCircle}
                        color="orange"
                        bgColor="bg-orange-800"
                        tooltip="Total amount of commission that has been paid out to you through withdrawals or payouts."
                    />
                </div>


                {/* Payment History */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Payment History
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Your recent withdrawal transactions and payout history
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                            {recentPayouts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="text-4xl mb-2">💳</div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payments Yet</h3>
                                    <p className="text-gray-500 text-sm max-w-sm">
                                        Your payout history will appear here once you start making withdrawals
                                    </p>
                                </div>
                            ) : (
                                recentPayouts.map((payout) => (
                                    <div key={payout.id} className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                                            <div className="flex-shrink-0">
                                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                    Payment #{payout.id}
                                                </p>
                                                <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500 mt-1">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(payout.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="truncate">{payout.processed_by?.name || 'System'}</span>
                                                    </div>
                                                    {payout.notes && (
                                                        <div className="flex items-center space-x-1">
                                                            <span className="truncate">{payout.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                                            <div className="text-right">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900">{formatCurrency(payout.amount)}</p>
                                                <div className="flex items-center space-x-1 mt-1">
                                                    <Badge className={`text-xs px-2 py-0.5 ${
                                                        payout.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                        payout.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {payout.status === 'completed' ? '✓ Completed' :
                                                         payout.status === 'pending' ? '⏳ Pending' :
                                                         '✗ Failed'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Commission Details */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Commission Details
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Detailed breakdown of how your commission is calculated
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Commission Breakdown */}
                            {commissionBreakdown?.breakdown && commissionBreakdown.breakdown.length > 0 ? (
                                <div className="space-y-3">
                                    {commissionBreakdown.breakdown.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-green-900">
                                                    {formatCurrency(item.commission_per_threshold)} for every {formatCurrency(item.threshold)} in sales
                                                </p>
                                                <p className="text-xs text-green-700 mt-1">
                                                    {item.multiplier} × {formatCurrency(item.threshold)} = {formatCurrency(item.commission_earned)}
                                                </p>
                                                {item.description && (
                                                    <p className="text-xs text-green-600 mt-1 truncate">{item.description}</p>
                                                )}
                                            </div>
                                            <div className="text-right ml-4 flex-shrink-0">
                                                <p className="text-lg font-bold text-green-900">{formatCurrency(item.commission_earned)}</p>
                                                <Badge className="mt-1 text-xs bg-green-100 text-green-800">
                                                    {item.multiplier}×
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">📈</div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Commission Data</h3>
                                    <p className="text-gray-500 text-sm max-w-sm">
                                        Start making sales to see your commission breakdown
                                    </p>
                                </div>
                            )}

                            {/* Next Milestone */}
                            {nextMilestoneAmount > 0 && (
                                <div className="p-4 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50">
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-blue-900 mb-1">Next Commission Target</p>
                                        <p className="text-xs text-blue-700 mb-3">
                                            {formatCurrency(nextMilestoneAmount)} more sales needed
                                        </p>
                                        <div className="text-lg font-bold text-blue-900">
                                            {formatCurrency(qualifiedSales + nextMilestoneAmount)}
                                        </div>
                                        <p className="text-xs text-blue-600 mt-1">Target amount</p>
                                    </div>
                                </div>
                            )}

                            {/* Summary */}
                            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                                <div className="text-center">
                                    <p className="text-sm font-medium text-blue-900 mb-1">Total Commission Available</p>
                                    <p className="text-xs text-blue-700 mb-3">Based on your current sales performance</p>
                                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(expectedCommission)}</div>
                                    {commissionDifference > 0 && (
                                        <p className="text-xs text-green-600 mt-1">
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
