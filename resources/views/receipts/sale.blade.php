<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt #{{ $sale->id }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
        }

        .receipt {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        .business-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }

        .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
            color: #666;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .items-table th,
        .items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #333;
        }

        .total-section {
            border-top: 2px solid #e9ecef;
            padding-top: 20px;
            text-align: right;
        }

        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
        }

        .total-amount {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>

<body>
    <div class="receipt">
        <div class="header">
            <div class="business-name">{{ config('app.name') }}</div>
            <div>Inventory & Sales Management</div>
        </div>

        <div class="receipt-info">
            <div>
                <strong>Receipt #:</strong> {{ $sale->id }}<br>
                <strong>Date:</strong> {{ $sale->created_at->format('M d, Y g:i A') }}
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
            <tbody>
                @foreach ($sale->saleItems as $item)
                    <tr>
                        <td>{{ $item->productVariant->product->name ?? 'Unknown Product' }}</td>
                        <td>
                            @if ($item->productVariant->color || $item->productVariant->size)
                                {{ $item->productVariant->color ?? '' }}{{ $item->productVariant->color && $item->productVariant->size ? ' - ' : '' }}{{ $item->productVariant->size ?? '' }}
                            @else
                                Standard
                            @endif
                        </td>
                        <td>{{ $item->productVariant->sku ?? 'N/A' }}</td>
                        <td>{{ $item->quantity }}</td>
                        <td>KSH {{ number_format($item->unit_price, 2) }}</td>
                        <td>KSH {{ number_format($item->total_price, 2) }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <div class="total-section">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>KSH {{ number_format($sale->total_amount, 2) }}</span>
            </div>
            <div class="total-row">
                <span>Tax:</span>
                <span>KSH 0.00</span>
            </div>
            <div class="total-row total-amount">
                <span>Total:</span>
                <span>KSH {{ number_format($sale->total_amount, 2) }}</span>
            </div>
        </div>

        <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Generated on {{ now()->format('M d, Y g:i A') }}</p>
        </div>
    </div>
</body>

</html>
