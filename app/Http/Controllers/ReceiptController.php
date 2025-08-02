<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ReceiptController extends Controller
{
    /**
     * Display the receipt for a specific sale.
     */
    public function show(Sale $sale): View
    {
        // Load the sale with related data
        $sale->load(['manager', 'saleItems.product']);

        return view('receipts.sale', compact('sale'));
    }
}
