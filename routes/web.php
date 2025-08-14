<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WalletController;
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

            // Add category filtering
            if (request('category') && request('category') !== 'all') {
                $query->where('category', request('category'));
            }

            $products = $query->orderBy('name')->paginate(20);

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

        // Get comprehensive analytics data using AnalyticsController
        $analyticsController = new \App\Http\Controllers\AnalyticsController();
        $analyticsResponse = $analyticsController->dashboard(request());
        $analyticsData = json_decode($analyticsResponse->getContent(), true);

        $data = [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ],
            ],
            'analytics' => $analyticsData,
        ];

        return Inertia::render('admin-dashboard', $data);
    })->name('admin-dashboard');

    // Admin routes
    Route::middleware(['can:isAdmin'])->group(function () {
        Route::resource('products', ProductController::class);
        Route::resource('users', UserController::class);

        // Image upload route
        Route::post('/upload-image', [ProductController::class, 'uploadImage'])->name('upload.image');

        // Restock route
        Route::post('/restock', [ProductController::class, 'restock'])->name('restock');

        // Save new brands, categories, and sizes
        Route::post('/save-brand', [ProductController::class, 'saveBrand'])->name('save.brand');
        Route::post('/save-category', [ProductController::class, 'saveCategory'])->name('save.category');
        Route::post('/save-size', [ProductController::class, 'saveSize'])->name('save.size');

        // Test route for debugging
        Route::post('/test-product-update', function () {
            return response()->json(['message' => 'Test route hit', 'data' => request()->all()]);
        })->name('test.product.update');

        // Dashboard Analytics routes
        Route::get('/dashboard/analytics', [AnalyticsController::class, 'dashboard'])->name('dashboard.analytics');
        Route::get('/dashboard/sales-analytics', [AnalyticsController::class, 'salesAnalytics'])->name('dashboard.sales-analytics');
        Route::get('/dashboard/inventory-analytics', [AnalyticsController::class, 'inventoryAnalytics'])->name('dashboard.inventory-analytics');
        Route::get('/dashboard/restock-recommendations', [AnalyticsController::class, 'getRestockRecommendations'])->name('dashboard.restock-recommendations');

        // Notification routes
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [\App\Http\Controllers\NotificationController::class, 'index'])->name('index');
            Route::get('/recent', [\App\Http\Controllers\NotificationController::class, 'recent'])->name('recent');
            Route::post('/mark-read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('mark-read');
            Route::post('/mark-all-read', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
            Route::post('/sync', [\App\Http\Controllers\NotificationController::class, 'sync'])->name('sync');
            Route::get('/stats', [\App\Http\Controllers\NotificationController::class, 'stats'])->name('stats');
            Route::delete('/cleanup', [\App\Http\Controllers\NotificationController::class, 'cleanup'])->name('cleanup');
            Route::delete('/clear-all', [\App\Http\Controllers\NotificationController::class, 'clearAll'])->name('clear-all');
        });

        // Manager stats route
        Route::get('/manager/{managerId}', [SalesController::class, 'managerStats'])->name('manager.stats');

        // Wallet management routes
        Route::prefix('wallets')->name('wallets.')->group(function () {
            Route::get('/', [WalletController::class, 'adminIndex'])->name('index');
            Route::get('/{manager}', [WalletController::class, 'show'])->name('show');
            Route::post('/{manager}/payout', [WalletController::class, 'processPayout'])->name('payout');
            Route::post('/{manager}/sync', [WalletController::class, 'syncWallet'])->name('sync');
            Route::post('/sync-all', [WalletController::class, 'syncAllWallets'])->name('sync-all');
        });

        // Commission rates management
        Route::resource('commission-rates', \App\Http\Controllers\CommissionRateController::class);
        Route::post('/commission-rates/{commissionRate}/toggle', [\App\Http\Controllers\CommissionRateController::class, 'toggleStatus'])->name('commission-rates.toggle');
        Route::post('/commission-rates/preview', [\App\Http\Controllers\CommissionRateController::class, 'preview'])->name('commission-rates.preview');

        // Commission rates management
        Route::resource('commission-rates', \App\Http\Controllers\CommissionRateController::class);
        Route::post('/commission-rates/{commissionRate}/toggle', [\App\Http\Controllers\CommissionRateController::class, 'toggleStatus'])->name('commission-rates.toggle');
        Route::post('/commission-rates/preview', [\App\Http\Controllers\CommissionRateController::class, 'preview'])->name('commission-rates.preview');
    });

    // Sales routes - accessible to both managers and admins
    Route::get('/sales', [SalesController::class, 'index'])->name('sales.index');
    Route::get('/sales/{sale}', [SalesController::class, 'show'])->name('sales.show');

    // Receipt routes - accessible to both managers and admins
    Route::get('/receipts/{sale}', [ReceiptController::class, 'show'])->name('receipts.show');
    Route::get('/receipts/{sale}/download', [ReceiptController::class, 'download'])->name('receipts.download');

    // Manager routes - accessible to both managers and admins
    Route::get('/products/catalog', [ProductController::class, 'catalog'])->name('products.catalog');
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/items', [CartController::class, 'addItem'])->name('cart.add-item');
    Route::put('/cart/items/{variantId}', [CartController::class, 'updateItem'])->name('cart.update-item');
    Route::delete('/cart/items/{variantId}', [CartController::class, 'removeItem'])->name('cart.remove-item');
    Route::post('/cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');

    // Wallet route for managers
    Route::get('/wallet', [WalletController::class, 'index'])->name('wallet.index')->middleware('ensure.wallet');

    // Expense management routes - accessible to both managers and admins
    Route::resource('expenses', ExpenseController::class);
    Route::get('/expenses/{expense}/receipt', [ExpenseController::class, 'downloadReceipt'])->name('expenses.receipt');
    
    // Admin-only expense approval routes
    Route::middleware(['can:isAdmin'])->group(function () {
        Route::post('/expenses/{expense}/approve', [ExpenseController::class, 'approve'])->name('expenses.approve');
        Route::post('/expenses/{expense}/reject', [ExpenseController::class, 'reject'])->name('expenses.reject');
        Route::get('/expenses/pending/approval', [ExpenseController::class, 'pending'])->name('expenses.pending');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
