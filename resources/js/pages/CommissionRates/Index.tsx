import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Edit, Trash2, Eye, EyeOff, TrendingUp, DollarSign, Settings } from 'lucide-react';
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

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl pb-20 sm:pb-8">
                {/* Header Section - Mobile Optimized */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Commission Rates
                            </h1>
                            <p className="mt-2 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
                                Manage commission rates for manager payouts and incentives
                            </p>
                        </div>
                        <div className="flex justify-center sm:justify-end">
                            <Link href="/commission-rates/create" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto">
                                    <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    Add Rate
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Summary Cards - Mobile Optimized Grid */}
                <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300">
                                Total Rates
                            </CardTitle>
                            <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold text-blue-900 dark:text-blue-100">
                                {rates.length}
                            </div>
                            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">
                                Commission rates configured
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 dark:border-green-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-300">
                                Active Rates
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold text-green-900 dark:text-green-100">
                                {activeRates.length}
                            </div>
                            <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 mt-1">
                                Currently active
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-950 dark:border-gray-800 sm:col-span-2 lg:col-span-1">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                                Inactive Rates
                            </CardTitle>
                            <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {inactiveRates.length}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Currently disabled
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Active Rates Section */}
                <Card className="mb-6 sm:mb-8 border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Active Commission Rates
                        </CardTitle>
                        <CardDescription className="text-green-600 dark:text-green-400">
                            These rates are currently being used to calculate manager commissions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {activeRates.length === 0 ? (
                            <div className="py-8 sm:py-12 text-center">
                                <TrendingUp className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                                    No active commission rates
                                </p>
                                <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                                    Create your first commission rate to get started
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3 sm:space-y-4">
                                {activeRates.map((rate) => (
                                    <div key={rate.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-green-200 dark:border-green-700 p-4 sm:p-6 bg-green-50/30 dark:bg-green-950/30 hover:shadow-sm transition-shadow space-y-3 sm:space-y-0">
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between sm:justify-start gap-2 sm:gap-4 mb-2">
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatCurrency(rate.commission_amount)} commission
                                                        </h3>
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 text-xs px-2 py-1">
                                                            Active
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">
                                                        Per {formatCurrency(rate.sales_threshold)} in sales
                                                    </p>
                                                    {rate.description && (
                                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                            {rate.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons - Mobile Stacked, Desktop Inline */}
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                            <Link href={`/commission-rates/${rate.id}/edit`} className="w-full sm:w-auto">
                                                <Button size="sm" className="w-full sm:w-auto h-10 sm:h-8 px-4 sm:px-3 text-sm sm:text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                                    <Edit className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                                                    <span>Edit</span>
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleToggleStatus(rate.id)}
                                                className="w-full sm:w-auto h-10 sm:h-8 px-4 sm:px-3 text-sm sm:text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/20"
                                            >
                                                <EyeOff className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                                                <span>Disable</span>
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDelete(rate.id)}
                                                className="w-full sm:w-auto h-10 sm:h-8 px-4 sm:px-3 text-sm sm:text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                                                <span>Delete</span>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Inactive Rates Section - Only show if there are inactive rates */}
                {inactiveRates.length > 0 && (
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <EyeOff className="h-5 w-5" />
                                Inactive Commission Rates
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400">
                                These rates are currently disabled and not used for calculations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 sm:space-y-4">
                                {inactiveRates.map((rate) => (
                                    <div key={rate.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gray-50/30 dark:bg-gray-800/30 hover:shadow-sm transition-shadow space-y-3 sm:space-y-0">
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between sm:justify-start gap-2 sm:gap-4 mb-2">
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatCurrency(rate.commission_amount)} commission
                                                        </h3>
                                                        <Badge variant="secondary" className="text-xs px-2 py-1">
                                                            Inactive
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-2">
                                                        Per {formatCurrency(rate.sales_threshold)} in sales
                                                    </p>
                                                    {rate.description && (
                                                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                            {rate.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons - Mobile Stacked, Desktop Inline */}
                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                            <Link href={`/commission-rates/${rate.id}/edit`} className="w-full sm:w-auto">
                                                <Button size="sm" className="w-full sm:w-auto h-10 sm:h-8 px-4 sm:px-3 text-sm sm:text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                                    <Edit className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                                                    <span>Edit</span>
                                                </Button>
                                            </Link>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleToggleStatus(rate.id)}
                                                className="w-full sm:w-auto h-10 sm:h-8 px-4 sm:px-3 text-sm sm:text-xs border-green-300 text-green-700 hover:bg-green-50 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/20"
                                            >
                                                <Eye className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                                                <span>Enable</span>
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDelete(rate.id)}
                                                className="w-full sm:w-auto h-10 sm:h-8 px-4 sm:px-3 text-sm sm:text-xs border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
                                            >
                                                <Trash2 className="h-4 w-4 sm:h-3 sm:w-3 mr-2 sm:mr-1" />
                                                <span>Delete</span>
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
