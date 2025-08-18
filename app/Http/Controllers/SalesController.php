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
        $query = Sale::with(['manager', 'saleItems.product']);

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
            case 'year':
                $query->where('created_at', '>=', Carbon::now()->startOfYear());
                break;
        }

        // Search functionality
        if ($request->get('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('id', 'like', "%{$search}%")
                    ->orWhereHas('saleItems.product', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    });
            });
        }

        // Get sales with pagination
        $sales = $query->orderByDesc('created_at')->paginate(10);

        // Calculate ALL-TIME statistics (not filtered by date)
        $allTimeStatsQuery = Sale::query();
        if (!$isAdmin) {
            $allTimeStatsQuery->where('manager_id', $user->id);
        }

        // All-time totals (these should always show complete data)
        $totalSales = $allTimeStatsQuery->sum('total_amount');
        $totalOrders = $allTimeStatsQuery->count();
        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        // Calculate period-specific stats for comparison
        $periodStatsQuery = Sale::query();
        if (!$isAdmin) {
            $periodStatsQuery->where('manager_id', $user->id);
        }

        // Apply the date filter for period-specific stats
        switch ($dateFilter) {
            case 'today':
                $periodStatsQuery->whereDate('created_at', today());
                break;
            case 'week':
                $periodStatsQuery->where('created_at', '>=', Carbon::now()->startOfWeek());
                break;
            case 'month':
                $periodStatsQuery->where('created_at', '>=', Carbon::now()->startOfMonth());
                break;
            case 'year':
                $periodStatsQuery->where('created_at', '>=', Carbon::now()->startOfYear());
                break;
            // 'all' case - no date filter applied
        }

        $periodSales = $periodStatsQuery->sum('total_amount');
        $periodOrders = $periodStatsQuery->count();

        // Today's sales (always current day regardless of filter)
        $todaySalesQuery = Sale::query();
        if (!$isAdmin) {
            $todaySalesQuery->where('manager_id', $user->id);
        }
        $todaySales = $todaySalesQuery->whereDate('created_at', today())->sum('total_amount');

        // This week's sales (always current week regardless of filter)
        $thisWeekSalesQuery = Sale::query();
        if (!$isAdmin) {
            $thisWeekSalesQuery->where('manager_id', $user->id);
        }
        $thisWeekSales = $thisWeekSalesQuery->where('created_at', '>=', Carbon::now()->startOfWeek())->sum('total_amount');

        // This month's sales (always current month regardless of filter)
        $thisMonthSalesQuery = Sale::query();
        if (!$isAdmin) {
            $thisMonthSalesQuery->where('manager_id', $user->id);
        }
        $thisMonthSales = $thisMonthSalesQuery->where('created_at', '>=', Carbon::now()->startOfMonth())->sum('total_amount');

        $stats = [
            'totalSales' => $totalSales, // All-time total
            'totalOrders' => $totalOrders, // All-time total
            'averageOrderValue' => round($averageOrderValue, 2), // All-time average
            'periodSales' => $periodSales, // Period-specific total
            'periodOrders' => $periodOrders, // Period-specific total
            'todaySales' => $todaySales,
            'thisWeekSales' => $thisWeekSales,
            'thisMonthSales' => $thisMonthSales,
            'currentFilter' => $dateFilter, // Track current filter
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

        $sale->load(['manager', 'saleItems.product']);

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
            ->with(['saleItems.product'])
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
