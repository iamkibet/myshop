<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductRequest;
use App\Models\Product;
use App\Services\ImageService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    private ImageService $imageService;

    public function __construct(ImageService $imageService)
    {
        $this->imageService = $imageService;
        Log::info('ProductController constructor called');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Product::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%");
            })
            ->when($request->stock_filter, function ($query, $filter) {
                switch ($filter) {
                    case 'low_stock':
                        $query->whereRaw('quantity_on_hand <= low_stock_threshold AND quantity_on_hand > 0');
                        break;
                    case 'out_of_stock':
                        $query->where('quantity_on_hand', 0);
                        break;
                }
            })
            ->orderBy('created_at', 'desc'); // Latest products first

        $products = $query->paginate(10)->withQueryString();

        return Inertia::render('Products/Index', [
            'products' => $products,
            'filters' => $request->only(['search', 'stock_filter']),
        ]);
    }

    /**
     * Display a catalog of products for managers.
     */
    public function catalog(Request $request): Response
    {
        $products = Product::query()
            ->where('quantity_on_hand', '>', 0)
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Products/Catalog', [
            'products' => $products,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Products/Form', [
            'options' => $this->getProductOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        // Simple test to see if this method is being called
        Log::info('ProductController::store method called - START');

        // Debug: Log the received data
        Log::info('Product creation request', [
            'all_data' => $request->all(),
            'files' => $request->hasFile('image_files') ? count($request->file('image_files')) : 0,
        ]);

        Log::info('ProductController::store - processing data');

        // Simple validation for testing
        $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'required|string|max:100',
            'description' => 'nullable|string|max:1000',
            'brand' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'cost_price' => 'required|numeric|min:0',
            'msrp' => 'required|numeric|min:0',
            'quantity_on_hand' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'images' => 'nullable|string',
            'sizes' => 'nullable|string',
            'colors' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $data = $request->all();

        Log::info('ProductController::store - handling JSON strings');
        // Handle JSON strings for arrays
        if (isset($data['sizes']) && is_string($data['sizes'])) {
            $data['sizes'] = json_decode($data['sizes'], true) ?? [];
        }
        if (isset($data['colors']) && is_string($data['colors'])) {
            $data['colors'] = json_decode($data['colors'], true) ?? [];
        }
        if (isset($data['images']) && is_string($data['images'])) {
            $data['images'] = json_decode($data['images'], true) ?? [];
        }

        Log::info('ProductController::store - handling file uploads');
        // Handle image uploads
        if ($request->hasFile('image_files')) {
            Log::info('Processing file uploads', ['file_count' => count($request->file('image_files'))]);
            try {
                $uploadedUrls = $this->imageService->uploadMultipleImages($request->file('image_files'));
                Log::info('File uploads successful', ['uploaded_urls' => $uploadedUrls]);
                $data['images'] = array_merge($data['images'] ?? [], $uploadedUrls);
            } catch (\Exception $e) {
                Log::error('File upload failed', ['error' => $e->getMessage()]);
                throw $e;
            }
        }

        // Ensure arrays are properly formatted
        $data['sizes'] = $data['sizes'] ?? [];
        $data['colors'] = $data['colors'] ?? [];
        $data['images'] = $data['images'] ?? [];

        Log::info('Final data for product creation', ['data' => $data]);

        Log::info('ProductController::store - creating product');
        try {
            $product = Product::create($data);
            Log::info('Product created successfully', ['product_id' => $product->id]);
        } catch (\Exception $e) {
            Log::error('Product creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }

        Log::info('ProductController::store - redirecting');
        return redirect()->route('products.index')
            ->with('success', 'Product created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Product $product): Response
    {
        return Inertia::render('Products/Form', [
            'product' => $product,
            'options' => $this->getProductOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(ProductRequest $request, Product $product): RedirectResponse
    {
        $data = $request->validated();

        // Handle JSON strings for arrays
        if (isset($data['sizes']) && is_string($data['sizes'])) {
            $data['sizes'] = json_decode($data['sizes'], true) ?? [];
        }
        if (isset($data['colors']) && is_string($data['colors'])) {
            $data['colors'] = json_decode($data['colors'], true) ?? [];
        }
        if (isset($data['images']) && is_string($data['images'])) {
            $data['images'] = json_decode($data['images'], true) ?? [];
        }

        // Handle new image uploads
        if ($request->hasFile('image_files')) {
            $uploadedUrls = $this->imageService->uploadMultipleImages($request->file('image_files'));
            $data['images'] = array_merge($data['images'] ?? [], $uploadedUrls);
        }

        // Handle image deletion (if any images were removed)
        $originalImages = $product->images ?? [];
        $newImages = $data['images'] ?? [];
        $deletedImages = array_diff($originalImages, $newImages);

        if (!empty($deletedImages)) {
            $this->imageService->deleteMultipleImages($deletedImages);
        }

        $product->update($data);

        return redirect()->route('products.index')
            ->with('success', 'Product updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product): RedirectResponse
    {
        // Delete associated images
        if (!empty($product->images)) {
            $this->imageService->deleteMultipleImages($product->images);
        }

        $product->delete();

        return redirect()->route('products.index')
            ->with('success', 'Product deleted successfully.');
    }

    private function getProductOptions(): array
    {
        return [
            'brands' => Product::distinct()->pluck('brand')->filter()->sort()->values(),
            'categories' => Product::distinct()->pluck('category')->filter()->sort()->values(),
            'colors' => $this->getAllColors(),
            'sizes' => $this->getAllSizes(),
        ];
    }

    private function getAllColors(): array
    {
        $colors = Product::whereNotNull('colors')
            ->get()
            ->flatMap(function ($product) {
                return $product->colors ?? [];
            })
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        return $colors;
    }

    private function getAllSizes(): array
    {
        $sizes = Product::whereNotNull('sizes')
            ->get()
            ->flatMap(function ($product) {
                return $product->sizes ?? [];
            })
            ->filter()
            ->unique()
            ->sort()
            ->values()
            ->toArray();

        return $sizes;
    }
}
