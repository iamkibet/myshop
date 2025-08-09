import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';

interface CommissionRate {
    id: number;
    sales_threshold: number;
    commission_amount: number;
    is_active: boolean;
    description: string | null;
    created_at: string;
    updated_at: string;
}

interface Props {
    rates: CommissionRate[];
}

export default function CommissionRatesIndex({ rates }: Props) {
    const activeRates = rates.filter(rate => rate.is_active);
    const inactiveRates = rates.filter(rate => !rate.is_active);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Commission Rates',
            href: '/commission-rates',
        },
    ];

    const handleToggleStatus = (rateId: number) => {
        router.post(`/commission-rates/${rateId}/toggle`);
    };

    const handleDelete = (rateId: number) => {
        if (confirm('Are you sure you want to delete this commission rate?')) {
            router.delete(`/commission-rates/${rateId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Commission Rates" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Commission Rates</h1>
                        <p className="text-muted-foreground">Manage commission rates for manager payouts</p>
                    </div>
                    <Link href="/commission-rates/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Commission Rate
                        </Button>
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Rates</CardTitle>
                            <Badge variant="outline">{rates.length}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{rates.length}</div>
                            <p className="text-xs text-muted-foreground">Commission rates configured</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Rates</CardTitle>
                            <Badge variant="default">{activeRates.length}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeRates.length}</div>
                            <p className="text-xs text-muted-foreground">Currently active</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Inactive Rates</CardTitle>
                            <Badge variant="secondary">{inactiveRates.length}</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{inactiveRates.length}</div>
                            <p className="text-xs text-muted-foreground">Currently disabled</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Rates */}
                <Card>
                    <CardHeader>
                        <CardTitle>Active Commission Rates</CardTitle>
                        <CardDescription>These rates are currently being used to calculate manager commissions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeRates.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">No active commission rates</p>
                        ) : (
                            <div className="space-y-4">
                                {activeRates.map((rate) => (
                                    <div key={rate.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <h3 className="font-medium">
                                                        {formatCurrency(rate.commission_amount)} per {formatCurrency(rate.sales_threshold)} sales
                                                    </h3>
                                                    {rate.description && (
                                                        <p className="text-sm text-muted-foreground">{rate.description}</p>
                                                    )}
                                                </div>
                                                <Badge variant="default">Active</Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Link href={`/commission-rates/${rate.id}/edit`}>
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleToggleStatus(rate.id)}
                                            >
                                                <EyeOff className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDelete(rate.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Inactive Rates */}
                {inactiveRates.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Inactive Commission Rates</CardTitle>
                            <CardDescription>These rates are currently disabled and not used for calculations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {inactiveRates.map((rate) => (
                                    <div key={rate.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <h3 className="font-medium">
                                                        {formatCurrency(rate.commission_amount)} per {formatCurrency(rate.sales_threshold)} sales
                                                    </h3>
                                                    {rate.description && (
                                                        <p className="text-sm text-muted-foreground">{rate.description}</p>
                                                    )}
                                                </div>
                                                <Badge variant="secondary">Inactive</Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Link href={`/commission-rates/${rate.id}/edit`}>
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleToggleStatus(rate.id)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDelete(rate.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
