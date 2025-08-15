import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, Download, Eye, Calendar, DollarSign, Package } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Receipts',
        href: '/receipts',
    },
];

interface SaleItem {
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    productVariant: {
        id: number;
        color?: string;
        size?: string;
        product: {
            id: number;
            name: string;
            brand: string;
            category: string;
        };
    };
}

interface Sale {
    id: number;
    total_amount: number;
    created_at: string;
    manager: {
        id: number;
        name: string;
        email: string;
    };
    saleItems: SaleItem[];
}

interface PageProps {
    sales: {
        data: Sale[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    auth: {
        user: {
            role: 'admin' | 'manager';
        };
    };
}

export default function ReceiptsIndex({ sales, auth }: PageProps) {
    // Debug logging
    console.log('ReceiptsIndex props:', { sales, auth });
    
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getTotalItems = (sale: Sale) => {
        console.log('Processing sale:', sale);
        if (!sale.saleItems || !Array.isArray(sale.saleItems)) {
            console.log('saleItems is undefined or not an array:', sale.saleItems);
            return 0;
        }
        return sale.saleItems.reduce((total, item) => total + item.quantity, 0);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Receipts" />
            
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold sm:text-xl md:text-2xl">
                            Receipts
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                            View all your sales receipts and transaction history
                        </p>
                    </div>
                </div>

                {/* Receipts List */}
                <div className="space-y-4">
                    {!sales || !sales.data || sales.data.length === 0 ? (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                                    No receipts found
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    You haven't made any sales yet. Start selling products to generate receipts.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {sales.data.filter(sale => sale && sale.id).map((sale) => (
                                <Card key={sale.id} className="hover:shadow-md transition-shadow">
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            {/* Sale Info */}
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <Receipt className="h-5 w-5 text-blue-600" />
                                                        <span className="font-semibold text-lg">
                                                            Receipt #{sale.id}
                                                        </span>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {auth.user.role === 'admin' ? 'Admin View' : 'Manager Sale'}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span>{formatDate(sale.created_at)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">
                                                            {formatCurrency(sale.total_amount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        <span>{getTotalItems(sale)} items</span>
                                                    </div>
                                                </div>

                                                {/* Manager Info (for admins) */}
                                                {auth.user.role === 'admin' && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Sold by: <span className="font-medium">{sale.manager.name}</span>
                                                    </div>
                                                )}

                                                {/* Items Preview */}
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-muted-foreground">
                                                        Items sold:
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {sale.saleItems && Array.isArray(sale.saleItems) && sale.saleItems.slice(0, 4).map((item) => (
                                                            <div key={item.id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-medium truncate">
                                                                        {item.productVariant.product.name}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {item.productVariant.color && `${item.productVariant.color}, `}
                                                                        {item.productVariant.size && `${item.productVariant.size}`}
                                                                    </p>
                                                                </div>
                                                                <div className="text-right ml-2">
                                                                    <p className="font-medium">
                                                                        {item.quantity} × {formatCurrency(item.unit_price)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {sale.saleItems && Array.isArray(sale.saleItems) && sale.saleItems.length > 4 && (
                                                            <div className="text-sm text-muted-foreground text-center py-2">
                                                                +{sale.saleItems.length - 4} more items
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                                <Link href={`/receipts/${sale.id}`}>
                                                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Receipt
                                                    </Button>
                                                </Link>
                                                <Link href={`/receipts/${sale.id}/download`}>
                                                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                                        <Download className="mr-2 h-4 w-4" />
                                                        Download
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {sales && sales.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {Array.from({ length: sales.last_page }, (_, i) => i + 1).map((page) => (
                            <Link
                                key={page}
                                href={`/receipts?page=${page}`}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    page === sales.current_page
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            >
                                {page}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
