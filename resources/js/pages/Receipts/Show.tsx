import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';

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
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
        id: number;
        name: string;
        sku: string;
        brand?: string;
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


    // Debug logging to see the actual data structure
    console.log('Sale data received:', sale);
    console.log('Sale items:', sale?.sale_items);
    if (sale?.sale_items) {
        sale.sale_items.forEach((item, index) => {
            console.log(`Sale item ${index}:`, item);
            console.log(`Product for item ${index}:`, item.product);
        });
    }

    const handlePrintReceipt = () => {
        window.print();
    };

    const handleDownloadReceipt = async () => {
        try {
            console.log('Starting receipt download for sale:', sale.id);
            
            const response = await fetch(`/receipts/${sale.id}/download`, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                throw new Error(`Failed to download receipt: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            console.log('Blob created:', blob.size, 'bytes');

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Download the HTML file
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${sale.id}.html`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Clean up the URL object after a delay
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
            }, 1000);

            // Show success message
            alert(
                'Receipt downloaded successfully!\n\nTo convert to PDF:\n1. Open the HTML file in your browser\n2. Press Ctrl+P (or Cmd+P on Mac)\n3. Choose "Save as PDF" in the print dialog\n4. Set margins to "Minimum" for best fit'
            );
        } catch (error) {
            console.error('Failed to download receipt:', error);
            alert(`Failed to download receipt: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Receipt #${sale.id}`} />
            <style>{`
                @media print {
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                    .print\\:border-0 {
                        border: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    body {
                        background: white !important;
                        color: black !important;
                        font-size: 12px !important;
                    }
                    .receipt-header {
                        text-align: center !important;
                        border-bottom: 2px solid #000 !important;
                        padding-bottom: 15px !important;
                        margin-bottom: 20px !important;
                    }
                    .receipt-header h2 {
                        font-size: 24px !important;
                        font-weight: bold !important;
                        color: #000 !important;
                        margin: 0 !important;
                    }
                    .receipt-header p {
                        font-size: 14px !important;
                        color: #000 !important;
                        margin: 5px 0 !important;
                    }
                    .receipt-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin: 20px 0 !important;
                    }
                    .receipt-table th,
                    .receipt-table td {
                        border: 1px solid #000 !important;
                        padding: 8px 6px !important;
                        text-align: left !important;
                        vertical-align: top !important;
                        font-size: 11px !important;
                    }
                    .receipt-table th {
                        background-color: #f0f0f0 !important;
                        font-weight: bold !important;
                        text-align: center !important;
                    }
                    .receipt-table .text-right {
                        text-align: right !important;
                    }
                    .receipt-table .text-center {
                        text-align: center !important;
                    }
                    .receipt-meta {
                        margin: 15px 0 !important;
                        font-size: 12px !important;
                    }
                    .receipt-meta div {
                        display: flex !important;
                        justify-content: space-between !important;
                        margin: 5px 0 !important;
                    }
                    .receipt-total {
                        text-align: right !important;
                        font-weight: bold !important;
                        font-size: 14px !important;
                        margin: 20px 0 !important;
                        border-top: 2px solid #000 !important;
                        padding-top: 10px !important;
                    }
                }
            `}</style>
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
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-bold sm:text-2xl">Receipt #{sale.id}</h1>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            {new Date(sale.created_at).toLocaleDateString()} at {new Date(sale.created_at).toLocaleTimeString()}
                        </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center print:hidden">
                        <Link href="/sales">
                            <Button variant="outline" className="w-full sm:w-auto">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Back to Sales</span>
                                <span className="sm:hidden">Back</span>
                            </Button>
                        </Link>
                        <Button onClick={handlePrintReceipt} variant="outline" className="w-full sm:w-auto">
                            <Printer className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Print Receipt</span>
                            <span className="sm:hidden">Print</span>
                        </Button>
                        <Button onClick={handleDownloadReceipt} variant="outline" className="w-full sm:w-auto">
                            <Download className="mr-2 h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
                            <span className="sm:hidden">Download</span>
                        </Button>
                    </div>
                </div>

                {/* Receipt Container */}
                <div className="print:p-0">
                    <Card className="print:border-0 print:shadow-none">
                        <CardContent className="p-0 print:p-0">
                            {/* Receipt Header */}
                            <div className="receipt-header border-b bg-gray-50 p-4 text-center sm:p-6 dark:bg-gray-800">
                                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{appName}</h2>
                                <p className="text-sm text-muted-foreground sm:text-base">Inventory & Sales Management System</p>
                            </div>

                            {/* Receipt Meta */}
                            <div className="space-y-2 border-b p-4 sm:p-6">
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-muted-foreground">Receipt #:</span>
                                    <span className="font-medium">#{sale.id}</span>
                                </div>
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-muted-foreground">Date:</span>
                                    <span className="font-medium">{new Date(sale.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-sm sm:text-base">
                                    <span className="text-muted-foreground">Time:</span>
                                    <span className="font-medium">
                                        {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                            </div>

                            {/* Items List */}
                            <div className="p-0">
                                <table className="receipt-table w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800">
                                            <th className="px-4 py-3 text-left text-sm font-medium">ITEM</th>
                                            <th className="px-4 py-3 text-center text-sm font-medium">QTY</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">PRICE</th>
                                            <th className="px-4 py-3 text-right text-sm font-medium">TOTAL</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sale.sale_items.map((item) => (
                                            <tr key={item.id} className="border-b">
                                                <td className="px-4 py-3">
                                                    <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {item.product?.sku || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {formatCurrency(item.unit_price)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {formatCurrency(item.total_price)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Totals */}
                            <div className="receipt-total border-t border-b p-4 sm:p-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-base font-bold sm:text-lg">
                                        <span>TOTAL:</span>
                                        <span>{formatCurrency(sale.total_amount)}</span>
                                    </div>
                                </div>
                            </div>



                            {/* Footer */}
                            <div className="space-y-1 p-4 text-center text-xs text-muted-foreground sm:p-6">
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

                
            </div>
        </AppLayout>
    );
}
