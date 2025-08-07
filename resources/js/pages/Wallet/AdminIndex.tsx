import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { CreditCard, DollarSign, TrendingUp } from 'lucide-react';

interface Manager {
    id: number;
    name: string;
    email: string;
    total_sales: number;
    sales_count: number;
    wallet: {
        balance: number;
        total_earned: number;
        total_paid_out: number;
    };
}

interface Props {
    managers: Manager[];
}

export default function WalletAdminIndex({ managers }: Props) {
    const totalBalance = managers.reduce((sum, manager) => sum + manager.wallet.balance, 0);
    const totalEarned = managers.reduce((sum, manager) => sum + manager.wallet.total_earned, 0);
    const totalPaidOut = managers.reduce((sum, manager) => sum + manager.wallet.total_paid_out, 0);

    return (
        <>
            <Head title="Manager Wallets" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Manager Wallets</h1>
                        <p className="text-muted-foreground">Monitor manager earnings and process payouts</p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
                            <p className="text-xs text-muted-foreground">Available for payouts</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalEarned)}</div>
                            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(totalPaidOut)}</div>
                            <p className="text-xs text-muted-foreground">Total payouts processed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Managers List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Manager Wallets</CardTitle>
                        <CardDescription>Click on a manager to view details and process payouts</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {managers.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No managers found</p>
                            ) : (
                                managers.map((manager) => (
                                    <div key={manager.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <h3 className="font-medium">{manager.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{manager.email}</p>
                                                </div>
                                                <Badge variant="outline">{manager.sales_count} sales</Badge>
                                            </div>

                                            <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Total Sales</p>
                                                    <p className="font-medium">{formatCurrency(manager.total_sales)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Balance</p>
                                                    <p className="font-medium">{formatCurrency(manager.wallet.balance)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Total Earned</p>
                                                    <p className="font-medium">{formatCurrency(manager.wallet.total_earned)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Link href={`/wallets/${manager.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                            {manager.wallet.balance > 0 && (
                                                <Link href={`/wallets/${manager.id}`}>
                                                    <Button size="sm">Process Payout</Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
