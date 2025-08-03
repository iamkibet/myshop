<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
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
            ->when($request->category, function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->brand, function ($query, $brand) {
                $query->where('brand', $brand);
            })
            ->when($request->status, function ($query, $status) {
                if ($status === 'active') {
                    $query->active();
                } elseif ($status === 'inactive') {
                    $query->where('is_active', false);
                } elseif ($status === 'in_stock') {
                    $query->inStock();
                }
            })
            ->orderBy('name')
            ->paginate(12);

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => $request->only(['search', 'category', 'brand', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Products/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
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
        ]);

        $product = Product::create($validated);

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $product,
        ]);
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
        return Inertia::render('Products/Edit', [
            'product' => $product,
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
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $product,
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
}
