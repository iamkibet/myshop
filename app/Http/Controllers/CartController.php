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
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Cart is empty.',
                    'error_type' => 'empty_cart'
                ], 422);
            }
            return back()->with('error', 'Cart is empty.');
        }

        // Pre-validate stock availability before starting transaction
        $stockValidationErrors = [];
        foreach ($cart as $productId => $item) {
            $product = Product::find($productId);
            if (!$product) {
                $stockValidationErrors[] = "Product with ID {$productId} not found.";
                continue;
            }
            
            if ($product->quantity < $item['quantity']) {
                $stockValidationErrors[] = "Insufficient stock for {$product->name}. Available: {$product->quantity}, Requested: {$item['quantity']}";
            }
        }

        if (!empty($stockValidationErrors)) {
            \Log::warning('Stock validation failed before checkout', [
                'user_id' => $user->id,
                'errors' => $stockValidationErrors,
                'cart' => $cart
            ]);

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Stock validation failed',
                    'errors' => $stockValidationErrors,
                    'error_type' => 'stock_validation_error'
                ], 422);
            }

            return back()->with('error', 'Stock validation failed: ' . implode(', ', $stockValidationErrors));
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

            // Verify sale was actually created and has items
            \Log::info('Verifying sale after commit', [
                'sale_id' => $sale->id
            ]);
            
            $sale = Sale::with('saleItems')->find($sale->id);
            if (!$sale) {
                \Log::error('Sale verification failed - sale not found after commit', [
                    'sale_id' => $sale->id ?? 'unknown'
                ]);
                throw new \Exception('Sale verification failed after commit - sale not found');
            }
            
            if ($sale->saleItems->isEmpty()) {
                \Log::error('Sale verification failed - no sale items found after commit', [
                    'sale_id' => $sale->id,
                    'sale_items_count' => $sale->saleItems->count()
                ]);
                throw new \Exception('Sale verification failed after commit - sale has no items');
            }
            
            \Log::info('Sale verification successful', [
                'sale_id' => $sale->id,
                'items_count' => $sale->saleItems->count(),
                'total_amount' => $sale->total_amount
            ]);

            \Log::info('Transaction committed, sale verified successfully', [
                'sale_id' => $sale->id,
                'sale_exists_after_commit' => 'YES',
                'items_count' => $sale->saleItems->count(),
                'total_amount' => $sale->total_amount
            ]);

            // Calculate and sync commission to manager's wallet using qualified sales logic
            \Log::info('Calculating commission for sale using qualified sales logic', [
                'sale_id' => $sale->id,
                'total_amount' => $sale->total_amount,
                'manager_id' => $sale->manager_id
            ]);
            
            try {
                // Get or create wallet for the manager
                $wallet = \App\Models\Wallet::firstOrCreate(
                    ['user_id' => $sale->manager_id],
                    ['balance' => 0, 'total_earned' => 0, 'total_paid_out' => 0, 'paid_sales' => 0]
                );

                // Calculate total sales for this manager
                $totalSales = \App\Models\Sale::where('manager_id', $sale->manager_id)->sum('total_amount');
                
                // Calculate qualified commission using the same logic as wallet display
                $qualifiedCommission = $wallet->getQualifiedCommission($totalSales);
                
                // Calculate the difference and add it to balance
                $commissionDifference = $qualifiedCommission - $wallet->balance;
                
                if ($commissionDifference > 0) {
                    $wallet->increment('balance', $commissionDifference);
                    $wallet->increment('total_earned', $commissionDifference);
                }
                
                \Log::info('Commission synced to wallet successfully', [
                    'sale_id' => $sale->id,
                    'total_sales' => $totalSales,
                    'qualified_commission' => $qualifiedCommission,
                    'commission_difference' => $commissionDifference,
                    'wallet_id' => $wallet->id,
                    'new_balance' => $wallet->fresh()->balance
                ]);
            } catch (\Exception $walletError) {
                \Log::error('Failed to sync commission to wallet', [
                    'sale_id' => $sale->id,
                    'error' => $walletError->getMessage(),
                    'trace' => $walletError->getTraceAsString()
                ]);
                // Don't fail the entire transaction for wallet calculation failure
            }

            // Dispatch SaleCreated event after transaction is committed and verified
            \Log::info('Dispatching SaleCreated event', [
                'sale_id' => $sale->id
            ]);
            
            try {
                event(new \App\Events\SaleCreated($sale));
                \Log::info('SaleCreated event dispatched successfully', [
                    'sale_id' => $sale->id
                ]);
            } catch (\Exception $eventError) {
                \Log::error('Failed to dispatch SaleCreated event', [
                    'sale_id' => $sale->id,
                    'error' => $eventError->getMessage()
                ]);
                // Don't fail the entire transaction for event dispatch failure
            }

            \Log::info('Checkout process completed successfully', [
                'sale_id' => $sale->id,
                'total_amount' => $sale->total_amount,
                'items_count' => $sale->saleItems->count()
            ]);

            // Return JSON response with sale ID for frontend verification
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sale completed successfully!',
                    'sale_id' => $sale->id,
                    'redirect_url' => route('receipts.show', $sale->id)
                ]);
            }

            return redirect()->route('receipts.show', $sale->id)
                ->with('success', 'Sale completed successfully!');

        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error during checkout', [
                'error' => $e->getMessage(),
                'sql_state' => $e->getSqlState(),
                'error_code' => $e->getCode(),
                'user_id' => $user->id
            ]);

            DB::rollBack();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Database error occurred. Please try again.',
                    'error_type' => 'database_error'
                ], 500);
            }
            
            return back()->with('error', 'Database error occurred. Please try again.');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::error('Validation error during checkout', [
                'errors' => $e->errors(),
                'user_id' => $user->id
            ]);

            DB::rollBack();
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Validation failed',
                    'errors' => $e->errors(),
                    'error_type' => 'validation_error'
                ], 422);
            }
            
            return back()->withErrors($e->errors())->with('error', 'Validation failed. Please check your input.');
            
        } catch (\Exception $e) {
            \Log::error('General error during checkout', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $user->id,
                'cart_items' => $cart
            ]);

            DB::rollBack();
            
            $errorMessage = 'Checkout failed. Please try again.';
            if (str_contains($e->getMessage(), 'Insufficient stock')) {
                $errorMessage = $e->getMessage();
            } elseif (str_contains($e->getMessage(), 'verification failed')) {
                $errorMessage = 'Sale verification failed. Please contact support.';
            }
            
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $errorMessage,
                    'error_type' => 'general_error'
                ], 500);
            }
            
            return back()->with('error', $errorMessage);
        }
    }

    /**
     * Verify that a sale was successfully created.
     */
    public function verifySale($saleId)
    {
        // Check if user is a manager
        $user = auth()->user();
        if (!$user || !$user->isManager()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        try {
            $sale = Sale::with(['saleItems.product', 'manager'])
                ->where('id', $saleId)
                ->where('manager_id', $user->id) // Ensure user can only verify their own sales
                ->first();

            if (!$sale) {
                \Log::warning('Sale verification failed - sale not found', [
                    'sale_id' => $saleId,
                    'user_id' => $user->id
                ]);
                return response()->json([
                    'exists' => false,
                    'error' => 'Sale not found or access denied'
                ], 404);
            }

            // Verify sale has items
            if ($sale->saleItems->isEmpty()) {
                \Log::warning('Sale verification failed - no items found', [
                    'sale_id' => $saleId,
                    'user_id' => $user->id
                ]);
                return response()->json([
                    'exists' => false,
                    'error' => 'Sale has no items'
                ], 422);
            }

            \Log::info('Sale verification successful', [
                'sale_id' => $saleId,
                'user_id' => $user->id,
                'items_count' => $sale->saleItems->count(),
                'total_amount' => $sale->total_amount
            ]);

            return response()->json([
                'exists' => true,
                'sale' => [
                    'id' => $sale->id,
                    'total_amount' => $sale->total_amount,
                    'created_at' => $sale->created_at->toISOString(),
                    'items_count' => $sale->saleItems->count(),
                    'items' => $sale->saleItems->map(function ($item) {
                        return [
                            'product_name' => $item->product->name,
                            'quantity' => $item->quantity,
                            'unit_price' => $item->unit_price,
                            'total_price' => $item->total_price,
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Sale verification error', [
                'sale_id' => $saleId,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'exists' => false,
                'error' => 'Verification failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
