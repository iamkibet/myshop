<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class ReceiptController extends Controller
{
    /**
     * Display a list of all receipts for the user
     */
    public function index()
    {
        $user = auth()->user();
        
        if ($user->isAdmin()) {
            // Admins can see all receipts
            $sales = Sale::with(['manager', 'saleItems.productVariant.product'])
                ->latest()
                ->paginate(20);
        } else {
            // Managers can only see their own receipts
            $sales = Sale::with(['manager', 'saleItems.productVariant.product'])
                ->where('manager_id', $user->id)
                ->latest()
                ->paginate(20);
        }

        return Inertia::render('Receipts/Index', [
            'sales' => $sales,
        ]);
    }

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

        // Generate receipt content
        $receiptContent = $this->generateReceiptContent($sale);

        // Return as HTML that can be saved as PDF
        return response($receiptContent)
            ->header('Content-Type', 'text/html')
            ->header('Content-Disposition', 'attachment; filename="receipt-' . $sale->id . '.html"')
            ->header('Cache-Control', 'public, max-age=0')
            ->header('Pragma', 'public')
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
            <title>Receipt #' . $sale->id . ' - ' . config('app.name') . '</title>
            <style>
                @page {
                    margin: 15mm;
                    size: A4;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                    .page-break { page-break-before: always; }
                }
                body { 
                    font-family: "Helvetica Neue", Arial, sans-serif; 
                    margin: 0; 
                    padding: 0;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                    background: white;
                }
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #000; 
                    padding-bottom: 15px; 
                    margin-bottom: 20px; 
                }
                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: bold;
                }
                .header p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .receipt-info { 
                    margin-bottom: 20px; 
                    display: flex;
                    justify-content: space-between;
                    flex-wrap: wrap;
                }
                .receipt-info div {
                    margin-bottom: 10px;
                }
                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px; 
                    font-size: 11px;
                }
                .items-table th, .items-table td { 
                    border: 1px solid #ddd; 
                    padding: 8px; 
                    text-align: left; 
                    vertical-align: top;
                }
                .items-table th { 
                    background-color: #f8f9fa; 
                    font-weight: bold;
                    font-size: 10px;
                }
                .items-table td {
                    font-size: 10px;
                }
                .total { 
                    text-align: right; 
                    font-weight: bold; 
                    font-size: 16px; 
                    margin-top: 20px;
                    border-top: 2px solid #000;
                    padding-top: 15px;
                }
                .footer { 
                    margin-top: 30px; 
                    text-align: center; 
                    font-size: 10px; 
                    color: #666; 
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }
                .manager-info {
                    background-color: #f8f9fa;
                    padding: 12px;
                    border-radius: 5px;
                    margin-bottom: 15px;
                    border: 1px solid #e9ecef;
                }
                .company-info {
                    margin-bottom: 15px;
                }
                .receipt-meta {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .receipt-meta div {
                    display: flex;
                    justify-content: space-between;
                }
                .receipt-meta span:first-child {
                    font-weight: bold;
                }
                .print-instructions {
                    background: #f0f8ff;
                    border: 1px solid #b3d9ff;
                    padding: 10px;
                    margin: 20px 0;
                    border-radius: 5px;
                    font-size: 11px;
                }
                .print-instructions h3 {
                    margin: 0 0 5px 0;
                    font-size: 12px;
                }
                .print-instructions ul {
                    margin: 5px 0;
                    padding-left: 20px;
                }
            </style>
        </head>
        <body>
            <div class="print-instructions no-print">
                <h3>📄 Print Instructions:</h3>
                <ul>
                    <li>Press Ctrl+P (Windows) or Cmd+P (Mac) to print</li>
                    <li>Select "Save as PDF" in the destination options</li>
                    <li>Choose "A4" paper size and "Portrait" orientation</li>
                    <li>Disable headers and footers for clean output</li>
                </ul>
            </div>
            
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">' . config('app.name') . '</h1>
                <p style="margin: 5px 0; font-size: 14px;">Official Receipt</p>
                <p style="margin: 5px 0; font-size: 12px;">Receipt #' . $sale->id . '</p>
            </div>
            
            <div class="company-info">
                <p style="margin: 5px 0;"><strong>' . config('app.name') . ' Store</strong></p>
                <p style="margin: 5px 0;">Inventory & Sales Management System</p>
            </div>
            
            <div class="receipt-meta">
                <div>
                    <span>Date:</span>
                    <span>' . $sale->created_at->format('F j, Y') . '</span>
                </div>
                <div>
                    <span>Time:</span>
                    <span>' . $sale->created_at->format('g:i A') . '</span>
                </div>
                <div>
                    <span>Receipt ID:</span>
                    <span>' . $sale->id . '</span>
                </div>
                <div>
                    <span>Payment Method:</span>
                    <span>Cash</span>
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
                <p style="margin: 5px 0;">This is an official receipt from ' . config('app.name') . '</p>
                <p style="margin: 5px 0;">Generated on ' . now()->format('F j, Y g:i A') . '</p>
                <p style="margin: 5px 0;">For any queries, please contact our support team</p>
            </div>
        </body>
        </html>';

        return $html;
    }
}
