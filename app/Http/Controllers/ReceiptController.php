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
            $sales = Sale::with(['manager', 'saleItems.product'])
                ->latest()
                ->paginate(20);
        } else {
            // Managers can only see their own receipts
            $sales = Sale::with(['manager', 'saleItems.product'])
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
            'saleItems.product'
        ]);

        \Log::info('Receipt data loaded', [
            'sale_id' => $sale->id,
            'sale_items_count' => $sale->saleItems->count(),
            'sale_items_with_products' => $sale->saleItems->map(function($item) {
                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_loaded' => $item->product ? 'YES' : 'NO',
                    'product_name' => $item->product?->name ?? 'NULL'
                ];
            })->toArray()
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
            'saleItems.product'
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
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt #' . $sale->id . ' - ' . config('app.name') . '</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                @page {
                    margin: 15mm;
                    size: A4;
                }
                
                @media print {
                    body { 
                        margin: 0; 
                        padding: 0;
                        background: white;
                        font-size: 12px;
                    }
                    .no-print { 
                        display: none !important; 
                    }
                    .page-break { 
                        page-break-before: always; 
                    }
                    .receipt-container {
                        box-shadow: none !important;
                        border: none !important;
                        padding: 0;
                        margin: 0;
                        max-width: none;
                    }
                    .header h1 {
                        font-size: 24px !important;
                        color: #000 !important;
                    }
                    .header .subtitle {
                        font-size: 14px !important;
                        color: #000 !important;
                    }
                    .header .receipt-number {
                        font-size: 16px !important;
                        color: #000 !important;
                    }
                    .items-table {
                        font-size: 11px !important;
                    }
                    .items-table th, .items-table td {
                        padding: 8px 6px !important;
                    }
                    .total-section {
                        background: #f5f5f5 !important;
                        border: 1px solid #ccc !important;
                    }
                    .manager-info {
                        background: #f0f0f0 !important;
                        border: 1px solid #ccc !important;
                    }
                    .footer {
                        font-size: 10px !important;
                        color: #000 !important;
                    }
                }
                
                body { 
                    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; 
                    margin: 0; 
                    padding: 20px;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #333;
                    background: #f8f9fa;
                }
                
                .receipt-container {
                    max-width: 800px;
                    margin: 0 auto;
                    background: white;
                    padding: 40px;
                    border-radius: 8px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
                }
                
                .header { 
                    text-align: center; 
                    border-bottom: 3px solid #2563eb; 
                    padding-bottom: 25px; 
                    margin-bottom: 30px; 
                }
                
                .header h1 {
                    margin: 0;
                    font-size: 32px;
                    font-weight: 700;
                    color: #1e40af;
                    margin-bottom: 8px;
                }
                
                .header .subtitle {
                    font-size: 16px;
                    color: #6b7280;
                    margin-bottom: 5px;
                }
                
                .header .receipt-number {
                    font-size: 18px;
                    font-weight: 600;
                    color: #374151;
                }
                
                .receipt-info { 
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f8fafc;
                    border-radius: 8px;
                    border: 1px solid #e2e8f0;
                }
                
                .receipt-info .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .receipt-info .label {
                    font-weight: 600;
                    color: #4b5563;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .receipt-info .value {
                    font-size: 16px;
                    color: #111827;
                    font-weight: 500;
                }
                
                .items-table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 30px; 
                    font-size: 14px;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
                
                .items-table th, .items-table td { 
                    padding: 16px 12px; 
                    text-align: left; 
                    vertical-align: top;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .items-table th { 
                    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                    color: white;
                    font-weight: 600;
                    font-size: 13px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .items-table tbody tr:hover {
                    background-color: #f9fafb;
                }
                
                .items-table tbody tr:last-child td {
                    border-bottom: none;
                }
                
                .product-name {
                    font-weight: 600;
                    color: #111827;
                    margin-bottom: 4px;
                }
                
                .product-details {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .quantity, .unit-price, .total-price {
                    text-align: right;
                    font-weight: 500;
                }
                
                .total-section { 
                    background: #f8fafc;
                    padding: 25px;
                    border-radius: 8px;
                    border: 2px solid #e5e7eb;
                    margin-bottom: 30px;
                }
                
                .total-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    font-size: 16px;
                }
                
                .total-row:last-child {
                    margin-bottom: 0;
                    padding-top: 12px;
                    border-top: 2px solid #d1d5db;
                    font-size: 20px;
                    font-weight: 700;
                    color: #1e40af;
                }
                
                .total-label {
                    font-weight: 600;
                    color: #374151;
                }
                
                .total-value {
                    font-weight: 600;
                    color: #111827;
                }
                
                .manager-info {
                    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 25px;
                    border-left: 4px solid #0ea5e9;
                }
                
                .manager-info h3 {
                    margin: 0 0 10px 0;
                    font-size: 16px;
                    color: #0c4a6e;
                    font-weight: 600;
                }
                
                .manager-info p {
                    margin: 5px 0;
                    font-size: 14px;
                    color: #0c4a6e;
                }
                
                .footer { 
                    text-align: center; 
                    margin-top: 40px; 
                    padding-top: 25px;
                    border-top: 2px solid #e5e7eb;
                    color: #6b7280; 
                    font-size: 13px;
                }
                
                .footer p {
                    margin: 8px 0;
                }
                
                .footer .thank-you {
                    font-size: 16px;
                    font-weight: 600;
                    color: #374151;
                    margin-bottom: 15px;
                }
                
            </style>
        </head>
        <body>
            <div class="receipt-container">
                <div class="header">
                    <h1>' . (config('app.name') ?: 'MyShop') . '</h1>
                    <div class="subtitle">Official Sales Receipt</div>
                    <div class="receipt-number">Receipt #' . $sale->id . '</div>
                </div>
                
                <div class="receipt-info">
                    <div class="info-item">
                        <div class="label">Date</div>
                        <div class="value">' . $sale->created_at->format('F j, Y') . '</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Time</div>
                        <div class="value">' . $sale->created_at->format('g:i A') . '</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Receipt ID</div>
                        <div class="value">#' . $sale->id . '</div>
                    </div>
                    <div class="info-item">
                        <div class="label">Items</div>
                        <div class="value">' . $sale->saleItems->count() . ' item(s)</div>
                    </div>
                </div>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th style="width: 40%;">Product Details</th>
                            <th style="width: 15%;">SKU</th>
                            <th style="width: 10%;">Qty</th>
                            <th style="width: 17.5%;">Unit Price</th>
                            <th style="width: 17.5%;">Total</th>
                        </tr>
                    </thead>
                    <tbody>';

        foreach ($sale->saleItems as $item) {
            $product = $item->product ?? null;
            
            $productName = $product->name ?? 'Unknown Product';
            $sku = $product->sku ?? 'N/A';
            $variantInfo = '';
            
            // Add product details if available
            $productDetails = [];
            if ($product && $product->brand) $productDetails[] = 'Brand: ' . $product->brand;
            if ($product && $product->category) $productDetails[] = 'Category: ' . $product->category;
            if (!empty($productDetails)) {
                $variantInfo = '<div class="product-details">' . implode(', ', $productDetails) . '</div>';
            }
            
            $html .= '
                <tr>
                    <td>
                        <div class="product-name">' . htmlspecialchars($productName) . '</div>
                        ' . $variantInfo . '
                    </td>
                    <td>' . htmlspecialchars($sku) . '</td>
                    <td class="quantity">' . $item->quantity . '</td>
                    <td class="unit-price">KSH ' . number_format($item->unit_price, 2) . '</td>
                    <td class="total-price">KSH ' . number_format($item->total_price, 2) . '</td>
                </tr>';
        }

        $html .= '
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div class="total-row">
                        <span class="total-label">Subtotal:</span>
                        <span class="total-value">KSH ' . number_format($sale->total_amount, 2) . '</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Tax (0%):</span>
                        <span class="total-value">KSH 0.00</span>
                    </div>
                    <div class="total-row">
                        <span class="total-label">Total Amount:</span>
                        <span class="total-value">KSH ' . number_format($sale->total_amount, 2) . '</span>
                    </div>
                </div>
                
                <div class="manager-info">
                    <h3>Transaction Details</h3>
                    <p><strong>Processed by:</strong> ' . htmlspecialchars($sale->manager->name ?? 'Unknown Manager') . '</p>
                    <p><strong>Manager ID:</strong> #' . ($sale->manager->id ?? 'N/A') . '</p>
                    <p><strong>Transaction Date:</strong> ' . $sale->created_at->format('F j, Y \a\t g:i A') . '</p>
                </div>
                
                <div class="footer">
                    <div class="thank-you">Thank you for your purchase!</div>
                    <p>This is an official receipt from <strong>' . (config('app.name') ?: 'MyShop') . '</strong></p>
                    <p>Generated on ' . now()->format('F j, Y \a\t g:i A') . '</p>
                    <p>For any queries or support, please contact our team</p>
                    <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
                        Receipt ID: ' . $sale->id . ' | Generated: ' . now()->format('Y-m-d H:i:s') . '
                    </p>
                </div>
            </div>
        </body>
        </html>';

        return $html;
    }
}
