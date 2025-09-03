<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
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
            $query = Product::where('is_active', true);

            // Add search functionality
            if ($request->search) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('brand', 'like', "%{$search}%")
                        ->orWhere('category', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            }

            // Add category filtering
            if ($request->category && $request->category !== 'all') {
                $query->where('category', $request->category);
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
            Log::info('Admin user detected, redirecting to admin dashboard', [
                'user_id' => $user->id,
                'user_role' => $user->role,
                'user_email' => $user->email
            ]);
            return redirect('/admin-dashboard');
        }

        return Inertia::render('dashboard', $data);
    }

    public function adminDashboard(Request $request)
    {
        $user = auth()->user();

        // Ensure only admins can access this route
        if (!$user || !$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        // Get comprehensive analytics data directly
        $analyticsController = new AnalyticsController();
        $analyticsResponse = $analyticsController->dashboard($request);
        
        // Check if the response is successful
        if ($analyticsResponse->getStatusCode() !== 200) {
            Log::error('Failed to get analytics data', [
                'status_code' => $analyticsResponse->getStatusCode(),
                'content' => $analyticsResponse->getContent()
            ]);
            
            // Return empty analytics data if there's an error
            $analyticsData = [
                'professional' => [
                    'kpi' => [
                        'totalSales' => ['value' => 0, 'change' => 0, 'changeType' => 'increase'],
                        'totalSalesReturn' => ['value' => 0, 'change' => 0, 'changeType' => 'decrease'],
                        'totalPurchase' => ['value' => 0, 'change' => 0, 'changeType' => 'increase'],
                        'totalPurchaseReturn' => ['value' => 0, 'change' => 0, 'changeType' => 'increase']
                    ],
                    'financial' => [
                        'profit' => ['value' => 0, 'change' => 0, 'changeType' => 'increase'],
                        'invoiceDue' => ['value' => 0, 'change' => 0, 'changeType' => 'increase'],
                        'totalExpenses' => ['value' => 0, 'change' => 0, 'changeType' => 'increase'],
                        'totalPaymentReturns' => ['value' => 0, 'change' => 0, 'changeType' => 'decrease']
                    ],
                    'recentOrders' => [],
                    'topCustomers' => [],
                    'categories' => ['categories' => [], 'totalCategories' => 0, 'totalProducts' => 0],
                    'orderStatistics' => [],
                    'lowStockAlerts' => []
                ]
            ];
        } else {
            $analyticsData = json_decode($analyticsResponse->getContent(), true);
        }

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
    }
}
