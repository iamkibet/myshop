<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Services\ImageService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    protected ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
    }

    /**
     * Display a listing of products
     */
    public function index(Request $request): Response
    {
        $products = Product::query()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($request->category && $request->category !== 'all', function ($query, $category) {
                $query->where('category', $category);
            })
            ->when($request->brand && $request->brand !== 'all', function ($query, $brand) {
                $query->where('brand', $brand);
            })
            ->when($request->stock_filter, function ($query, $filter) {
                switch ($filter) {
                    case 'low_stock':
                        $query->lowStock();
                        break;
                    case 'out_of_stock':
                        $query->outOfStock();
                        break;
                    case 'in_stock':
                        $query->inStock();
                        break;
                }
            })
            ->when($request->price_min || $request->price_max, function ($query) use ($request) {
                $min = $request->price_min ?: 0;
                $max = $request->price_max ?: 999999;
                $query->priceRange($min, $max);
            })
            ->when($request->sort_by, function ($query, $sortBy) use ($request) {
                $direction = $request->sort_direction === 'desc' ? 'desc' : 'asc';
                switch ($sortBy) {
                    case 'name':
                        $query->orderBy('name', $direction);
                        break;
                    case 'category':
                        $query->orderBy('category', $direction);
                        break;
                    case 'brand':
                        $query->orderBy('brand', $direction);
                        break;
                    case 'price':
                        $query->orderBy('selling_price', $direction);
                        break;
                    case 'quantity':
                        $query->orderBy('quantity', $direction);
                        break;
                    case 'created_at':
                        $query->orderBy('created_at', $direction);
                        break;
                    case 'updated_at':
                        $query->orderBy('updated_at', $direction);
                        break;
                    default:
                        $query->orderBy('created_at', 'desc'); // Default: newest first
                }
            }, function ($query) {
                // Default sorting: newest products first
                $query->orderBy('created_at', 'desc');
            })
            ->paginate($request->per_page ?: 20)
            ->withQueryString();

        // Get unique categories and brands for filters
        $categories = Product::getAvailableCategories();
        $brands = Product::getAvailableBrands();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'categories' => $categories,
            'brands' => $brands,
            'filters' => $request->only(['search', 'category', 'brand', 'stock_filter', 'price_min', 'price_max', 'sort_by', 'sort_direction', 'per_page']),
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Show the form for creating a new product
     */
    public function create(): Response
    {
        $existingCategories = Product::getAvailableCategories();
        $existingBrands = Product::getAvailableBrands();

        return Inertia::render('Products/Create', [
            'existingCategories' => $existingCategories,
            'existingBrands' => $existingBrands,
        ]);
    }

    /**
     * Store a newly created product
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        try {


            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'category' => 'required|string|max:100',
                'description' => 'nullable|string',
                'brand' => 'nullable|string|max:100',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'image_url' => 'nullable|string|url',
                'features' => 'nullable|string', // Changed from array to string since we're sending JSON
                'sku' => 'nullable|string|max:100|unique:products,sku',
                'quantity' => 'required|integer|min:0',
                'cost_price' => 'required|numeric|min:0',
                'selling_price' => 'required|numeric|min:0',
                'discount_price' => 'nullable|numeric|min:0',
                'low_stock_threshold' => 'required|integer|min:0',
                'is_active' => 'boolean',
            ]);



            // Handle image upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $imagePath = $image->storeAs('products', $imageName, 'public');
                $imagePath = '/storage/' . $imagePath;
            } elseif ($request->filled('image_url')) {
                $imagePath = $request->image_url;
            } else {
                $imagePath = null;
            }

            // Validate discount price is less than selling price
            if (isset($validated['discount_price']) && $validated['discount_price'] >= $validated['selling_price']) {
                return redirect()->back()->withInput()->withErrors([
                    'discount_price' => 'Discount price must be less than selling price.'
                ]);
            }

            // Prepare data for creation
            $productData = array_merge($validated, [
                'image_url' => $imagePath,
            ]);

            // Parse features from JSON string to array
            if (isset($productData['features']) && is_string($productData['features'])) {
                $productData['features'] = json_decode($productData['features'], true) ?: [];
            }

            // Remove the image file from validated data since we're storing the path
            unset($productData['image']);



            $product = Product::create($productData);



            return redirect()->route('products.index')->with('success', 'Product created successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Product validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all()
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Product creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all()
            ]);

            return redirect()->back()->withInput()->withErrors([
                'general' => 'Failed to create product: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Display the specified product
     */
    public function show(Product $product): Response
    {
        return Inertia::render('Products/Show', [
            'product' => $product,
        ]);
    }

    /**
     * Show the form for editing a product
     */
    public function edit(Product $product): Response
    {
        $existingCategories = Product::getAvailableCategories();
        $existingBrands = Product::getAvailableBrands();



        return Inertia::render('Products/Edit', [
            'product' => $product,
            'existingCategories' => $existingCategories,
            'existingBrands' => $existingBrands,
        ]);
    }

    /**
     * Update the specified product
     */
    public function update(Request $request, Product $product): \Illuminate\Http\RedirectResponse
    {
        try {


            // Check if we have any data at all
            if (empty($request->all()) && empty($request->allFiles())) {
                return redirect()->back()->withInput()->withErrors([
                    'general' => 'No form data received. Please try again or contact support if the problem persists.'
                ]);
            }

            // Check authentication and authorization
            $user = auth()->user();
            if (!$user || !$user->isAdmin()) {
                abort(403, 'Unauthorized access.');
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'category' => 'required|string|max:100',
                'description' => 'nullable|string',
                'brand' => 'nullable|string|max:100',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
                'image_url' => 'nullable|string|url',
                'features' => 'nullable|string', // Changed from array to string since we're sending JSON
                'sku' => 'nullable|string|max:100|unique:products,sku,' . $product->id,
                'quantity' => 'required|integer|min:0',
                'cost_price' => 'required|numeric|min:0',
                'selling_price' => 'required|numeric|min:0',
                'discount_price' => 'nullable|numeric|min:0',
                'low_stock_threshold' => 'required|integer|min:0',
                'is_active' => 'boolean',
            ]);

            Log::info('Update validation passed', ['validated' => $validated]);

            // Handle image upload
            $imagePath = $product->image_url; // Keep existing image by default
            if ($request->hasFile('image')) {
                $image = $request->file('image');
                $imageName = time() . '_' . $image->getClientOriginalName();
                $imagePath = $image->storeAs('products', $imageName, 'public');
                $imagePath = '/storage/' . $imagePath;
            } elseif ($request->filled('image_url')) {
                $imagePath = $request->image_url;
            } else {
                $imagePath = $product->image_url;
            }

            // Validate discount price is less than selling price
            if (isset($validated['discount_price']) && $validated['discount_price'] >= $validated['selling_price']) {
                return redirect()->back()->withInput()->withErrors([
                    'discount_price' => 'Discount price must be less than selling price.'
                ]);
            }

            // Prepare data for update
            $productData = array_merge($validated, [
                'image_url' => $imagePath,
            ]);

            // Parse features from JSON string to array
            if (isset($productData['features']) && is_string($productData['features'])) {
                $productData['features'] = json_decode($productData['features'], true) ?: [];
            }

            // Remove the image file from validated data since we're storing the path
            unset($productData['image']);



            $product->update($productData);



            return redirect()->route('products.index')->with('success', 'Product updated successfully!');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Product update validation failed', [
                'errors' => $e->errors(),
                'input' => $request->all(),
                'product_id' => $product->id
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Product update failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'product_id' => $product->id,
                'request_data' => $request->all()
            ]);

            return redirect()->back()->withInput()->withErrors([
                'general' => 'Failed to update product: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Remove the specified product
     */
    public function destroy(Product $product): JsonResponse
    {
        // Check if product has any sales
        if ($product->sales()->exists()) {
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
     * Display the product catalog for sales
     */
    public function catalog(Request $request): Response
    {
        $products = Product::active()
            ->inStock()
            ->when($request->search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%");
                });
            })
            ->when($request->category && $request->category !== 'all', function ($query, $category) {
                $query->where('category', $category);
            })
            ->orderBy('name')
            ->paginate(20);

        $categories = Product::getAvailableCategories();

        return Inertia::render('Products/Catalog', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category']),
        ]);
    }

    /**
     * Bulk restock products
     */
    public function restock(Request $request): \Illuminate\Http\RedirectResponse
    {
        try {
            $request->validate([
                'items' => 'required|array',
                'items.*.product_id' => 'required|integer|exists:products,id',
                'items.*.new_quantity' => 'required|integer|min:0',
            ]);

            $items = $request->input('items');
            $updatedCount = 0;

            foreach ($items as $item) {
                $product = Product::find($item['product_id']);
                if ($product) {
                    $oldQuantity = $product->quantity;
                    $product->update(['quantity' => $item['new_quantity']]);
                    $updatedCount++;


                }
            }

            $message = "Successfully restocked {$updatedCount} products";
            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            Log::error('Restock failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return redirect()->back()->with('error', 'Failed to restock products: ' . $e->getMessage());
        }
    }

    /**
     * Get product statistics
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_products' => Product::count(),
            'active_products' => Product::active()->count(),
            'in_stock_products' => Product::inStock()->count(),
            'low_stock_products' => Product::lowStock()->count(),
            'out_of_stock_products' => Product::outOfStock()->count(),
            'total_inventory_value' => Product::sum(DB::raw('quantity * cost_price')),
            'total_retail_value' => Product::sum(DB::raw('quantity * selling_price')),
            'products_by_category' => Product::getProductsByCategory(),
            'low_stock_alerts' => Product::getLowStockProducts(5),
            'out_of_stock_alerts' => Product::getOutOfStockProducts(5),
        ];

        return response()->json($stats);
    }

    /**
     * Save a new brand to the database
     */
    public function saveBrand(Request $request): JsonResponse
    {
        $request->validate([
            'brand' => 'required|string|max:100',
        ]);

        try {
            // Check if brand already exists
            $existingBrand = Product::where('brand', $request->brand)->first();
            if ($existingBrand) {
                return response()->json([
                    'success' => true,
                    'message' => 'Brand already exists',
                    'brand' => $request->brand,
                ]);
            }

            // Create a temporary product with the new brand to ensure it's saved
            $tempProduct = Product::create([
                'name' => 'Temporary Product for Brand: ' . $request->brand,
                'category' => 'Temporary',
                'brand' => $request->brand,
                'sku' => 'TEMP-BRAND-' . strtoupper(Str::random(4)),
                'quantity' => 0,
                'cost_price' => 0,
                'selling_price' => 0,
                'is_active' => false,
            ]);

            // Delete the temporary product
            $tempProduct->delete();

            return response()->json([
                'success' => true,
                'message' => 'Brand saved successfully',
                'brand' => $request->brand,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save brand: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save a new category to the database
     */
    public function saveCategory(Request $request): JsonResponse
    {
        $request->validate([
            'category' => 'required|string|max:100',
        ]);

        try {
            // Check if category already exists
            $existingCategory = Product::where('category', $request->category)->first();
            if ($existingCategory) {
                return response()->json([
                    'success' => true,
                    'message' => 'Category already exists',
                    'category' => $request->category,
                ]);
            }

            // Create a temporary product with the new category to ensure it's saved
            $tempProduct = Product::create([
                'name' => 'Temporary Product for Category: ' . $request->category,
                'category' => $request->category,
                'brand' => 'Temporary',
                'sku' => 'TEMP-CAT-' . strtoupper(Str::random(4)),
                'quantity' => 0,
                'cost_price' => 0,
                'selling_price' => 0,
                'is_active' => false,
            ]);

            // Delete the temporary product
            $tempProduct->delete();

            return response()->json([
                'success' => true,
                'message' => 'Category saved successfully',
                'category' => $request->category,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save category: ' . $e->getMessage(),
            ], 500);
        }
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
}
