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
import { type BreadcrumbItem } from '@/types';

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



interface Props {
    manager: Manager;
    wallet: Wallet;
    payouts: {
        data: Payout[];
        links: any[];
    };
}

export default function WalletShow({ manager, wallet, payouts }: Props) {
    const [showPayoutDialog, setShowPayoutDialog] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Manager Wallets',
            href: '/wallets',
        },
        {
            title: manager.name,
            href: `/wallets/${manager.id}`,
        },
    ];

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
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${manager.name} - Wallet`} />

            <div className="flex h-full flex-1 flex-col gap-8 overflow-x-auto rounded-xl p-6">
                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-950 dark:via-indigo-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
                    <div className="relative p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                                    <span className="text-2xl font-bold">{manager.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">{manager.name}</h1>
                                    <p className="text-lg text-gray-600 dark:text-gray-400">{manager.email}</p>
                                    <div className="mt-2 flex items-center space-x-3">
                                        <Badge variant="outline" className="text-sm px-3 py-1">
                                            Manager
                                        </Badge>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            Wallet Management
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Link href="/wallets">
                                    <Button variant="outline" size="lg" className="border-gray-300 dark:border-gray-600">
                                        <ArrowLeft className="mr-2 h-5 w-5" />
                                        Back
                                    </Button>
                                </Link>
                                {wallet.balance > 0 && (
                                    <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
                                        <DialogTrigger asChild>
                                            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                                                <CreditCard className="mr-2 h-5 w-5" />
                                                Process Payout
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-md">
                                            <DialogHeader>
                                                <DialogTitle className="text-xl">Process Payout</DialogTitle>
                                                <DialogDescription className="text-base">
                                                    Process a payout for <span className="font-semibold">{manager.name}</span>
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
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wallet Overview */}
                <div className="grid gap-6 md:grid-cols-3">
                    <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-green-900 dark:text-green-100">Available Balance</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
                                    <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-900 dark:text-green-100 mb-2">
                                {formatCurrency(wallet.balance)}
                            </div>
                            <p className="text-sm text-green-700 dark:text-green-300">Ready for payout</p>
                            {wallet.balance > 0 && (
                                <div className="mt-3 flex items-center text-sm text-green-600 dark:text-green-400">
                                    <span className="mr-1">●</span>
                                    Available for processing
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">Total Earnings</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-800">
                                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-2">
                                {formatCurrency(wallet.total_earned)}
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">Lifetime commission earned</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950 dark:to-violet-950 border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg font-semibold text-purple-900 dark:text-purple-100">Total Paid Out</CardTitle>
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-800">
                                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-2">
                                {formatCurrency(wallet.total_paid_out)}
                            </div>
                            <p className="text-sm text-purple-700 dark:text-purple-300">Payouts processed</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Payout History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold">Payment History</CardTitle>
                        <CardDescription>Complete transaction history for this manager</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {payouts.data.length === 0 ? (
                                <div className="py-12 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                        <CreditCard className="h-8 w-8 text-gray-400" />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No payments processed yet</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Payments will appear here once processed</p>
                                </div>
                            ) : (
                                payouts.data.map((payout) => (
                                    <div key={payout.id} className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                                                <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Payment #{payout.id}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(payout.created_at).toLocaleDateString()}</p>
                                                <p className="text-xs text-muted-foreground">Processed by {payout.processed_by.name}</p>
                                                {payout.notes && (
                                                    <p className="text-xs text-muted-foreground mt-1 italic">"{payout.notes}"</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatCurrency(payout.amount)}</p>
                                            <Badge 
                                                variant={payout.status === 'completed' ? 'default' : 'secondary'} 
                                                className="mt-1"
                                            >
                                                {payout.status === 'completed' ? 'Paid' : payout.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
