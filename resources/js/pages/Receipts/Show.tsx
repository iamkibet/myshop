import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Eye, EyeOff, Package, Receipt, User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: '/sales',
    },
    {
        title: 'Receipt',
        href: '#',
    },
];

interface SaleItem {
    id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product_variant: {
        id: number;
        sku: string;
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
    sale_items: SaleItem[];
    manager: {
        id: number;
        name: string;
        email: string;
    };
}

interface PageProps {
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            role: 'admin' | 'manager';
        };
    };
    sale: Sale;
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function ReceiptShow() {
    const { auth, sale, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const [showManagerInfo, setShowManagerInfo] = useState(false);

    const handleDownloadReceipt = async () => {
        try {
            const response = await fetch(`/receipts/${sale.id}/download`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `receipt-${sale.id}.html`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Failed to download receipt:', error);
        }
    };

    const getVariantInfo = (variant: any) => {
        const parts = [];
        if (variant.color) parts.push(variant.color);
        if (variant.size) parts.push(variant.size);
        return parts.length > 0 ? parts.join(' - ') : 'Standard';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Receipt #${sale.id}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Success Message */}
                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                                <p className="text-sm text-green-700">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error!</h3>
                                <p className="text-sm text-red-700">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Link href="/sales">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Sales
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Receipt #{sale.id}</h1>
                            <p className="text-muted-foreground">
                                {new Date(sale.created_at).toLocaleDateString()} at {new Date(sale.created_at).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Link href="/sales">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Sales
                            </Button>
                        </Link>
                        <Button onClick={handleDownloadReceipt} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download Receipt
                        </Button>
                    </div>
                </div>

                {/* Receipt Details */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* Receipt Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Receipt className="mr-2 h-5 w-5" />
                                Receipt Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Receipt ID:</span>
                                <span className="font-medium">#{sale.id}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Date:</span>
                                <span className="font-medium">{new Date(sale.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Time:</span>
                                <span className="font-medium">{new Date(sale.created_at).toLocaleTimeString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Amount:</span>
                                <span className="text-lg font-bold">{formatCurrency(sale.total_amount)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Manager Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <User className="mr-2 h-5 w-5" />
                                    Manager Information
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowManagerInfo(!showManagerInfo)}
                                    className="flex items-center space-x-1"
                                >
                                    {showManagerInfo ? (
                                        <>
                                            <EyeOff className="h-4 w-4" />
                                            <span>Hide</span>
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="h-4 w-4" />
                                            <span>Show</span>
                                        </>
                                    )}
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        {showManagerInfo && (
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Name:</span>
                                    <span className="font-medium">{sale.manager.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email:</span>
                                    <span className="font-medium">{sale.manager.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Manager ID:</span>
                                    <span className="font-medium">#{sale.manager.id}</span>
                                </div>
                            </CardContent>
                        )}
                        {!showManagerInfo && (
                            <CardContent>
                                <div className="py-4 text-center">
                                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span className="text-sm">Manager details hidden</span>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">Click "Show" to view manager information</p>
                                </div>
                            </CardContent>
                        )}
                    </Card>

                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Package className="mr-2 h-5 w-5" />
                                Order Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Items:</span>
                                <span className="font-medium">{sale.sale_items.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Quantity:</span>
                                <span className="font-medium">{sale.sale_items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge variant="default">Completed</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Items List */}
                <Card>
                    <CardHeader>
                        <CardTitle>Order Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {sale.sale_items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center space-x-3">
                                        <Package className="h-8 w-8 text-muted-foreground" />
                                        <div>
                                            <h3 className="font-medium">{item.product_variant.product.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {getVariantInfo(item.product_variant)} • SKU: {item.product_variant.sku}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {item.product_variant.product.brand} • {item.product_variant.product.category}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center space-x-4">
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Quantity</p>
                                                <p className="font-medium">{item.quantity}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Unit Price</p>
                                                <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm text-muted-foreground">Total</p>
                                                <p className="font-bold">{formatCurrency(item.total_price)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="mt-6 border-t pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-medium">Total Amount:</span>
                                <span className="text-2xl font-bold">{formatCurrency(sale.total_amount)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
