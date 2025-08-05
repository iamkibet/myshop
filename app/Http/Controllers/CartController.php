<?php

namespace App\Http\Controllers;

use App\Events\SaleCreated;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    /**
     * Display the cart page.
     */
    public function index(): Response
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $cart = session('cart', []);
        $variants = ProductVariant::with('product')->whereIn('id', array_keys($cart))->get();

        $cartItems = collect($cart)->map(function ($item, $variantId) use ($variants) {
            $variant = $variants->find($variantId);
            if (!$variant) {
                return null;
            }

            return [
                'variant_id' => (int) $variantId,
                'product_variant' => [
                    'id' => $variant->id,
                    'product' => [
                        'id' => $variant->product->id,
                        'name' => $variant->product->name,
                        'sku' => $variant->sku,
                    ],
                    'color' => $variant->color,
                    'size' => $variant->size,
                    'quantity' => $variant->quantity,
                    'selling_price' => (float) $variant->selling_price,
                    'discount_price' => $variant->discount_price ? (float) $variant->discount_price : null,
                ],
                'quantity' => (int) $item['quantity'],
                'unit_price' => (float) $item['unit_price'],
                'total_price' => (float) ($item['quantity'] * $item['unit_price']),
            ];
        })->filter()->values()->toArray();

        return Inertia::render('Cart/CartPage', [
            'cartItems' => $cartItems,
            'total' => collect($cartItems)->sum('total_price'),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Add item to cart.
     */
    public function addItem(Request $request)
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'variant_id' => 'required|exists:product_variants,id',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $variant = ProductVariant::with('product')->findOrFail($request->variant_id);

        // Check stock availability
        if ($variant->quantity < $request->quantity) {
            return back()->with('error', "Not enough stock available. Only {$variant->quantity} units in stock.");
        }

        $cart = session('cart', []);
        $cart[$request->variant_id] = [
            'quantity' => $request->quantity,
            'unit_price' => $request->unit_price,
        ];

        session(['cart' => $cart]);

        return back()->with('success', 'Item added to cart successfully!');
    }

    /**
     * Update cart item.
     */
    public function updateItem(Request $request, $variantId)
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $variant = ProductVariant::findOrFail($variantId);

        // Check stock availability
        if ($variant->quantity < $request->quantity) {
            return back()->with('error', "Not enough stock available. Only {$variant->quantity} units in stock.");
        }

        $cart = session('cart', []);
        $cart[$variantId] = [
            'quantity' => $request->quantity,
            'unit_price' => $request->unit_price,
        ];

        session(['cart' => $cart]);

        return back()->with('success', 'Cart item updated successfully!');
    }

    /**
     * Remove item from cart.
     */
    public function removeItem($variantId)
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $cart = session('cart', []);
        unset($cart[$variantId]);
        session(['cart' => $cart]);

        return back()->with('success', 'Item removed from cart successfully!');
    }

    /**
     * Checkout the cart.
     */
    public function checkout(Request $request)
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $cart = session('cart', []);
        if (empty($cart)) {
            return back()->with('error', 'Cart is empty.');
        }

        try {
            DB::beginTransaction();

            // Validate stock availability
            foreach ($cart as $variantId => $item) {
                $variant = ProductVariant::findOrFail($variantId);
                if ($item['quantity'] > $variant->quantity) {
                    throw new \Exception("Insufficient stock for variant: {$variant->sku}");
                }
            }

            // Create sale
            $sale = Sale::create([
                'manager_id' => auth()->id(),
                'total_amount' => collect($cart)->sum(function ($item) {
                    return $item['quantity'] * $item['unit_price'];
                }),
            ]);

            // Create sale items and update stock
            foreach ($cart as $variantId => $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_variant_id' => $variantId,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);

                // Update variant stock
                $variant = ProductVariant::find($variantId);
                $variant->decrement('quantity', $item['quantity']);

                // Check if product is now low stock or out of stock
                $notificationService = new \App\Services\NotificationService();
                if ($variant->quantity === 0) {
                    $notificationService->createOutOfStockNotification($variant);
                } elseif ($variant->quantity <= 5) {
                    $notificationService->createLowStockNotification($variant);
                }
            }

            // Clear cart
            session()->forget('cart');

            // Generate receipt
            $receiptPath = $this->generateReceipt($sale);

            // Fire event
            event(new SaleCreated($sale));

            // Create notification for the sale
            $notificationService = new \App\Services\NotificationService();
            $notificationService->createSaleNotification($sale);

            DB::commit();

            // Redirect to the receipt page
            return redirect()->route('receipts.show', $sale)->with('success', 'Sale completed successfully!');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Generate PDF receipt for the sale.
     */
    private function generateReceipt(Sale $sale): string
    {
        $receiptPath = "receipts/{$sale->id}.pdf";

        // Load the sale with all necessary relationships
        $sale->load([
            'manager',
            'saleItems.productVariant.product'
        ]);

        // For now, we'll create a simple text receipt
        // In a real implementation, you'd use DOMPDF or similar
        $receiptContent = view('receipts.sale', compact('sale'))->render();

        // Store the receipt (in a real app, you'd generate PDF)
        Storage::put($receiptPath, $receiptContent);

        return $receiptPath;
    }
}
