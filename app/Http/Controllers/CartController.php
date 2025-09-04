<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    /**
     * Display the cart.
     */
    public function index(): Response
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $cart = session('cart', []);
        $products = Product::whereIn('id', array_keys($cart))->get();

        $cartItems = collect($cart)->map(function ($item, $productId) use ($products) {
            $product = $products->find($productId);
            if (!$product) {
                return null;
            }

            return [
                'id' => $product->id,
                'name' => $product->name,
                'category' => $product->category,
                'brand' => $product->brand,
                'image_url' => $product->image_url,
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['quantity'] * $item['unit_price'],
                'available_stock' => $product->quantity,
                'sku' => $product->sku,
            ];
        })->filter()->values();

        $totalAmount = $cartItems->sum('total_price');
        $totalItems = $cartItems->sum('quantity');

        return Inertia::render('Cart/CartPage', [
            'cartItems' => $cartItems,
            'totalAmount' => $totalAmount,
            'totalItems' => $totalItems,
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
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $product = Product::findOrFail($request->product_id);

        // Check stock availability
        if ($product->quantity < $request->quantity) {
            return back()->with('error', "Not enough stock available. Only {$product->quantity} units in stock.");
        }

        $cart = session('cart', []);
        $cart[$request->product_id] = [
            'quantity' => $request->quantity,
            'unit_price' => $request->unit_price,
        ];

        session(['cart' => $cart]);

        return back()->with('success', 'Item added to cart successfully!');
    }

    /**
     * Update cart item.
     */
    public function updateItem(Request $request, $productId)
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'quantity' => 'required|integer|min:1',
            'unit_price' => 'required|numeric|min:0',
        ]);

        $product = Product::findOrFail($productId);

        // Check stock availability
        if ($product->quantity < $request->quantity) {
            return back()->with('error', "Not enough stock available. Only {$product->quantity} units in stock.");
        }

        $cart = session('cart', []);
        $cart[$productId] = [
            'quantity' => $request->quantity,
            'unit_price' => $request->unit_price,
        ];

        session(['cart' => $cart]);

        return back()->with('success', 'Cart item updated successfully!');
    }

    /**
     * Remove item from cart.
     */
    public function removeItem($productId)
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $cart = session('cart', []);
        unset($cart[$productId]);
        session(['cart' => $cart]);

        return back()->with('success', 'Item removed from cart successfully!');
    }

    /**
     * Sync cart from frontend to backend session.
     */
    public function sync(Request $request)
    {
        // Check if user is a manager
        if (!auth()->user() || !auth()->user()->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $request->validate([
            'cart' => 'required|array',
            'cart.*.product_id' => 'required|exists:products,id',
            'cart.*.quantity' => 'required|integer|min:1',
            'cart.*.unit_price' => 'required|numeric|min:0',
        ]);

        $cart = [];
        foreach ($request->cart as $item) {
            $cart[$item['product_id']] = [
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
            ];
        }

        session(['cart' => $cart]);

        return response()->json(['message' => 'Cart synced successfully']);
    }

    /**
     * Checkout and create sale.
     */
    public function checkout(Request $request)
    {
        // Check if user is a manager
        $user = auth()->user();
        if (!$user || !$user->isManager()) {
            abort(403, 'Unauthorized action.');
        }

        $cart = session('cart', []);
        if (empty($cart)) {
            return back()->with('error', 'Cart is empty.');
        }

        \Log::info('Starting checkout process', [
            'user_id' => $user->id,
            'cart_items' => $cart,
            'cart_count' => count($cart)
        ]);

        try {
            DB::beginTransaction();

            \Log::info('Creating sale record');

            // Create the sale with minimal required information
            $sale = Sale::create([
                'manager_id' => $user->id,
                'total_amount' => 0, // Will be calculated
            ]);

            \Log::info('Sale created successfully', [
                'sale_id' => $sale->id,
                'sale_data' => $sale->toArray(),
                'sale_exists' => Sale::find($sale->id) ? 'YES' : 'NO'
            ]);

            $totalAmount = 0;
            $productsToCheck = [];

            // Create sale items and update inventory
            foreach ($cart as $productId => $item) {
                \Log::info('Processing cart item', [
                    'product_id' => $productId,
                    'item' => $item
                ]);

                $product = Product::findOrFail($productId);
                
                // Check stock again
                if ($product->quantity < $item['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}. Available: {$product->quantity}");
                }

                \Log::info('Creating sale item', [
                    'sale_id' => $sale->id,
                    'product_id' => $productId,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price']
                ]);

                // Create sale item
                $saleItem = SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $productId,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total_price' => $item['quantity'] * $item['unit_price'],
                ]);

                \Log::info('Sale item created', [
                    'sale_item_id' => $saleItem->id
                ]);

                // Update product inventory
                $product->decrement('quantity', $item['quantity']);

                \Log::info('Product inventory updated', [
                    'product_id' => $productId,
                    'new_quantity' => $product->fresh()->quantity
                ]);

                // Check if product needs low stock or out of stock notifications
                $productsToCheck[] = $product;

                $totalAmount += $item['quantity'] * $item['unit_price'];
            }

            \Log::info('Updating sale total', [
                'sale_id' => $sale->id,
                'total_amount' => $totalAmount
            ]);

            // Update sale total
            $sale->update(['total_amount' => $totalAmount]);

            // Clear cart
            session()->forget('cart');

            \Log::info('Cart cleared, creating notifications');

            // Create notifications for inventory alerts
            $notificationService = new \App\Services\NotificationService();
            
            foreach ($productsToCheck as $product) {
                // Check if product is now out of stock
                if ($product->quantity === 0) {
                    $notificationService->createOutOfStockNotification($product);
                }
                // Check if product is now low stock
                elseif ($product->quantity <= $product->low_stock_threshold) {
                    $notificationService->createLowStockNotification($product);
                }
            }

            // Sale notification will be created automatically via SaleCreated event

            \Log::info('Checkout completed successfully, committing transaction');

            DB::commit();

            \Log::info('Transaction committed, verifying sale exists', [
                'sale_id' => $sale->id,
                'sale_exists_after_commit' => Sale::find($sale->id) ? 'YES' : 'NO',
                'sale_data_after_commit' => Sale::find($sale->id)?->toArray()
            ]);

            // Dispatch SaleCreated event after transaction is committed
            \Log::info('Dispatching SaleCreated event', [
                'sale_id' => $sale->id
            ]);
            event(new \App\Events\SaleCreated($sale));

            \Log::info('Transaction committed, redirecting to receipt', [
                'sale_id' => $sale->id
            ]);

            return redirect()->route('receipts.show', $sale->id)
                ->with('success', 'Sale completed successfully!');

        } catch (\Exception $e) {
            \Log::error('Checkout failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id
            ]);

            DB::rollBack();
            return back()->with('error', 'Checkout failed: ' . $e->getMessage());
        }
    }
}
