<?php

namespace App\Http\Controllers;

use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalesController extends Controller
{
    /**
     * Display a listing of sales
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();

        // Build query
        $query = Sale::with(['manager', 'saleItems.productVariant.product']);

        // Filter by manager (for managers, only show their sales)
        if (!$isAdmin) {
            $query->where('manager_id', $user->id);
        } elseif ($request->get('status_filter') === 'me') {
            $query->where('manager_id', $user->id);
        }

        // Date filters
        $dateFilter = $request->get('date_filter', 'all');
        switch ($dateFilter) {
            case 'today':
                $query->whereDate('created_at', today());
                break;
            case 'week':
                $query->where('created_at', '>=', Carbon::now()->startOfWeek());
                break;
            case 'month':
                $query->where('created_at', '>=', Carbon::now()->startOfMonth());
                break;
        }

        // Search functionality
        if ($request->get('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhereHas('saleItems.productVariant.product', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        // Get sales with pagination
        $sales = $query->orderByDesc('created_at')->paginate(10);

        // Calculate statistics
        $statsQuery = Sale::query();
        if (!$isAdmin) {
            $statsQuery->where('manager_id', $user->id);
        }

        $totalSales = $statsQuery->sum('total_amount');
        $totalOrders = $statsQuery->count();
        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        // Today's sales
        $todaySales = $statsQuery->whereDate('created_at', today())->sum('total_amount');

        // This week's sales
        $thisWeekSales = $statsQuery->where('created_at', '>=', Carbon::now()->startOfWeek())->sum('total_amount');

        // This month's sales
        $thisMonthSales = $statsQuery->where('created_at', '>=', Carbon::now()->startOfMonth())->sum('total_amount');

        $stats = [
            'totalSales' => $totalSales,
            'totalOrders' => $totalOrders,
            'averageOrderValue' => round($averageOrderValue, 2),
            'todaySales' => $todaySales,
            'thisWeekSales' => $thisWeekSales,
            'thisMonthSales' => $thisMonthSales,
        ];

        return Inertia::render('Sales/Index', [
            'sales' => $sales,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the specified sale
     */
    public function show(Sale $sale)
    {
        $user = auth()->user();

        // Check if user can view this sale
        if (!$user->isAdmin() && $sale->manager_id !== $user->id) {
            abort(403, 'Unauthorized access.');
        }

        $sale->load(['manager', 'saleItems.productVariant.product']);

        return Inertia::render('Sales/Show', [
            'sale' => $sale,
        ]);
    }

    /**
     * Get sales statistics for a specific manager (for admin)
     */
    public function managerStats($managerId)
    {
        $user = auth()->user();

        if (!$user->isAdmin()) {
            abort(403, 'Unauthorized access.');
        }

        $manager = \App\Models\User::findOrFail($managerId);

        $sales = Sale::where('manager_id', $managerId)
            ->with(['saleItems.productVariant.product'])
            ->orderByDesc('created_at')
            ->paginate(10);

        $totalSales = Sale::where('manager_id', $managerId)->sum('total_amount');
        $totalOrders = Sale::where('manager_id', $managerId)->count();
        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        $todaySales = Sale::where('manager_id', $managerId)
            ->whereDate('created_at', today())
            ->sum('total_amount');

        $thisWeekSales = Sale::where('manager_id', $managerId)
            ->where('created_at', '>=', Carbon::now()->startOfWeek())
            ->sum('total_amount');

        $thisMonthSales = Sale::where('manager_id', $managerId)
            ->where('created_at', '>=', Carbon::now()->startOfMonth())
            ->sum('total_amount');

        $stats = [
            'manager' => [
                'id' => $manager->id,
                'name' => $manager->name,
                'email' => $manager->email,
            ],
            'totalSales' => $totalSales,
            'totalOrders' => $totalOrders,
            'averageOrderValue' => round($averageOrderValue, 2),
            'todaySales' => $todaySales,
            'thisWeekSales' => $thisWeekSales,
            'thisMonthSales' => $thisMonthSales,
        ];

        return Inertia::render('Sales/ManagerStats', [
            'sales' => $sales,
            'stats' => $stats,
        ]);
    }
}
