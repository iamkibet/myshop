import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

    const handleSyncAll = () => {
        if (confirm('Are you sure you want to sync all manager wallets based on their current sales?')) {
            router.post('/wallets/sync-all');
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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Manager Wallets" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manager Wallets</h1>
                        <p className="text-muted-foreground">Monitor manager earnings and process payouts</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline" onClick={handleSyncAll}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Sync All Wallets
                        </Button>
                        <Link href="/commission-rates">
                            <Button variant="outline">
                                <Calculator className="mr-2 h-4 w-4" />
                                Commission Rates
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">Pending Payouts</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                {formatCurrency(totalExpectedCommission)}
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Commission to be processed</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-green-900 dark:text-green-100">Sales Volume</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                                {formatCurrency(managers.reduce((sum, manager) => sum + manager.total_sales, 0))}
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">Total sales generated</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100">Active Managers</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800">
                                    <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                                {managers.length}
                            </div>
                            <p className="text-sm text-purple-700 dark:text-purple-300">Managing sales</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Managers List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Manager Overview</CardTitle>
                        <CardDescription>Process payouts and manage commission for each manager</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {managers.length === 0 ? (
                                <div className="py-8 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                        <Users className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">No managers found</p>
                                </div>
                            ) : (
                                managers.map((manager) => (
                                    <div key={manager.id} className="flex items-center justify-between rounded-lg border p-6 hover:bg-muted/50 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-semibold">{manager.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{manager.email}</p>
                                                    <div className="mt-1 flex items-center space-x-2">
                                                        <Badge variant="outline">{manager.sales_count} sales</Badge>
                                                        <span className="text-xs text-muted-foreground">•</span>
                                                        <span className="text-xs text-muted-foreground">{formatCurrency(manager.total_sales)} total</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 grid grid-cols-3 gap-6 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Commissionable Sales</p>
                                                    <p className="text-lg font-semibold text-green-600 dark:text-green-400">{formatCurrency(manager.qualified_sales)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Pending Commission</p>
                                                    <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(manager.expected_commission)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Current Balance</p>
                                                    <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">{formatCurrency(manager.wallet.balance)}</p>
                                                </div>
                                            </div>
                                            
                                            {manager.next_milestone_amount > 0 && (
                                                <div className="mt-2 text-xs text-muted-foreground">
                                                    Next milestone: {formatCurrency(manager.next_milestone_amount)} more needed
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleSyncManager(manager.id)}
                                                className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                                            >
                                                <RefreshCw className="mr-1 h-3 w-3" />
                                                Sync
                                            </Button>
                                            
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
                                                <Button variant="outline" size="sm">
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
    );
}
