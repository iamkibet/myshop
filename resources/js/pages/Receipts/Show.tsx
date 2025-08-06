import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Eye, EyeOff, Package, Printer, User } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Receipts',
        href: '/receipts',
    },
    {
        title: 'View Receipt',
        href: '#',
    },
];

interface SaleItem {
    id: number;
    product_variant_id: number;
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
    sale_items: SaleItem[];
}

interface PageProps {
    sale: Sale;
    app: {
        name: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function ShowReceipt() {
    const { props } = usePage<PageProps>();
    const { sale } = props;
    const appName = props.app?.name || 'MyShop';
    const [showPassword, setShowPassword] = useState(false);

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleDownloadReceipt = async () => {
        try {
            const response = await fetch(`/receipts/${sale.id}/download`, {
                method: 'GET',
                headers: {
                    Accept: 'text/html',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download receipt');
            }

            const blob = await response.blob();

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Download the HTML file
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${sale.id}.html`;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Clean up the URL object after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            // Show instructions for converting to PDF
            alert(
                'Receipt downloaded! To convert to PDF:\n1. Open the HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Choose "Save as PDF" in the print dialog',
            );
        } catch (error) {
            console.error('Failed to download receipt:', error);
            alert('Failed to download receipt. Please try again.');
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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Success Message */}
                {props.flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                                <p className="text-sm text-green-700">{props.flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {props.flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error!</h3>
                                <p className="text-sm text-red-700">{props.flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Receipt #{sale.id}</h1>
                        <p className="text-muted-foreground">
                            {new Date(sale.created_at).toLocaleDateString()} at {new Date(sale.created_at).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/sales">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Sales
                            </Button>
                        </Link>
                        <Button onClick={handlePrintReceipt} variant="outline">
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                        </Button>
                        <Button onClick={handleDownloadReceipt} variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>

                {/* Receipt Container */}
                <div className="print:p-0">
                    <Card className="print:border-0 print:shadow-none">
                        <CardContent className="p-0 print:p-0">
                            {/* Receipt Header */}
                            <div className="border-b bg-gray-50 p-6 text-center dark:bg-gray-800">
                                <h2 className="text-2xl font-bold tracking-tight">{appName}</h2>
                                <p className="text-muted-foreground">Inventory & Sales Management System</p>
                            </div>

                            {/* Receipt Meta */}
                            <div className="space-y-2 border-b p-6">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Receipt #:</span>
                                    <span className="font-medium">#{sale.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-medium">{new Date(sale.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time:</span>
                                    <span className="font-medium">
                                        {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Cashier:</span>
                                    <span className="font-medium">{sale.manager.name}</span>
                                </div>
                            </div>

                            {/* Items List */}
                            <div className="p-0">
                                <div className="divide-y">
                                    <div className="grid grid-cols-12 gap-2 bg-gray-50 px-6 py-3 text-sm font-medium dark:bg-gray-800">
                                        <div className="col-span-6">ITEM</div>
                                        <div className="col-span-2 text-right">QTY</div>
                                        <div className="col-span-2 text-right">PRICE</div>
                                        <div className="col-span-2 text-right">TOTAL</div>
                                    </div>
                                    {sale.sale_items.map((item) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 px-6 py-4">
                                            <div className="col-span-6">
                                                <h3 className="font-medium">{item.product_variant.product.name}</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    {getVariantInfo(item.product_variant)} • {item.product_variant.sku}
                                                </p>
                                            </div>
                                            <div className="col-span-2 text-right">{item.quantity}</div>
                                            <div className="col-span-2 text-right">{formatCurrency(item.unit_price)}</div>
                                            <div className="col-span-2 text-right font-medium">{formatCurrency(item.total_price)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t border-b p-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal:</span>
                                        <span>{formatCurrency(sale.total_amount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax:</span>
                                        <span>{formatCurrency(0)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>TOTAL:</span>
                                        <span>{formatCurrency(sale.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="border-b p-6">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Payment Method:</span>
                                    <span className="font-medium">Cash</span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-muted-foreground">Amount Tendered:</span>
                                    <span className="font-medium">{formatCurrency(sale.total_amount)}</span>
                                </div>
                                <div className="mt-1 flex justify-between">
                                    <span className="text-muted-foreground">Change:</span>
                                    <span className="font-medium">{formatCurrency(0)}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="space-y-1 p-6 text-center text-xs text-muted-foreground">
                                <p>Thank you for your purchase!</p>
                                <p>Items can be exchanged within 14 days with original receipt</p>
                                <p className="mt-4">Powered by Your POS System</p>
                                <p>
                                    {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Information (Non-printable) */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 print:hidden">
                    {/* Manager Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <User className="mr-2 h-5 w-5" />
                                    Manager Information
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <>
                                            <EyeOff className="mr-2 h-4 w-4" />
                                            Hide
                                        </>
                                    ) : (
                                        <>
                                            <Eye className="mr-2 h-4 w-4" />
                                            Show
                                        </>
                                    )}
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        {showPassword && (
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
            </div>
        </AppLayout>
    );
}
