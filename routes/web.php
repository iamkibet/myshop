<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Admin routes
    Route::middleware(['can:isAdmin'])->group(function () {
        Route::resource('products', ProductController::class);
        Route::resource('users', UserController::class);

        // Analytics routes
        Route::get('/analytics/sales', [AnalyticsController::class, 'sales'])->name('analytics.sales');
        Route::get('/analytics/top-products', [AnalyticsController::class, 'topProducts'])->name('analytics.top-products');
    });

    // Manager routes
    Route::middleware(['can:isManager'])->group(function () {
        Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
        Route::post('/cart/items', [CartController::class, 'addItem'])->name('cart.add-item');
        Route::put('/cart/items/{productId}', [CartController::class, 'updateItem'])->name('cart.update-item');
        Route::delete('/cart/items/{productId}', [CartController::class, 'removeItem'])->name('cart.remove-item');
        Route::post('/cart/checkout', [CartController::class, 'checkout'])->name('cart.checkout');
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
