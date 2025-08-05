<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $products = Product::with(['variants' => function ($query) {
            $query->active();
        }])
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->when($request->stock_filter, function ($query, $filter) {
                if ($filter === 'low_stock') {
                    $query->whereHas('variants', function ($q) {
                        $q->where('quantity', '>', 0)
                            ->whereRaw('quantity <= low_stock_threshold');
                    });
                } elseif ($filter === 'out_of_stock') {
                    $query->whereDoesntHave('variants', function ($q) {
                        $q->where('quantity', '>', 0);
                    });
                }
            })
            ->orderBy('name')
            ->paginate(12);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => $request->only(['search', 'stock_filter']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $existingCategories = Product::distinct()
            ->whereNotNull('category')
            ->pluck('category')
            ->sort()
            ->values();

        return Inertia::render('Products/Create', [
            'existingCategories' => $existingCategories,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            Log::info('Product store request received', [
                'data' => $request->all()
            ]);

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'brand' => 'nullable|string|max:100',
                'category' => 'nullable|string|max:100',
                'image_url' => 'nullable|string',
                'features' => 'nullable|array',
                'meta_title' => 'nullable|string|max:255',
                'meta_description' => 'nullable|string',
                'is_active' => 'boolean',
                'variants' => 'required|array|min:1',
                'variants.*.color' => 'nullable|string|max:50',
                'variants.*.size' => 'nullable|string|max:20',
                'variants.*.sku' => 'required|string|max:100',
                'variants.*.quantity' => 'required|integer|min:0',
                'variants.*.cost_price' => 'required|numeric|min:0',
                'variants.*.selling_price' => 'required|numeric|min:0',
                'variants.*.discount_price' => 'nullable|numeric|min:0',
                'variants.*.image_url' => 'nullable|string',
                'variants.*.is_active' => 'boolean',
                'variants.*.low_stock_threshold' => 'required|integer|min:0',
            ]);

            Log::info('Product validation passed', ['validated' => $validated]);

            $variants = $validated['variants'];
            unset($validated['variants']);

            Log::info('Creating product with data', ['product_data' => $validated]);

            DB::beginTransaction();
            try {
                $product = Product::create($validated);

                Log::info('Product created, now creating variants', ['product_id' => $product->id]);

                // Create variants
                foreach ($variants as $variantData) {
                    Log::info('Creating variant', ['variant_data' => $variantData]);
                    $product->variants()->create($variantData);
                }

                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }

            Log::info('Product created successfully', ['product_id' => $product->id]);

            return response()->json([
                'message' => 'Product created successfully.',
                'product' => $product->load('variants'),
            ]);
        } catch (\Exception $e) {
            Log::error('Product creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create product: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Product $product): Response
    {
        $product->load(['variants' => function ($query) {
            $query->orderBy('color')->orderBy('size');
        }]);

        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product): Response
    {
        $product->load(['variants' => function ($query) {
            $query->orderBy('color')->orderBy('size');
        }]);

        $existingCategories = Product::distinct()
            ->whereNotNull('category')
            ->pluck('category')
            ->sort()
            ->values();

        return Inertia::render('Products/Edit', [
            'product' => $product,
            'existingCategories' => $existingCategories,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'brand' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'image_url' => 'nullable|url',
            'features' => 'nullable|array',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'is_active' => 'boolean',
            'variants' => 'required|array|min:1',
            'variants.*.id' => 'nullable|integer|exists:product_variants,id',
            'variants.*.color' => 'nullable|string|max:50',
            'variants.*.size' => 'nullable|string|max:20',
            'variants.*.sku' => 'required|string|max:100',
            'variants.*.quantity' => 'required|integer|min:0',
            'variants.*.cost_price' => 'required|numeric|min:0',
            'variants.*.selling_price' => 'required|numeric|min:0',
            'variants.*.discount_price' => 'nullable|numeric|min:0',
            'variants.*.image_url' => 'nullable|url',
            'variants.*.is_active' => 'boolean',
            'variants.*.low_stock_threshold' => 'required|integer|min:0',
        ]);

        // Custom SKU validation to handle updates
        $variants = $validated['variants'];
        foreach ($variants as $index => $variant) {
            if (isset($variant['id'])) {
                // For existing variants, check SKU uniqueness within the same product
                $existingVariant = $product->variants()->find($variant['id']);
                if ($existingVariant && $existingVariant->sku !== $variant['sku']) {
                    // SKU changed, check if new SKU is unique within this product
                    if ($product->variants()->where('sku', $variant['sku'])->where('id', '!=', $variant['id'])->exists()) {
                        throw new \Illuminate\Validation\ValidationException(
                            validator([], []),
                            response()->json(['errors' => ['variants.' . $index . '.sku' => ['The SKU must be unique within this product.']]], 422)
                        );
                    }
                }
            } else {
                // For new variants, check if SKU is unique within this product
                if ($product->variants()->where('sku', $variant['sku'])->exists()) {
                    throw new \Illuminate\Validation\ValidationException(
                        validator([], []),
                        response()->json(['errors' => ['variants.' . $index . '.sku' => ['The SKU must be unique within this product.']]], 422)
                    );
                }
            }
        }

        $variants = $validated['variants'];
        unset($validated['variants']);

        $product->update($validated);

        // Update or create variants
        $existingVariantIds = [];
        foreach ($variants as $variantData) {
            if (isset($variantData['id'])) {
                // Update existing variant
                $variant = $product->variants()->find($variantData['id']);
                if ($variant) {
                    $variant->update($variantData);
                    $existingVariantIds[] = $variant->id;
                }
            } else {
                // Create new variant
                $newVariant = $product->variants()->create($variantData);
                $existingVariantIds[] = $newVariant->id;
            }
        }

        // Delete variants that are no longer in the list
        $product->variants()->whereNotIn('id', $existingVariantIds)->delete();

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $product->load('variants'),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): JsonResponse
    {
        // Check if product has any variants with sales
        if ($product->variants()->whereHas('saleItems')->exists()) {
            return response()->json([
                'message' => 'Cannot delete product that has sales records.',
            ], 422);
        }

        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully.',
        ]);
    }

    /**
     * Display the product catalog for sales.
     */
    public function catalog(Request $request): Response
    {
        $products = Product::with(['variants' => function ($query) {
            $query->active()->inStock();
        }])
            ->active()
            ->inStock()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate(12);

        return Inertia::render('Products/Catalog', [
            'products' => $products,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Get product variants for sales interface.
     */
    public function getVariants(Product $product): JsonResponse
    {
        $variants = $product->variants()
            ->active()
            ->inStock()
            ->orderBy('color')
            ->orderBy('size')
            ->get();

        return response()->json([
            'variants' => $variants,
        ]);
    }

    /**
     * Get available categories.
     */
    public function getCategories(): JsonResponse
    {
        $categories = Product::distinct()
            ->whereNotNull('category')
            ->pluck('category')
            ->sort()
            ->values();

        return response()->json([
            'categories' => $categories,
        ]);
    }

    /**
     * Get available brands.
     */
    public function getBrands(): JsonResponse
    {
        $brands = Product::distinct()
            ->whereNotNull('brand')
            ->pluck('brand')
            ->sort()
            ->values();

        return response()->json([
            'brands' => $brands,
        ]);
    }

    /**
     * Upload an image and return the URL
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif,webp|max:5120', // 5MB max
        ]);

        try {
            $imageUrl = $this->imageService->uploadImage($request->file('image'));

            return response()->json([
                'success' => true,
                'url' => $imageUrl,
                'message' => 'Image uploaded successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Restock products
     */
    public function restock(Request $request)
    {
        try {
            $request->validate([
                'items' => 'required|array',
                'items.*.product_variant_id' => 'required|integer|min:1',
                'items.*.new_quantity' => 'required|integer|min:0',
            ]);

            $items = $request->input('items');
            $updatedCount = 0;
            $errors = [];

            Log::info('Restock request received', ['items' => $items]);

            foreach ($items as $item) {
                $variantId = $item['product_variant_id'];
                $newQuantity = $item['new_quantity'];

                Log::info('Processing restock item', [
                    'variant_id' => $variantId,
                    'new_quantity' => $newQuantity
                ]);

                $variant = ProductVariant::find($variantId);
                if ($variant) {
                    $oldQuantity = $variant->quantity;
                    $variant->update(['quantity' => $newQuantity]);
                    $updatedCount++;

                    Log::info('Variant updated', [
                        'variant_id' => $variantId,
                        'product_name' => $variant->product->name ?? 'Unknown',
                        'old_quantity' => $oldQuantity,
                        'new_quantity' => $newQuantity
                    ]);
                } else {
                    $errors[] = "Variant ID {$variantId} not found";
                    Log::warning('Variant not found', ['variant_id' => $variantId]);
                }
            }

            $message = "Successfully restocked {$updatedCount} products";
            if (!empty($errors)) {
                $message .= ". Errors: " . implode(', ', $errors);
            }

            // Create notification for restock
            if ($updatedCount > 0) {
                $notificationService = new \App\Services\NotificationService();
                $restockedItems = [];
                foreach ($items as $item) {
                    $variant = ProductVariant::find($item['product_variant_id']);
                    if ($variant) {
                        $restockedItems[] = [
                            'product_name' => $variant->product->name,
                            'variant_info' => $variant->getVariantName(),
                            'quantity' => $item['new_quantity'],
                        ];
                    }
                }
                $notificationService->createRestockNotification($restockedItems);
            }

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Restock failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()->with('error', 'Failed to restock products: ' . $e->getMessage());
        }
    }
}
