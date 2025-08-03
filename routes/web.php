<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();
        $data = [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ],
        ];

        // If user is a manager, provide products and cart data
        if ($user->isManager()) {
            $query = \App\Models\Product::with('variants')->where('is_active', true);

            // Add search functionality
            if (request('search')) {
                $search = request('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhereHas('variants', function ($vq) use ($search) {
                            $vq->where('sku', 'like', "%{$search}%");
                        });
                });
            }

            $products = $query->orderBy('name')->paginate(12);

            $cart = session('cart', []);
            $cartCount = count($cart);

            $data['products'] = $products;
            $data['cartCount'] = $cartCount;
        }

        // Add flash messages
        if (session('success')) {
            $data['flash']['success'] = session('success');
        }

        // Redirect admins to admin dashboard, managers to regular dashboard
        if ($user->isAdmin()) {
            // Debug: Log the redirect
            \Log::info('Admin user detected, redirecting to admin dashboard', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'user_email' => $user->email
            ]);
            return redirect('/admin-dashboard');
        }

        return Inertia::render('dashboard', $data);
    })->name('dashboard');

    // Test route to check user role
    Route::get('/test-user', function () {
        $user = auth()->user();
        return response()->json([
            'user' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'isAdmin' => $user->isAdmin(),
                'isManager' => $user->isManager(),
            ] : null,
            'authenticated' => auth()->check(),
            'session_id' => session()->getId(),
        ]);
    });

    // Test route without authentication
    Route::get('/test-public', function () {
        return response()->json([
            'message' => 'Public route works',
            'session_id' => session()->getId(),
        ]);
    });

    // Admin Dashboard (accessible to admins)
    Route::get('/admin-dashboard', function () {
        $user = auth()->user();

        // Ensure only admins can access this route
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        // Get basic analytics data directly
        $totalSales = \App\Models\Sale::sum('total_amount');
        $totalOrders = \App\Models\Sale::count();
        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        $totalProducts = \App\Models\Product::count();
        $totalVariants = \App\Models\ProductVariant::count();
        $lowStockProducts = \App\Models\ProductVariant::where('quantity', '<=', 5)
            ->where('quantity', '>', 0)
            ->where('is_active', true)
            ->count();
        $outOfStockProducts = \App\Models\ProductVariant::where('quantity', 0)
            ->where('is_active', true)
            ->count();

        $data = [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ],
            'analytics' => [
                'sales' => [
                    'totalSales' => $totalSales,
                    'totalOrders' => $totalOrders,
                    'averageOrderValue' => round($averageOrderValue, 2),
                ],
                'inventory' => [
                    'totalProducts' => $totalProducts,
                    'totalVariants' => $totalVariants,
                    'lowStockProducts' => $lowStockProducts,
                    'outOfStockProducts' => $outOfStockProducts,
                ],
            ],
        ];

        return Inertia::render('admin-dashboard', $data);
    })->name('admin-dashboard');

    // Admin routes
    Route::middleware(['can:isAdmin'])->group(function () {
        Route::resource('products', ProductController::class);
        Route::resource('users', UserController::class);

        // Dashboard Analytics routes
        Route::get('/dashboard/analytics', [AnalyticsController::class, 'dashboard'])->name('dashboard.analytics');
        Route::get('/dashboard/sales-analytics', [AnalyticsController::class, 'salesAnalytics'])->name('dashboard.sales-analytics');
        Route::get('/dashboard/inventory-analytics', [AnalyticsController::class, 'inventoryAnalytics'])->name('dashboard.inventory-analytics');

        // Receipt routes
        Route::get('/receipts/{sale}', [ReceiptController::class, 'show'])->name('receipts.show');
    });

    // Manager routes - accessible to both managers and admins
    Route::get('/products/catalog', [ProductController::class, 'catalog'])->name('products.catalog');
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/items', [CartController::class, 'addItem'])->name('cart.add-item');
    Route::put('/cart/items/{variantId}', [CartController::class, 'updateItem'])->name('cart.update-item');
    Route::delete('/cart/items/{variantId}', [CartController::class, 'removeItem'])->name('cart.remove-item');
    Route::post('/cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
