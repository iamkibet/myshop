import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head } from '@inertiajs/react';
import { CreditCard, DollarSign, TrendingUp } from 'lucide-react';

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

interface Sale {
    id: number;
    total_amount: number;
    created_at: string;
}

interface Props {
    wallet: Wallet;
    recentPayouts: Payout[];
    recentSales: Sale[];
}

export default function WalletIndex({ wallet, recentPayouts, recentSales }: Props) {
    return (
        <AppLayout>
            <Head title="My Wallet" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Wallet</h1>
                    <p className="text-muted-foreground">Track your earnings and payout history</p>
                </div>

                {/* Wallet Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(wallet.balance)}</div>
                            <p className="text-xs text-muted-foreground">Available for payout</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(wallet.total_earned)}</div>
                            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(wallet.total_paid_out)}</div>
                            <p className="text-xs text-muted-foreground">Total payouts received</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Sales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Sales</CardTitle>
                            <CardDescription>Your latest sales and commissions earned</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentSales.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">No sales yet</p>
                                ) : (
                                    recentSales.map((sale) => (
                                        <div key={sale.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Sale #{sale.id}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(sale.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{formatCurrency(sale.total_amount)}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    +{formatCurrency(sale.total_amount * 0.06)} commission
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Payouts */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Payouts</CardTitle>
                            <CardDescription>Your latest payout history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentPayouts.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">No payouts yet</p>
                                ) : (
                                    recentPayouts.map((payout) => (
                                        <div key={payout.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Payout #{payout.id}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(payout.created_at).toLocaleDateString()}</p>
                                                {payout.notes && <p className="text-xs text-muted-foreground">{payout.notes}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-medium">{formatCurrency(payout.amount)}</p>
                                                <Badge variant={payout.status === 'completed' ? 'default' : 'secondary'}>{payout.status}</Badge>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Commission Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Commission Structure</CardTitle>
                        <CardDescription>How your earnings are calculated</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                                <div>
                                    <p className="font-medium">Commission Rate</p>
                                    <p className="text-sm text-muted-foreground">6% of total sale amount</p>
                                </div>
                                <Badge variant="outline">6%</Badge>
                            </div>

                            <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                                <div>
                                    <p className="font-medium">Example</p>
                                    <p className="text-sm text-muted-foreground">KSH 5,000 sale = KSH 300 commission</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">KSH 5,000</p>
                                    <p className="text-xs text-muted-foreground">→ KSH 300</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
