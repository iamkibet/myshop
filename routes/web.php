<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CommissionRateController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WalletController;
use Illuminate\Support\Facades\Route;

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
    // Dashboard routes
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/admin-dashboard', [DashboardController::class, 'adminDashboard'])->name('admin-dashboard');

    // Admin routes
    Route::middleware(['can:isAdmin'])->group(function () {
        // Product management
        Route::resource('products', ProductController::class)->except(['show']);
        Route::post('/upload-image', [ProductController::class, 'uploadImage'])->name('upload.image');
        Route::post('/restock', [ProductController::class, 'restock'])->name('restock');
        Route::post('/save-brand', [ProductController::class, 'saveBrand'])->name('save.brand');
        Route::post('/save-category', [ProductController::class, 'saveCategory'])->name('save.category');
        Route::post('/save-size', [ProductController::class, 'saveSize'])->name('save.size');

        // User management
        Route::resource('users', UserController::class);

        // Dashboard Analytics routes
        Route::prefix('dashboard')->name('dashboard.')->group(function () {
            Route::get('/analytics', [AnalyticsController::class, 'dashboard'])->name('analytics');
            Route::get('/sales-analytics', [AnalyticsController::class, 'salesAnalytics'])->name('sales-analytics');
            Route::get('/sales-overview', [AnalyticsController::class, 'salesOverview'])->name('sales-overview');
            Route::get('/inventory-analytics', [AnalyticsController::class, 'inventoryAnalytics'])->name('inventory-analytics');
            Route::get('/restock-recommendations', [AnalyticsController::class, 'getRestockRecommendations'])->name('restock-recommendations');
        });

        // Notification management
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::get('/recent', [NotificationController::class, 'recent'])->name('recent');
            Route::post('/mark-read', [NotificationController::class, 'markAsRead'])->name('mark-read');
            Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('mark-all-read');
            Route::post('/sync', [NotificationController::class, 'sync'])->name('sync');
            Route::get('/stats', [NotificationController::class, 'stats'])->name('stats');
            Route::delete('/cleanup', [NotificationController::class, 'cleanup'])->name('cleanup');
            Route::delete('/clear-all', [NotificationController::class, 'clearAll'])->name('clear-all');
        });

        // Manager stats
        Route::get('/manager/{managerId}', [SalesController::class, 'managerStats'])->name('manager.stats');

        // Wallet management
        Route::prefix('wallets')->name('wallets.')->group(function () {
            Route::get('/', [WalletController::class, 'adminIndex'])->name('index');
            Route::get('/{manager}', [WalletController::class, 'show'])->name('show');
            Route::post('/{manager}/payout', [WalletController::class, 'processPayout'])->name('payout');
        });

        // Commission rates management
        Route::resource('commission-rates', CommissionRateController::class);
        Route::post('/commission-rates/{commissionRate}/toggle', [CommissionRateController::class, 'toggleStatus'])->name('commission-rates.toggle');
        Route::post('/commission-rates/preview', [CommissionRateController::class, 'preview'])->name('commission-rates.preview');

        // Admin-only expense approval routes
        Route::post('/expenses/{expense}/approve', [ExpenseController::class, 'approve'])->name('expenses.approve');
        Route::post('/expenses/{expense}/reject', [ExpenseController::class, 'reject'])->name('expenses.reject');
        Route::get('/expenses/pending/approval', [ExpenseController::class, 'pending'])->name('expenses.pending');
    });

    // Sales routes - accessible to both managers and admins
    Route::get('/sales', [SalesController::class, 'index'])->name('sales.index');
    Route::get('/sales/{sale}', [SalesController::class, 'show'])->name('sales.show');

    // Receipt routes - accessible to both managers and admins
    Route::get('/receipts', [ReceiptController::class, 'index'])->name('receipts.index');
    Route::get('/receipts/{sale}', [ReceiptController::class, 'show'])->name('receipts.show');
    Route::get('/receipts/{sale}/download', [ReceiptController::class, 'download'])->name('receipts.download');

    // Manager routes - accessible to both managers and admins
    Route::get('/products/catalog', [ProductController::class, 'catalog'])->name('products.catalog');
    Route::get('/products/{product}', [ProductController::class, 'show'])->name('products.show');
    
    // Cart routes
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/items', [CartController::class, 'addItem'])->name('cart.add-item');
    Route::put('/cart/items/{productId}', [CartController::class, 'updateItem'])->name('cart.update-item');
    Route::delete('/cart/items/{productId}', [CartController::class, 'removeItem'])->name('cart.remove-item');
    Route::post('/cart/sync', [CartController::class, 'sync'])->name('cart.sync');
    Route::post('/cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');

    // Wallet route for managers
    Route::get('/wallet', [WalletController::class, 'index'])->name('wallet.index')->middleware('ensure.wallet');

    // Expense management routes - accessible to both managers and admins
    Route::resource('expenses', ExpenseController::class);
    Route::get('/expenses/{expense}/receipt', [ExpenseController::class, 'downloadReceipt'])->name('expenses.receipt');
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
