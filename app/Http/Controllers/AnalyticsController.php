<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Models\Wallet;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    /**
     * Get comprehensive analytics for admin dashboard
     */
    public function dashboard(Request $request): JsonResponse
    {
        try {
            $period = $request->get('period', 'month');
            $now = Carbon::now();

            // Set start date based on period
            switch ($period) {
                case 'day':
                    $startDate = $now->copy()->startOfDay();
                    break;
                case 'week':
                    $startDate = $now->copy()->startOfWeek();
                    break;
                case 'month':
                    $startDate = $now->copy()->startOfMonth();
                    break;
                case 'year':
                    $startDate = $now->copy()->startOfYear();
                    break;
                case 'lifetime':
                    $startDate = null; // No start date filter for lifetime
                    break;
                default:
                    $startDate = $now->copy()->startOfMonth();
            }

            // Sales Analytics
            $salesData = $this->getSalesAnalytics($startDate);

            // Inventory Analytics
            $inventoryData = $this->getInventoryAnalytics();

            // Top Entities
            $topEntities = $this->getTopEntities($startDate);

            // Profits
            $profitData = $this->getProfitAnalytics($startDate);

            // Notifications
            $notifications = $this->getNotifications();

            return response()->json([
                'sales' => $salesData,
                'inventory' => $inventoryData,
                'topEntities' => $topEntities,
                'profits' => $profitData,
                'notifications' => $notifications,
            ]);
        } catch (\Exception $e) {
            Log::error('Analytics dashboard error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Failed to load analytics data',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get sales analytics data
     */
    private function getSalesAnalytics($startDate): array
    {
        // Total sales for the period
        $query = Sale::query();
        if ($startDate) {
            $query->where('created_at', '>=', $startDate);
        }
        
        $totalSales = $query->sum('total_amount');
        $totalOrders = $query->count();
        $averageOrderValue = $totalOrders > 0 ? $totalSales / $totalOrders : 0;

        // Sales trends (last 30 days)
        $salesTrends = Sale::where('created_at', '>=', Carbon::now()->subDays(30))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'orders' => (int) $item->orders,
                    'revenue' => (float) $item->revenue,
                ];
            });

        // Best selling products for the period
        $bestSellingProductsQuery = SaleItem::with(['product']);
        if ($startDate) {
            $bestSellingProductsQuery->where('sale_items.created_at', '>=', $startDate);
        }
        
        $bestSellingProducts = $bestSellingProductsQuery
            ->selectRaw('product_id, SUM(quantity) as total_sold, SUM(total_price) as total_revenue')
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'product_name' => $item->product->name ?? 'Unknown',
                    'variant_info' => 'Standard', // No variant info available
                    'total_sold' => $item->total_sold,
                    'total_revenue' => $item->total_revenue,
                ];
            });

        // Sales by category for the period
        $salesByCategoryQuery = SaleItem::with(['product']);
        if ($startDate) {
            $salesByCategoryQuery->where('sale_items.created_at', '>=', $startDate);
        }
        
        $salesByCategory = $salesByCategoryQuery
            ->selectRaw('products.category, SUM(sale_items.quantity) as total_sold, SUM(sale_items.total_price) as total_revenue')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->groupBy('products.category')
            ->orderByDesc('total_revenue')
            ->get();

        // Sales by size - simplified since products table doesn't have variants
        $salesBySize = collect(); // Empty collection since size is no longer tracked

        // Sales by color - simplified since products table doesn't have variants  
        $salesByColor = collect(); // Empty collection since color is no longer tracked

        // Sales trends (last 30 days) - duplicate, removing this one

        return [
            'totalSales' => $totalSales,
            'totalOrders' => $totalOrders,
            'averageOrderValue' => round($averageOrderValue, 2),
            'bestSellingProducts' => $bestSellingProducts,
            'salesByCategory' => $salesByCategory,
            'salesBySize' => $salesBySize,
            'salesByColor' => $salesByColor,
            'salesTrends' => $salesTrends,
        ];
    }

    /**
     * Get inventory analytics data
     */
    private function getInventoryAnalytics(): array
    {
        $lowStockThreshold = 5; // Configurable

        // Low stock products
        $lowStockProducts = Product::where('quantity', '<=', $lowStockThreshold)
            ->where('quantity', '>', 0)
            ->where('is_active', true)
            ->get()
            ->map(function ($product) {
                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name ?? 'Unknown',
                    'variant_info' => 'Standard', // No variant info available
                    'current_stock' => $product->quantity,
                    'low_stock_threshold' => $product->low_stock_threshold,
                ];
            });

        // Out of stock products
        $outOfStockProducts = Product::where('quantity', 0)
            ->where('is_active', true)
            ->get()
            ->map(function ($product) {
                return [
                    'product_id' => $product->id,
                    'product_name' => $product->name ?? 'Unknown',
                    'variant_info' => 'Standard', // No variant info available
                    'last_restocked' => $product->updated_at,
                ];
            });

        // Inventory turnover rate (simplified calculation)
        $totalInventoryValue = Product::sum(DB::raw('quantity * cost_price'));
        $totalSalesValue = SaleItem::sum('total_price');
        $inventoryTurnoverRate = $totalInventoryValue > 0 ? $totalSalesValue / $totalInventoryValue : 0;

        // Stock value calculations
        $totalCostValue = Product::sum(DB::raw('quantity * cost_price'));
        $totalRetailValue = Product::sum(DB::raw('quantity * selling_price'));
        $totalProducts = Product::where('is_active', true)->count();

        return [
            'lowStockProducts' => $lowStockProducts,
            'outOfStockProducts' => $outOfStockProducts,
            'inventoryTurnoverRate' => round($inventoryTurnoverRate, 2),
            'totalCostValue' => $totalCostValue,
            'totalRetailValue' => $totalRetailValue,
            'totalProducts' => $totalProducts,
            'lowStockThreshold' => $lowStockThreshold,
        ];
    }

    /**
     * Get top entities data
     */
    private function getTopEntities($startDate): array
    {
        // Top performing managers
        $topManagersQuery = Sale::with(['manager']);
        if ($startDate) {
            $topManagersQuery->where('created_at', '>=', $startDate);
        }
        
        $topManagers = $topManagersQuery
            ->selectRaw('manager_id, COUNT(*) as sales_count, SUM(total_amount) as total_revenue')
            ->groupBy('manager_id')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(function ($sale) {
                return [
                    'manager_name' => $sale->manager->name ?? 'Unknown',
                    'manager_id' => $sale->manager_id,
                    'sales_count' => $sale->sales_count,
                    'total_revenue' => $sale->total_revenue,
                ];
            });

        // Top 5 best-selling products for the period
        $topProductsQuery = SaleItem::with(['product']);
        if ($startDate) {
            $topProductsQuery->where('sale_items.created_at', '>=', $startDate);
        }
        
        $topProducts = $topProductsQuery
            ->selectRaw('product_id, SUM(quantity) as total_sold, SUM(quantity * unit_price) as total_revenue')
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'product_name' => $item->product->name ?? 'Unknown',
                    'variant_info' => 'Standard', // No variant info available
                    'total_sold' => $item->total_sold,
                    'total_revenue' => $item->total_revenue,
                ];
            });

        // Top product categories for the period
        $topCategoriesQuery = SaleItem::with(['product']);
        if ($startDate) {
            $topCategoriesQuery->where('sale_items.created_at', '>=', $startDate);
        }
        
        $topCategories = $topCategoriesQuery
            ->selectRaw('products.category, SUM(sale_items.quantity) as total_sold, SUM(sale_items.quantity * sale_items.unit_price) as total_revenue')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->groupBy('products.category')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get();

        return [
            'topManagers' => $topManagers,
            'topProducts' => $topProducts,
            'topCategories' => $topCategories,
        ];
    }

    /**
     * Get profit analytics data
     */
    private function getProfitAnalytics($startDate): array
    {
        // Calculate gross profits per sale item for the period
        $profitDataQuery = SaleItem::with(['product'])
            ->selectRaw('
                sale_items.*,
                (sale_items.unit_price - products.cost_price) * sale_items.quantity as gross_profit
            ')
            ->join('products', 'sale_items.product_id', '=', 'products.id');
        
        if ($startDate) {
            $profitDataQuery->where('sale_items.created_at', '>=', $startDate);
        }
        
        $profitData = $profitDataQuery->get();

        $totalGrossProfit = $profitData->sum('gross_profit');
        $totalRevenue = $profitData->sum('total_price');
        
        // Calculate expenses for the same period
        $expensesQuery = \App\Models\Expense::where('is_approved', true);
        if ($startDate) {
            $expensesQuery->where('created_at', '>=', $startDate);
        }
        $totalExpenses = $expensesQuery->sum('amount');
        
        // Calculate net profit (gross profit - expenses)
        $totalNetProfit = $totalGrossProfit - $totalExpenses;
        $profitMargin = $totalRevenue > 0 ? ($totalNetProfit / $totalRevenue) * 100 : 0;

        // Profit trends (last 30 days) with expenses
        $profitTrends = SaleItem::with(['product'])
            ->selectRaw('
                DATE(sale_items.created_at) as date,
                SUM((sale_items.unit_price - products.cost_price) * sale_items.quantity) as daily_gross_profit,
                SUM(sale_items.total_price) as daily_revenue
            ')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sale_items.created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                // Get expenses for this specific date
                $dailyExpenses = \App\Models\Expense::where('is_approved', true)
                    ->whereDate('created_at', $item->date)
                    ->sum('amount');
                
                return [
                    'date' => $item->date,
                    'daily_gross_profit' => (float) $item->daily_gross_profit,
                    'daily_net_profit' => (float) ($item->daily_gross_profit - $dailyExpenses),
                    'daily_revenue' => (float) $item->daily_revenue,
                    'daily_expenses' => (float) $dailyExpenses,
                ];
            });

        return [
            'totalGrossProfit' => round($totalGrossProfit, 2),
            'totalNetProfit' => round($totalNetProfit, 2),
            'totalRevenue' => round($totalRevenue, 2),
            'totalExpenses' => round($totalExpenses, 2),
            'profitMargin' => round($profitMargin, 2),
            'profitTrends' => $profitTrends,
        ];
    }

    /**
     * Get notifications data
     */
    private function getNotifications(): array
    {
        // Use the NotificationService to get recent notifications
        $notificationService = new \App\Services\NotificationService();
        $recentNotifications = $notificationService->getRecentNotifications(10);

        $notifications = [];
        foreach ($recentNotifications as $notification) {
            $notifications[] = [
                'id' => $notification->id,
                'type' => $notification->type,
                'title' => $notification->title,
                'message' => $notification->message,
                'icon' => $notification->icon,
                'action_data' => $notification->action_data,
                'category' => $notification->category,
                'is_read' => $notification->is_read,
                'created_at' => $notification->created_at,
            ];
        }

        return $notifications;
    }

    /**
     * Get variant information as string
     */
    private function getVariantInfo($variant): string
    {
        $parts = [];

        if ($variant->color) {
            $parts[] = $variant->color;
        }

        if ($variant->size) {
            $parts[] = $variant->size;
        }

        return !empty($parts) ? implode(' - ', $parts) : 'Standard';
    }

    /**
     * Calculate recommended restock quantity based on historical sales
     */
    private function getRecommendedRestockQuantity($productId): int
    {
        // Get sales data for the last 30 days
        $recentSales = SaleItem::where('product_id', $productId)
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->sum('quantity');

        // Get average daily sales
        $averageDailySales = $recentSales / 30;

        // Recommend 2 weeks of inventory based on average daily sales
        $recommendedQuantity = max(10, round($averageDailySales * 14));

        return $recommendedQuantity;
    }

    /**
     * Get sales analytics for specific time period
     */
    public function salesAnalytics(Request $request): JsonResponse
    {
        $period = $request->get('period', 'month');
        $startDate = $request->get('start_date');
        $endDate = $request->get('end_date');

        $query = Sale::query();

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [$startDate, $endDate]);
        } else {
            switch ($period) {
                case 'day':
                    $query->where('created_at', '>=', Carbon::now()->startOfDay());
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
        }

        $sales = $query->get();

        return response()->json([
            'total_sales' => $sales->sum('total_amount'),
            'total_orders' => $sales->count(),
            'average_order_value' => $sales->count() > 0 ? $sales->sum('total_amount') / $sales->count() : 0,
            'sales_data' => $sales,
        ]);
    }

    /**
     * Get inventory analytics
     */
    public function inventoryAnalytics(): JsonResponse
    {
        $lowStockThreshold = 5;

        $lowStockProducts = Product::where('quantity', '<=', $lowStockThreshold)
            ->where('quantity', '>', 0)
            ->where('is_active', true)
            ->get();

        $outOfStockProducts = Product::where('quantity', 0)
            ->where('is_active', true)
            ->get();

        $totalCostValue = Product::sum(DB::raw('quantity * cost_price'));
        $totalRetailValue = Product::sum(DB::raw('quantity * selling_price'));

        return response()->json([
            'low_stock_products' => $lowStockProducts,
            'out_of_stock_products' => $outOfStockProducts,
            'total_cost_value' => $totalCostValue,
            'total_retail_value' => $totalRetailValue,
            'low_stock_threshold' => $lowStockThreshold,
        ]);
    }

    /**
     * Get restock recommendations for a specific product
     */
    public function getRestockRecommendations(Request $request): JsonResponse
    {
        $productId = $request->get('product_id');

        if (!$productId) {
            return response()->json(['error' => 'Product ID is required'], 400);
        }

        $product = Product::find($productId);

        if (!$product) {
            return response()->json(['error' => 'Product not found'], 404);
        }

        $recommendedQuantity = $this->getRecommendedRestockQuantity($product->id);

        $recommendations = [
            [
                'product_id' => $product->id,
                'variant_info' => 'Standard', // No variant info available
                'current_quantity' => $product->quantity,
                'recommended_quantity' => $recommendedQuantity,
                'cost_price' => $product->cost_price,
                'selling_price' => $product->selling_price,
                'last_restocked' => $product->updated_at,
            ]
        ];

        return response()->json([
            'product_id' => $productId,
            'product_name' => $product->name ?? 'Unknown',
            'recommendations' => $recommendations,
        ]);
    }
}
