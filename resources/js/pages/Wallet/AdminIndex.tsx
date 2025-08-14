import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { CreditCard, DollarSign, TrendingUp, RefreshCw, Calculator, Users } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';

interface Manager {
    id: number;
    name: string;
    email: string;
    total_sales: number;
    qualified_sales: number;
    sales_count: number;
    expected_commission: number;
    next_milestone_amount: number;
    commission_breakdown: {
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
    wallet: {
        balance: number;
        total_earned: number;
        total_paid_out: number;
        paid_sales: number;
    };
}

interface Props {
    managers: Manager[];
}

export default function WalletAdminIndex({ managers }: Props) {
    const totalBalance = managers.reduce((sum, manager) => sum + manager.wallet.balance, 0);
    const totalEarned = managers.reduce((sum, manager) => sum + manager.wallet.total_earned, 0);
    const totalPaidOut = managers.reduce((sum, manager) => sum + manager.wallet.total_paid_out, 0);
    const totalExpectedCommission = managers.reduce((sum, manager) => sum + manager.expected_commission, 0);

    const [showPayoutDialog, setShowPayoutDialog] = useState(false);
    const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncFeedback, setSyncFeedback] = useState<string>('');

    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Manager Wallets',
            href: '/wallets',
        },
    ];

    const handleSyncAll = async () => {
        if (confirm('Are you sure you want to sync all manager wallets based on their current sales?')) {
            setIsSyncing(true);
            setSyncFeedback('Syncing all wallets...');
            
            try {
                await router.post('/wallets/sync-all');
                setSyncFeedback('All wallets synced successfully!');
                setTimeout(() => setSyncFeedback(''), 3000);
            } catch (error) {
                setSyncFeedback('Sync failed. Please try again.');
                setTimeout(() => setSyncFeedback(''), 3000);
            } finally {
                setIsSyncing(false);
            }
        }
    };

    const handleSyncManager = (managerId: number) => {
        if (confirm('Are you sure you want to sync this manager\'s wallet based on their current sales?')) {
            router.post(`/wallets/${managerId}/sync`);
        }
    };

    const handleQuickPay = (manager: Manager) => {
        setSelectedManager(manager);
        setData({ amount: manager.wallet.balance.toString(), notes: '' });
        setShowPayoutDialog(true);
    };

    const handlePayout = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedManager) {
            post(`/wallets/${selectedManager.id}/payout`, {
                onSuccess: () => {
                    setShowPayoutDialog(false);
                    setSelectedManager(null);
                    setData({ amount: '', notes: '' });
                },
            });
        }
    };

    return (
        <TooltipProvider>
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Manager Wallets" />

            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 pb-20 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Manager Wallets</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Monitor manager earnings and process payouts</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        {/* Mobile Sync Icon with Animation - Inline with other buttons */}
                        <div className="flex items-center space-x-2 w-full sm:w-auto">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={handleSyncAll} 
                                        disabled={isSyncing}
                                        className={`h-10 w-10 p-0 rounded-full transition-all duration-300 ${
                                            isSyncing 
                                                ? 'bg-blue-100 border-blue-300 dark:bg-blue-900 dark:border-blue-700' 
                                                : 'hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900 dark:hover:border-blue-700'
                                        }`}
                                    >
                                        <RefreshCw 
                                            className={`h-4 w-4 transition-all duration-300 ${
                                                isSyncing ? 'animate-spin text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                                            }`} 
                                        />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="max-w-xs">
                                    <div className="text-center">
                                        <p className="font-semibold">Sync All Wallets</p>
                                        <p className="text-sm text-muted-foreground">
                                            {isSyncing ? 'Syncing all manager wallets...' : 'Update all manager wallets based on current sales'}
                                        </p>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                            
                            <Link href="/commission-rates" className="flex-1 sm:flex-none">
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <Calculator className="mr-2 h-4 w-4" />
                                    Commission Rates
                                </Button>
                            </Link>
                        </div>
                        
                        {/* Desktop Sync Button with Feedback */}
                        <Button 
                            variant="outline" 
                            onClick={handleSyncAll} 
                            disabled={isSyncing}
                            className={`hidden sm:flex transition-all duration-300 ${
                                isSyncing 
                                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300' 
                                    : 'hover:bg-blue-50 hover:border-blue-300'
                            }`}
                        >
                            <RefreshCw 
                                className={`mr-2 h-4 w-4 transition-all duration-300 ${
                                    isSyncing ? 'animate-spin' : ''
                                }`} 
                            />
                            {isSyncing ? 'Syncing...' : 'Sync All Wallets'}
                        </Button>
                    </div>
                </div>

                {/* Sync Feedback Banner */}
                {syncFeedback && (
                    <div className={`rounded-lg border p-3 text-center transition-all duration-300 ${
                        syncFeedback.includes('successfully') 
                            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200' 
                            : syncFeedback.includes('failed') 
                            ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200' 
                            : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200'
                    }`}>
                        <div className="flex items-center justify-center space-x-2">
                            {syncFeedback.includes('successfully') ? (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500">
                                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            ) : syncFeedback.includes('failed') ? (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500">
                                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            ) : (
                                <RefreshCw className={`h-5 w-5 ${isSyncing ? 'animate-spin' : ''}`} />
                            )}
                            <span className="font-medium">{syncFeedback}</span>
                        </div>
                    </div>
                )}

                {/* Summary Cards - Redesigned with Tooltips */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100 dark:from-blue-950 dark:via-blue-900 dark:to-indigo-900 border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-800 shadow-sm">
                                            <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400">Pending</p>
                                            <p className="text-xs text-blue-500 dark:text-blue-500">Commission</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-900 dark:text-blue-100">
                                            {formatCurrency(totalExpectedCommission)}
                                        </div>
                                        <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 font-medium">
                                            Ready for processing
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                            <div className="text-center">
                                <p className="font-semibold">Pending Commission</p>
                                <p className="text-sm text-muted-foreground">
                                    Total amount of commission that managers have earned and is ready to be processed for payout.
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                    Amount: {formatCurrency(totalExpectedCommission)}
                                </p>
                            </div>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="bg-gradient-to-br from-green-50 via-emerald-100 to-teal-100 dark:from-green-950 dark:via-emerald-900 dark:to-teal-900 border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-green-100 dark:bg-green-800 shadow-sm">
                                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">Total</p>
                                            <p className="text-xs text-green-500 dark:text-green-500">Sales</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-green-900 dark:text-green-100">
                                            {formatCurrency(managers.reduce((sum, manager) => sum + manager.total_sales, 0))}
                                        </div>
                                        <p className="text-xs sm:text-sm text-green-700 dark:text-green-300 font-medium">
                                            Generated by managers
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                            <div className="text-center">
                                <p className="font-semibold">Total Sales Volume</p>
                                <p className="text-sm text-muted-foreground">
                                    Combined sales value generated by all active managers in the system.
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Total: {formatCurrency(managers.reduce((sum, manager) => sum + manager.total_sales, 0))}
                                </p>
                            </div>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Card className="bg-gradient-to-br from-purple-50 via-violet-100 to-fuchsia-100 dark:from-purple-950 dark:via-violet-900 dark:to-fuchsia-900 border-0 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-800 shadow-sm">
                                            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">Active</p>
                                            <p className="text-xs text-purple-500 dark:text-purple-500">Managers</p>
                                        </div>
                                        <div className="absolute top-3 right-3">
                                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white text-xs font-bold">
                                                {managers.length}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-purple-900 dark:text-purple-100">
                                            {managers.length}
                                        </div>
                                        <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 font-medium">
                                            Managing sales
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                            <div className="text-center">
                                <p className="font-semibold">Active Managers</p>
                                <p className="text-sm text-muted-foreground">
                                    Number of managers currently active in the system and managing sales operations.
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                    Count: {managers.length} managers
                                </p>
                            </div>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Managers List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg sm:text-xl">Manager Overview</CardTitle>
                        <CardDescription className="text-sm">Process payouts and manage commission for each manager</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {managers.length === 0 ? (
                                <div className="py-6 sm:py-8 text-center">
                                    <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-muted">
                                        <Users className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">No managers found</p>
                                </div>
                            ) : (
                                managers.map((manager) => (
                                    <div key={manager.id} className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4 sm:p-6 hover:bg-muted/50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 sm:space-x-4">
                                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                                    <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base sm:text-lg font-semibold truncate">{manager.name}</h3>
                                                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{manager.email}</p>
                                                    <div className="mt-1 flex items-center space-x-2">
                                                        <Badge variant="outline" className="text-xs">{manager.sales_count} sales</Badge>
                                                        <span className="text-xs text-muted-foreground">•</span>
                                                        <span className="text-xs text-muted-foreground">{formatCurrency(manager.total_sales)} total</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-sm">
                                                <div className="text-center sm:text-left">
                                                    <p className="text-xs sm:text-sm text-muted-foreground">Commissionable Sales</p>
                                                    <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(manager.qualified_sales)}</p>
                                                </div>
                                                <div className="text-center sm:text-left">
                                                    <p className="text-xs sm:text-sm text-muted-foreground">Pending Commission</p>
                                                    <p className="text-base sm:text-lg font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(manager.expected_commission)}</p>
                                                </div>
                                                <div className="text-center sm:text-left">
                                                    <p className="text-xs sm:text-sm text-muted-foreground">Current Balance</p>
                                                    <p className="text-base sm:text-lg font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(manager.wallet.balance)}</p>
                                                </div>
                                            </div>
                                            
                                            {manager.next_milestone_amount > 0 && (
                                                <div className="mt-2 text-xs text-muted-foreground">
                                                    Next milestone: {formatCurrency(manager.next_milestone_amount)} more needed
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                                            {manager.expected_commission > 0 && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleQuickPay(manager)}
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                    <DollarSign className="mr-1 h-3 w-3" />
                                                    Pay {formatCurrency(manager.expected_commission)}
                                                </Button>
                                            )}
                                            
                                            <Link href={`/wallets/${manager.id}`}>
                                                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                    Details
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Payout Dialog */}
            <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Payout</DialogTitle>
                        <DialogDescription>
                            Process a payout for {selectedManager?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePayout} className="space-y-4">
                        <div>
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0.01"
                                max={selectedManager?.wallet.balance || 0}
                                value={data.amount}
                                onChange={(e) => setData('amount', e.target.value)}
                                required
                            />
                            {errors.amount && (
                                <p className="text-sm text-red-600">{errors.amount}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Available balance: {formatCurrency(selectedManager?.wallet.balance || 0)}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="notes">Notes (Optional)</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Add any notes about this payout..."
                            />
                        </div>
                        <DialogFooter>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setShowPayoutDialog(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Processing...' : 'Process Payout'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            </AppLayout>
        </TooltipProvider>
    );
}
