<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    /**
     * Display the receipt for a sale
     */
    public function show(Sale $sale)
    {
        $user = auth()->user(); 

        // Check if user can view this receipt
        if (!$user->isAdmin() && $sale->manager_id !== $user->id) {
            abort(403, 'Unauthorized access.');
        }

        // Load all necessary relationships
        $sale->load([
            'manager',
            'saleItems.productVariant.product'
        ]);

        return Inertia::render('Receipts/Show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Download the receipt as PDF
     */
    public function download(Sale $sale)
    {
        $user = auth()->user();

        // Check if user can download this receipt
        if (!$user->isAdmin() && $sale->manager_id !== $user->id) {
            abort(403, 'Unauthorized access.');
        }

        // Load all necessary relationships
        $sale->load([
            'manager',
            'saleItems.productVariant.product'
        ]);

        // Generate PDF content
        $receiptContent = $this->generateReceiptContent($sale);

        // Return as PDF with proper headers
        return response($receiptContent)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'attachment; filename="receipt-' . $sale->id . '.pdf"')
            ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
            ->header('Pragma', 'no-cache')
            ->header('Expires', '0');
    }

    /**
     * Generate receipt content
     */
    private function generateReceiptContent(Sale $sale): string
    {
        $html = '
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Receipt #' . $sale->id . '</title>
            <style>
                @page {
                    margin: 20mm;
                    size: A4;
                }
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 0; 
                    padding: 0;
                    font-size: 12px;
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #000; 
                    padding-bottom: 10px; 
                    margin-bottom: 20px; 
                }
                .receipt-info { 
                    margin-bottom: 20px; 
                    display: flex;
                    justify-content: space-between;
                }
                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px; 
                    font-size: 10px;
                }
                .items-table th, .items-table td { 
                    border: 1px solid #ddd; 
                    padding: 6px; 
                    text-align: left; 
                }
                .items-table th { 
                    background-color: #f2f2f2; 
                    font-weight: bold;
                }
                .total { 
                    text-align: right; 
                    font-weight: bold; 
                    font-size: 14px; 
                    margin-top: 20px;
                    border-top: 2px solid #000;
                    padding-top: 10px;
                }
                .footer { 
                    margin-top: 30px; 
                    text-align: center; 
                    font-size: 10px; 
                    color: #666; 
                }
                .manager-info {
                    background-color: #f8f9fa;
                    padding: 10px;
                    border-radius: 5px;
                    margin-bottom: 15px;
                }
                .company-info {
                    margin-bottom: 15px;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">MyShop</h1>
                <p style="margin: 5px 0; font-size: 14px;">Official Receipt</p>
                <p style="margin: 5px 0; font-size: 12px;">Receipt #' . $sale->id . '</p>
            </div>
            
            <div class="company-info">
                <p style="margin: 5px 0;"><strong>MyShop Store</strong></p>
                <p style="margin: 5px 0;">123 Business Street</p>
                <p style="margin: 5px 0;">Nairobi, Kenya</p>
                <p style="margin: 5px 0;">Phone: +254 700 000 000</p>
            </div>
            
            <div class="receipt-info">
                <div>
                    <p style="margin: 5px 0;"><strong>Date:</strong> ' . $sale->created_at->format('F j, Y g:i A') . '</p>
                    <p style="margin: 5px 0;"><strong>Receipt ID:</strong> ' . $sale->id . '</p>
                </div>
                <div>
                    <p style="margin: 5px 0;"><strong>Transaction Time:</strong> ' . $sale->created_at->format('H:i:s') . '</p>
                    <p style="margin: 5px 0;"><strong>Payment Method:</strong> Cash</p>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>SKU</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>';

        foreach ($sale->saleItems as $item) {
            $variantInfo = '';
            if ($item->productVariant->color || $item->productVariant->size) {
                $variantInfo = ($item->productVariant->color ?? '') .
                    ($item->productVariant->color && $item->productVariant->size ? ' - ' : '') .
                    ($item->productVariant->size ?? '');
            } else {
                $variantInfo = 'Standard';
            }

            $html .= '
                <tr>
                    <td>' . ($item->productVariant->product->name ?? 'Unknown Product') . '</td>
                    <td>' . $variantInfo . '</td>
                    <td>' . ($item->productVariant->sku ?? 'N/A') . '</td>
                    <td>' . $item->quantity . '</td>
                    <td>KSH ' . number_format($item->unit_price, 2) . '</td>
                    <td>KSH ' . number_format($item->total_price, 2) . '</td>
                </tr>';
        }

        $html .= '
                </tbody>
            </table>
            
            <div class="total">
                <p style="margin: 5px 0; font-size: 16px;"><strong>Total Amount: KSH ' . number_format($sale->total_amount, 2) . '</strong></p>
            </div>
            
            <div class="manager-info">
                <p style="margin: 5px 0;"><strong>Processed by:</strong> ' . ($sale->manager->name ?? 'Unknown') . '</p>
                <p style="margin: 5px 0;"><strong>Manager ID:</strong> ' . ($sale->manager->id ?? 'N/A') . '</p>
            </div>
            
            <div class="footer">
                <p style="margin: 5px 0;">Thank you for your purchase!</p>
                <p style="margin: 5px 0;">This is an official receipt from MyShop</p>
                <p style="margin: 5px 0;">Generated on ' . now()->format('F j, Y g:i A') . '</p>
                <p style="margin: 5px 0;">For any queries, please contact our support team</p>
            </div>
        </body>
        </html>';

        return $html;
    }
}
