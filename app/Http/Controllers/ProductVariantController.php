<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductVariantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $variants = ProductVariant::with('product')
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('sku', 'like', "%{$search}%")
                      ->orWhere('color', 'like', "%{$search}%")
                      ->orWhere('size', 'like', "%{$search}%")
                      ->orWhereHas('product', function ($productQuery) use ($search) {
                          $productQuery->where('name', 'like', "%{$search}%");
                      });
                });
            })
            ->when($request->product_id, function ($query, $productId) {
                $query->where('product_id', $productId);
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->active();
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                } elseif ($status === 'low_stock') {
                    $query->lowStock();
                } elseif ($status === 'out_of_stock') {
                    $query->where('quantity', 0);
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return Inertia::render('Products/Variants/Index', [
            'variants' => $variants,
            'filters' => $request->only(['search', 'product_id', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): Response
    {
        $product = null;
        if ($request->product_id) {
            $product = Product::findOrFail($request->product_id);
        }

        $products = Product::active()->orderBy('name')->get();

        return Inertia::render('Products/Variants/Create', [
            'product' => $product,
            'products' => $products,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'color' => 'nullable|string|max:50',
            'size' => 'nullable|string|max:50',
            'sku' => 'nullable|string|unique:product_variants,sku',
            'quantity' => 'required|integer|min:0',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url',
            'is_active' => 'boolean',
            'low_stock_threshold' => 'required|integer|min:0',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Generate SKU if not provided
        if (empty($validated['sku'])) {
            $validated['sku'] = ProductVariant::generateSku(
                $product,
                $validated['color'] ?? null,
                $validated['size'] ?? null
            );
        }

        $variant = ProductVariant::create($validated);

        return response()->json([
            'message' => 'Product variant created successfully.',
            'variant' => $variant->load('product'),
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(ProductVariant $variant): Response
    {
        $variant->load(['product', 'saleItems.sale']);

        return Inertia::render('Products/Variants/Show', [
            'variant' => $variant,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProductVariant $variant): Response
    {
        $variant->load('product');
        $products = Product::active()->orderBy('name')->get();

        return Inertia::render('Products/Variants/Edit', [
            'variant' => $variant,
            'products' => $products,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProductVariant $variant): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'color' => 'nullable|string|max:50',
            'size' => 'nullable|string|max:50',
            'sku' => [
                'nullable',
                'string',
                Rule::unique('product_variants', 'sku')->ignore($variant->id),
            ],
            'quantity' => 'required|integer|min:0',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'discount_price' => 'nullable|numeric|min:0',
            'image_url' => 'nullable|url',
            'is_active' => 'boolean',
            'low_stock_threshold' => 'required|integer|min:0',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        // Generate SKU if not provided
        if (empty($validated['sku'])) {
            $validated['sku'] = ProductVariant::generateSku(
                $product,
                $validated['color'] ?? null,
                $validated['size'] ?? null
            );
        }

        $variant->update($validated);

        return response()->json([
            'message' => 'Product variant updated successfully.',
            'variant' => $variant->load('product'),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProductVariant $variant): JsonResponse
    {
        // Check if variant has any sales
        if ($variant->saleItems()->exists()) {
            return response()->json([
                'message' => 'Cannot delete variant that has sales records.',
            ], 422);
        }

        $variant->delete();

        return response()->json([
            'message' => 'Product variant deleted successfully.',
        ]);
    }

    /**
     * Get variants for a specific product.
     */
    public function getProductVariants(Product $product): JsonResponse
    {
        $variants = $product->variants()
            ->active()
            ->orderBy('color')
            ->orderBy('size')
            ->get();

        return response()->json([
            'variants' => $variants,
        ]);
    }

    /**
     * Update variant stock.
     */
    public function updateStock(Request $request, ProductVariant $variant): JsonResponse
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:0',
        ]);

        $variant->update(['quantity' => $validated['quantity']]);

        return response()->json([
            'message' => 'Stock updated successfully.',
            'variant' => $variant->load('product'),
        ]);
    }

    /**
     * Get low stock variants.
     */
    public function lowStock(): Response
    {
        $variants = ProductVariant::with('product')
            ->lowStock()
            ->orderBy('quantity')
            ->paginate(15);

        return Inertia::render('Products/Variants/LowStock', [
            'variants' => $variants,
        ]);
    }
}
