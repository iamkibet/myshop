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
import { 
    CreditCard, 
    DollarSign, 
    TrendingUp, 
    Calculator, 
    Users, 
    BarChart3, 
    Wallet, 
    Receipt, 
    Target,
    Info,
    CheckCircle,
    TrendingDown
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import KPICard from '@/components/KPICard';
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

            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 bg-gray-50 pb-24 sm:pb-4">
                {/* Welcome Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Manager Wallets</h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                                Monitor manager earnings and process payouts
                                        </p>
                                    </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <Link href="/commission-rates" className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full">
                                    <Calculator className="mr-2 h-4 w-4" />
                                    Commission Rates
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>


                {/* KPI Cards - Matching Dashboard Style */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <KPICard
                        title="Pending Commission"
                        value={totalExpectedCommission}
                        change={15}
                        changeType="increase"
                        icon={DollarSign}
                        color="blue"
                        bgColor="bg-blue-800"
                        tooltip="Total amount of commission that managers have earned and is ready to be processed for payout. This represents the total expected commission based on current sales."
                    />
                    <KPICard
                        title="Total Sales"
                        value={managers.reduce((sum, manager) => sum + manager.total_sales, 0)}
                        change={25}
                        changeType="increase"
                        icon={Receipt}
                        color="green"
                        bgColor="bg-green-800"
                        tooltip="Combined sales value generated by all active managers in the system. This is the total revenue generated across all manager accounts."
                    />
                    <KPICard
                        title="Active Managers"
                        value={managers.length}
                        change={8}
                        changeType="increase"
                        icon={Users}
                        color="purple"
                        bgColor="bg-purple-800"
                        format="number"
                        tooltip="Number of managers currently active in the system and managing sales operations. Each manager can earn commission based on their sales performance."
                    />
                    <KPICard
                        title="Total Paid Out"
                        value={totalPaidOut}
                        change={12}
                        changeType="increase"
                        icon={CheckCircle}
                        color="orange"
                        bgColor="bg-orange-800"
                        tooltip="Total amount of commission that has been paid out to managers through withdrawals or payouts. This represents the cumulative payout history."
                    />
                </div>


                {/* Managers List */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Manager Overview
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Process payouts and manage commission for each manager
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                            {managers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="text-4xl mb-2">👥</div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Managers Found</h3>
                                    <p className="text-gray-500 text-sm max-w-sm">
                                        Manager accounts will appear here once they are added to the system
                                    </p>
                                </div>
                            ) : (
                                managers.map((manager) => (
                                    <div key={manager.id} className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                                            <div className="flex-shrink-0">
                                                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                                </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                    {manager.name}
                                                </p>
                                                <div className="flex items-center space-x-2 sm:space-x-4 text-xs text-gray-500 mt-1">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="truncate">{manager.email}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Badge className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800">
                                                            {manager.sales_count} sales
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="truncate">{formatCurrency(manager.total_sales)} total</span>
                                                    </div>
                                                </div>
                                            </div>
                                                </div>
                                        <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                                            <div className="text-right">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900">{formatCurrency(manager.expected_commission)}</p>
                                                <p className="text-xs text-gray-500">Pending</p>
                                                </div>
                                            <div className="text-right">
                                                <p className="text-xs sm:text-sm font-medium text-gray-900">{formatCurrency(manager.wallet.balance)}</p>
                                                <p className="text-xs text-gray-500">Balance</p>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                            {manager.expected_commission > 0 && (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleQuickPay(manager)}
                                                        className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                >
                                                        <DollarSign className="h-3 w-3 mr-1" />
                                                        <span className="hidden sm:inline">Pay</span>
                                                </Button>
                                            )}
                                            
                                            <Link href={`/wallets/${manager.id}`}>
                                                    <Button 
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                    >
                                                        <span className="hidden sm:inline">Details</span>
                                                        <span className="sm:hidden">View</span>
                                                </Button>
                                            </Link>
                                            </div>
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
