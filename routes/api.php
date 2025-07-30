<?php

use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Admin API routes
Route::middleware(['auth:sanctum', 'can:isAdmin'])->group(function () {
    // Products API
    Route::apiResource('products', ProductController::class);
    
    // Users API
    Route::apiResource('users', UserController::class);
    
    // Analytics API
    Route::get('/analytics/sales', [AnalyticsController::class, 'sales']);
    Route::get('/analytics/top-products', [AnalyticsController::class, 'topProducts']);
});

// Manager API routes
Route::middleware(['auth:sanctum', 'can:isManager'])->group(function () {
    // Cart API
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart/items', [CartController::class, 'addItem']);
    Route::put('/cart/items/{productId}', [CartController::class, 'updateItem']);
    Route::delete('/cart/items/{productId}', [CartController::class, 'removeItem']);
    Route::post('/cart/checkout', [CartController::class, 'checkout'])->middleware('throttle:10,1');
}); 