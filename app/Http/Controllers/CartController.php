<?php

namespace App\Http\Controllers;

use App\Events\SaleCreated;
use App\Http\Requests\CartItemRequest;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\JsonResponse;
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
        $cart = session('cart', []);
        $products = Product::whereIn('id', array_keys($cart))->get();
        
        $cartItems = collect($cart)->map(function ($item, $productId) use ($products) {
            $product = $products->find($productId);
            return [
                'product_id' => $productId,
                'product' => $product,
                'quantity' => $item['quantity'],
                'sale_price' => $item['sale_price'],
                'line_total' => $item['quantity'] * $item['sale_price'],
            ];
        });

        return Inertia::render('Cart/CartPage', [
            'cartItems' => $cartItems,
            'total' => $cartItems->sum('line_total'),
        ]);
    }

    /**
     * Add item to cart.
     */
    public function addItem(CartItemRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $cart = session('cart', []);
        
        $productId = $validated['product_id'];
        $cart[$productId] = [
            'quantity' => $validated['quantity'],
            'sale_price' => $validated['sale_price'],
        ];
        
        session(['cart' => $cart]);

        return response()->json([
            'message' => 'Item added to cart.',
            'cart' => $cart,
        ]);
    }

    /**
     * Update cart item.
     */
    public function updateItem(Request $request, $productId): JsonResponse
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
            'sale_price' => 'required|numeric|min:0',
        ]);

        $product = Product::findOrFail($productId);
        
        if ($request->sale_price < $product->msrp) {
            return response()->json([
                'message' => 'Sale price must be at least the MSRP.',
            ], 422);
        }

        if ($request->quantity > $product->quantity_on_hand) {
            return response()->json([
                'message' => 'Not enough stock available.',
            ], 422);
        }

        $cart = session('cart', []);
        $cart[$productId] = [
            'quantity' => $request->quantity,
            'sale_price' => $request->sale_price,
        ];
        
        session(['cart' => $cart]);

        return response()->json([
            'message' => 'Cart item updated.',
            'cart' => $cart,
        ]);
    }

    /**
     * Remove item from cart.
     */
    public function removeItem($productId): JsonResponse
    {
        $cart = session('cart', []);
        unset($cart[$productId]);
        session(['cart' => $cart]);

        return response()->json([
            'message' => 'Item removed from cart.',
            'cart' => $cart,
        ]);
    }

    /**
     * Checkout the cart.
     */
    public function checkout(Request $request): JsonResponse
    {
        $request->validate([
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.sale_price' => 'required|numeric|min:0',
        ]);

        $cart = session('cart', []);
        if (empty($cart)) {
            return response()->json([
                'message' => 'Cart is empty.',
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Validate stock availability
            foreach ($cart as $productId => $item) {
                $product = Product::findOrFail($productId);
                if ($item['quantity'] > $product->quantity_on_hand) {
                    throw new \Exception("Insufficient stock for product: {$product->name}");
                }
            }

            // Create sale
            $sale = Sale::create([
                'manager_id' => auth()->id(),
                'total_amount' => collect($cart)->sum(function ($item) {
                    return $item['quantity'] * $item['sale_price'];
                }),
            ]);

            // Create sale items and update stock
            foreach ($cart as $productId => $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $productId,
                    'quantity' => $item['quantity'],
                    'sale_price' => $item['sale_price'],
                ]);

                // Update product stock
                $product = Product::find($productId);
                $product->decrement('quantity_on_hand', $item['quantity']);
            }

            // Clear cart
            session()->forget('cart');

            // Generate receipt
            $receiptPath = $this->generateReceipt($sale);

            // Fire event
            event(new SaleCreated($sale));

            DB::commit();

            return response()->json([
                'success' => true,
                'receipt_url' => Storage::url($receiptPath),
                'sale_id' => $sale->id,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Generate PDF receipt for the sale.
     */
    private function generateReceipt(Sale $sale): string
    {
        $receiptPath = "receipts/{$sale->id}.pdf";
        
        // For now, we'll create a simple text receipt
        // In a real implementation, you'd use DOMPDF or similar
        $receiptContent = view('receipts.sale', compact('sale'))->render();
        
        // Store the receipt (in a real app, you'd generate PDF)
        Storage::put($receiptPath, $receiptContent);
        
        return $receiptPath;
    }
} 