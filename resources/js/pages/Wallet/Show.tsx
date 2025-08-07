import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, CreditCard, DollarSign, TrendingUp } from 'lucide-react';
import React, { useState } from 'react';

interface Manager {
    id: number;
    name: string;
    email: string;
}

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
    manager: Manager;
    wallet: Wallet;
    payouts: {
        data: Payout[];
        links: any[];
    };
    recentSales: Sale[];
}

export default function WalletShow({ manager, wallet, payouts, recentSales }: Props) {
    const [showPayoutDialog, setShowPayoutDialog] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        notes: '',
    });

    const handlePayout = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/wallets/${manager.id}/payout`, {
            onSuccess: () => {
                setShowPayoutDialog(false);
                setData({ amount: '', notes: '' });
            },
        });
    };

    return (
        <AppLayout>
            <Head title={`${manager.name} - Wallet`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <Link href="/wallets" className="text-muted-foreground hover:text-foreground">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tight">{manager.name}</h1>
                        </div>
                        <p className="text-muted-foreground">{manager.email}</p>
                    </div>

                    {wallet.balance > 0 && (
                        <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
                            <DialogTrigger asChild>
                                <Button>
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Process Payout
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Process Payout</DialogTitle>
                                    <DialogDescription>
                                        Process a payout for {manager.name}. Available balance: {formatCurrency(wallet.balance)}
                                    </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handlePayout}>
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="amount">Amount</Label>
                                            <Input
                                                id="amount"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max={wallet.balance}
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                placeholder="Enter payout amount"
                                            />
                                            {errors.amount && <p className="mt-1 text-sm text-destructive">{errors.amount}</p>}
                                        </div>

                                        <div>
                                            <Label htmlFor="notes">Notes (Optional)</Label>
                                            <Textarea
                                                id="notes"
                                                value={data.notes}
                                                onChange={(e) => setData('notes', e.target.value)}
                                                placeholder="Add any notes about this payout"
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter className="mt-6">
                                        <Button type="button" variant="outline" onClick={() => setShowPayoutDialog(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={processing || !data.amount}>
                                            {processing ? 'Processing...' : 'Process Payout'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
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
                            <p className="text-xs text-muted-foreground">Total payouts processed</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Recent Sales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Sales</CardTitle>
                            <CardDescription>Latest sales and commissions earned</CardDescription>
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

                    {/* Payout History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Payout History</CardTitle>
                            <CardDescription>Complete payout history</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {payouts.data.length === 0 ? (
                                    <p className="py-4 text-center text-sm text-muted-foreground">No payouts yet</p>
                                ) : (
                                    payouts.data.map((payout) => (
                                        <div key={payout.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium">Payout #{payout.id}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(payout.created_at).toLocaleDateString()}</p>
                                                <p className="text-xs text-muted-foreground">Processed by {payout.processed_by.name}</p>
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
            </div>
        </AppLayout>
    );
}
