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
use Illuminate\Support\Facades\Log;
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

            // Professional Dashboard Data
            $period = $request->get('period', '1M');
            $timePeriod = $request->get('timePeriod', 'Last 7 Days');
            $professionalData = $this->getProfessionalDashboardData($startDate, $period, $timePeriod);

            return response()->json([
                'sales' => $salesData,
                'inventory' => $inventoryData,
                'topEntities' => $topEntities,
                'profits' => $profitData,
                'notifications' => $notifications,
                'professional' => $professionalData,
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

    /**
     * Get professional dashboard data
     */
    private function getProfessionalDashboardData($startDate, $period = '1M', $timePeriod = 'Last 7 Days'): array
    {
        // KPI Cards Data
        $kpiData = $this->getKPIData($startDate);
        
        // Financial Overview Data
        $financialData = $this->getFinancialOverviewData($startDate);
        
        // Recent Orders
        $recentSales = $this->getRecentSales();
        
        // Top Products (all-time, not filtered by date)
        $topProducts = $this->getTopProducts(null);
        
        // Categories Data
        $categoriesData = $this->getCategoriesData($startDate);
        
        // Order Statistics (Heatmap data) - uses its own time period logic
        $orderStatistics = $this->getOrderStatistics($timePeriod);
        
        // Low Stock Alerts
        $lowStockAlerts = $this->getLowStockAlerts();
        
        // Out of Stock Alerts
        $outOfStockAlerts = $this->getOutOfStockAlerts();
        
        // Sales & Purchase Chart Data
        $salesPurchaseChartData = $this->getSalesPurchaseChartData($period);
        $chartTotals = $this->getChartTotals($period);

        return [
            'kpi' => $kpiData,
            'financial' => $financialData,
            'recentSales' => $recentSales,
            'topProducts' => $topProducts,
            'categories' => $categoriesData,
            'orderStatistics' => $orderStatistics,
            'lowStockAlerts' => $lowStockAlerts,
            'outOfStockAlerts' => $outOfStockAlerts,
            'salesPurchaseChartData' => $salesPurchaseChartData,
            'chartTotals' => $chartTotals,
        ];
    }

    /**
     * Get KPI data for the main cards
     */
    private function getKPIData($startDate): array
    {
        // Get all sales data
        $totalSales = Sale::sum('total_amount');
        $totalOrders = Sale::count();

        // Calculate Cost of Goods Sold (COGS)
        $totalCOGS = 0;
        SaleItem::with('product')->get()->each(function($item) use (&$totalCOGS) {
            $cost = $item->product->cost_price ?? 0;
            $totalCOGS += $cost * $item->quantity;
        });

        // Calculate previous period for comparison (last 30 days vs previous 30 days)
        $now = Carbon::now();
        $last30Days = Sale::where('created_at', '>=', $now->copy()->subDays(30))->sum('total_amount');
        $previous30Days = Sale::whereBetween('created_at', [
            $now->copy()->subDays(60), 
            $now->copy()->subDays(30)
        ])->sum('total_amount');
        
        $salesChange = $previous30Days > 0 ? (($last30Days - $previous30Days) / $previous30Days) * 100 : 22;

        // For display, use total sales if no specific period is requested
        $displaySales = $totalSales;

        return [
            'totalSales' => [
                'value' => $displaySales,
                'change' => round($salesChange, 1),
                'changeType' => $salesChange >= 0 ? 'increase' : 'decrease'
            ],
            'totalOrders' => [
                'value' => Sale::count(), // Total number of sales transactions
                'change' => 22,
                'changeType' => 'increase'
            ],
            'totalPurchase' => [
                'value' => $totalCOGS, // Cost of Goods Sold
                'change' => 22,
                'changeType' => 'increase'
            ],
            'totalInventoryValue' => [
                'value' => $this->getTotalInventoryValue(), // Total value of current stock
                'change' => 22,
                'changeType' => 'increase'
            ]
        ];
    }

    /**
     * Get total inventory value
     */
    private function getTotalInventoryValue(): float
    {
        $totalInventoryValue = 0;
        \App\Models\Product::get()->each(function($product) use (&$totalInventoryValue) {
            $cost = $product->cost_price ?? 0;
            $stock = $product->quantity ?? 0;
            $totalInventoryValue += $cost * $stock;
        });
        return $totalInventoryValue;
    }

    /**
     * Get sales and purchase chart data for different time periods
     */
    private function getSalesPurchaseChartData($period = '1M'): array
    {
        $now = Carbon::now();
        $startDate = $this->getStartDateForPeriod($period, $now);
        
        // Get sales data by date
        $salesData = Sale::selectRaw('
            DATE(created_at) as date,
            SUM(total_amount) as sales
        ')
        ->where('created_at', '>=', $startDate)
        ->groupBy(DB::raw('DATE(created_at)'))
        ->orderBy('date')
        ->get();

        // Get COGS data by date
        $cogsData = SaleItem::with('product')
            ->selectRaw('
                DATE(sale_items.created_at) as date,
                SUM(products.cost_price * sale_items.quantity) as purchase
            ')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sale_items.created_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(sale_items.created_at)'))
            ->orderBy('date')
            ->get();

        // Generate chart data based on period
        $chartData = $this->generateChartDataForPeriod($period, $startDate, $now, $salesData, $cogsData);

        return $chartData;
    }

    /**
     * Get start date based on period
     */
    private function getStartDateForPeriod($period, $now): Carbon
    {
        switch ($period) {
            case '1D':
                return $now->copy()->subDay();
            case '1W':
                return $now->copy()->subWeek();
            case '1M':
                return $now->copy()->subMonth();
            case '3M':
                return $now->copy()->subMonths(3);
            case '6M':
                return $now->copy()->subMonths(6);
            case '1Y':
                return $now->copy()->subYear();
            default:
                return $now->copy()->subMonth();
        }
    }

    /**
     * Generate date range for the period
     */
    private function generateDateRange($startDate, $endDate): array
    {
        $dates = [];
        $current = $startDate->copy();
        
        while ($current->lte($endDate)) {
            $dates[] = $current->copy();
            $current->addDay();
        }
        
        return $dates;
    }

    /**
     * Generate chart data intelligently based on period to avoid overlapping
     */
    private function generateChartDataForPeriod($period, $startDate, $endDate, $salesData, $cogsData): array
    {
        $chartData = [];
        
        switch ($period) {
            case '1D':
                // For 1 day, show daily data (since we don't have hourly sales data)
                $allDates = $this->generateDateRange($startDate, $endDate);
                foreach ($allDates as $date) {
                    $dateStr = $date->format('Y-m-d');
                    $sales = $salesData->where('date', $dateStr)->first();
                    $purchase = $cogsData->where('date', $dateStr)->first();
                    
                    $chartData[] = [
                        'time' => $date->format('M j'),
                        'sales' => $sales ? (float)$sales->sales : 0,
                        'purchase' => $purchase ? (float)$purchase->purchase : 0
                    ];
                }
                break;
                
            case '1W':
                // For 1 week, show daily data
                $allDates = $this->generateDateRange($startDate, $endDate);
                foreach ($allDates as $date) {
                    $dateStr = $date->format('Y-m-d');
                    $sales = $salesData->where('date', $dateStr)->first();
                    $purchase = $cogsData->where('date', $dateStr)->first();
                    
                    $chartData[] = [
                        'time' => $date->format('M j'),
                        'sales' => $sales ? (float)$sales->sales : 0,
                        'purchase' => $purchase ? (float)$purchase->purchase : 0
                    ];
                }
                break;
                
            case '1M':
                // For 1 month, show weekly data to avoid crowding
                $current = $startDate->copy()->startOfWeek();
                while ($current->lte($endDate)) {
                    $weekEnd = $current->copy()->endOfWeek();
                    $weekSales = $salesData->whereBetween('date', [$current->format('Y-m-d'), $weekEnd->format('Y-m-d')])->sum('sales');
                    $weekPurchase = $cogsData->whereBetween('date', [$current->format('Y-m-d'), $weekEnd->format('Y-m-d')])->sum('purchase');
                    
                    $chartData[] = [
                        'time' => $current->format('M j'),
                        'sales' => (float)$weekSales,
                        'purchase' => (float)$weekPurchase
                    ];
                    $current->addWeek();
                }
                break;
                
            case '3M':
            case '6M':
            case '1Y':
                // For longer periods, show weekly data
                $current = $startDate->copy()->startOfWeek();
                while ($current->lte($endDate)) {
                    $weekEnd = $current->copy()->endOfWeek();
                    $weekSales = $salesData->whereBetween('date', [$current->format('Y-m-d'), $weekEnd->format('Y-m-d')])->sum('sales');
                    $weekPurchase = $cogsData->whereBetween('date', [$current->format('Y-m-d'), $weekEnd->format('Y-m-d')])->sum('purchase');
                    
                    $chartData[] = [
                        'time' => $current->format('M j'),
                        'sales' => (float)$weekSales,
                        'purchase' => (float)$weekPurchase
                    ];
                    $current->addWeek();
                }
                break;
                
            default:
                // Default to daily data
                $allDates = $this->generateDateRange($startDate, $endDate);
                foreach ($allDates as $date) {
                    $dateStr = $date->format('Y-m-d');
                    $sales = $salesData->where('date', $dateStr)->first();
                    $purchase = $cogsData->where('date', $dateStr)->first();
                    
                    $chartData[] = [
                        'time' => $date->format('M j'),
                        'sales' => $sales ? (float)$sales->sales : 0,
                        'purchase' => $purchase ? (float)$purchase->purchase : 0
                    ];
                }
        }
        
        return $chartData;
    }

    /**
     * Format date for chart display based on period
     */
    private function formatDateForChart($date, $period): string
    {
        switch ($period) {
            case '1D':
                return $date->format('H:i'); // Hour:Minute
            case '1W':
                return $date->format('M j'); // Month Day
            case '1M':
                return $date->format('M j'); // Month Day
            case '3M':
            case '6M':
            case '1Y':
                return $date->format('M j'); // Month Day
            default:
                return $date->format('M j');
        }
    }

    /**
     * Get chart totals for the selected period
     */
    private function getChartTotals($period): array
    {
        $now = Carbon::now();
        $startDate = $this->getStartDateForPeriod($period, $now);
        
        // Get total sales for the period
        $totalSales = Sale::where('created_at', '>=', $startDate)->sum('total_amount');
        
        // Get total COGS for the period
        $totalCOGS = SaleItem::with('product')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->where('sale_items.created_at', '>=', $startDate)
            ->sum(DB::raw('products.cost_price * sale_items.quantity'));

        return [
            'totalSales' => $totalSales,
            'totalPurchase' => $totalCOGS
        ];
    }

    /**
     * Get financial overview data
     */
    private function getFinancialOverviewData($startDate): array
    {
        // Get total sales (not filtered by date for overall profit calculation)
        $totalSales = Sale::sum('total_amount');
        
        // Calculate Cost of Goods Sold (COGS)
        $totalCOGS = 0;
        SaleItem::with('product')->get()->each(function($item) use (&$totalCOGS) {
            $cost = $item->product->cost_price ?? 0;
            $totalCOGS += $cost * $item->quantity;
        });
        
        // Calculate Gross Profit (Sales - COGS)
        $grossProfit = $totalSales - $totalCOGS;
        
        // Calculate Net Profit (Gross Profit - Expenses)
        $totalExpenses = \App\Models\Expense::where('status', 'approved')->sum('amount');
        $netProfit = $grossProfit - $totalExpenses;

        // Calculate changes from previous month
        $previousMonth = Carbon::now()->subMonth();
        $previousSales = Sale::whereMonth('created_at', $previousMonth->month)
            ->whereYear('created_at', $previousMonth->year)
            ->sum('total_amount');
        $previousExpenses = \App\Models\Expense::where('status', 'approved')
            ->whereMonth('expense_date', $previousMonth->month)
            ->whereYear('expense_date', $previousMonth->year)
            ->sum('amount');
        $previousNetProfit = $previousSales - $previousExpenses;

        // Calculate percentage changes
        $netProfitChange = 0;
        if ($previousNetProfit != 0) {
            $netProfitChange = (($netProfit - $previousNetProfit) / abs($previousNetProfit)) * 100;
        } else if ($netProfit > 0) {
            $netProfitChange = 100; // New profit from zero
        }

        $expenseChange = 0;
        if ($previousExpenses > 0) {
            $expenseChange = (($totalExpenses - $previousExpenses) / $previousExpenses) * 100;
        } else if ($totalExpenses > 0) {
            $expenseChange = 100; // New expenses from zero
        }

        return [
            'grossProfit' => [
                'value' => $grossProfit,
                'change' => 0, // No previous month data for COGS
                'changeType' => 'increase'
            ],
            'netProfit' => [
                'value' => $netProfit,
                'change' => round($netProfitChange, 1),
                'changeType' => $netProfitChange >= 0 ? 'increase' : 'decrease'
            ],
            'invoiceDue' => [
                'value' => $totalSales * 0.1, // 10% of sales as due
                'change' => 35,
                'changeType' => 'increase'
            ],
            'totalExpenses' => [
                'value' => $totalExpenses,
                'change' => round($expenseChange, 1),
                'changeType' => $expenseChange >= 0 ? 'increase' : 'decrease'
            ]
        ];
    }

    /**
     * Get recent orders
     */
    private function getRecentSales(): array
    {
        try {
                    return Sale::with(['manager', 'saleItems.product'])
            ->latest()
            ->limit(4)
            ->get()
                ->map(function ($sale) {
                    return [
                        'id' => $sale->id,
                        'date' => $sale->created_at->format('d M Y'),
                        'customer' => [
                            'name' => $sale->manager ? $sale->manager->name : 'Guest',
                            'initials' => $sale->manager ? $this->getInitials($sale->manager->name) : 'G',
                            'id' => $sale->manager ? $sale->manager->id : null,
                        ],
                        'amount' => $sale->total_amount,
                        'status' => 'completed',
                        'items_count' => $sale->saleItems->count(),
                        'items' => $sale->saleItems->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'product_name' => $item->product->name ?? 'Unknown Product',
                                'quantity' => $item->quantity,
                                'unit_price' => $item->unit_price,
                                'total_price' => $item->total_price,
                            ];
                        })->toArray(),
                        'created_at' => $sale->created_at,
                        'updated_at' => $sale->updated_at,
                    ];
                })->toArray();
        } catch (\Exception $e) {
            Log::error('Error getting recent sales: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get initials from name
     */
    private function getInitials($name): string
    {
        $words = explode(' ', $name);
        $initials = '';
        foreach ($words as $word) {
            if (!empty($word)) {
                $initials .= strtoupper($word[0]);
            }
        }
        return substr($initials, 0, 2);
    }

    /**
     * Get top products
     */
    private function getTopProducts($startDate): array
    {
        try {
            $query = SaleItem::with('product');
            if ($startDate) {
                $query->whereHas('sale', function($q) use ($startDate) {
                    $q->where('created_at', '>=', $startDate);
                });
            }

            return $query->selectRaw('product_id, SUM(quantity) as total_quantity, SUM(total_price) as total_revenue')
                ->groupBy('product_id')
                ->orderByDesc('total_quantity')
                ->limit(5)
                ->get()
                ->map(function ($saleItem) {
                    return [
                        'id' => $saleItem->product_id,
                        'name' => $saleItem->product->name ?? 'Unknown Product',
                        'initials' => $saleItem->product ? strtoupper(substr($saleItem->product->name, 0, 1)) : '?',
                        'sku' => $saleItem->product->sku ?? 'N/A',
                        'total_quantity' => $saleItem->total_quantity,
                        'total_revenue' => $saleItem->total_revenue,
                    ];
                })->toArray();
        } catch (\Exception $e) {
            Log::error('Error getting top products: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Get categories data for donut chart
     */
    private function getCategoriesData($startDate): array
    {
        try {
            // Get categories from products that have been sold
            $categories = \App\Models\Product::selectRaw('category, COUNT(*) as product_count')
                ->whereIn('id', function($query) use ($startDate) {
                    $query->select('product_id')
                        ->from('sale_items');
                    if ($startDate) {
                        $query->where('created_at', '>=', $startDate);
                    }
                })
                ->whereNotNull('category')
                ->where('category', '!=', '')
                ->groupBy('category')
                ->orderByDesc('product_count')
                ->limit(3)
                ->get();

            // If no categories from sales, get from all products
            if ($categories->isEmpty()) {
                $categories = \App\Models\Product::selectRaw('category, COUNT(*) as product_count')
                    ->whereNotNull('category')
                    ->where('category', '!=', '')
                    ->groupBy('category')
                    ->orderByDesc('product_count')
                    ->limit(3)
                    ->get();
            }

            $totalCategories = \App\Models\Product::distinct('category')->count();
            $totalProducts = \App\Models\Product::count();

            return [
                'categories' => $categories->map(function ($category) {
                    return [
                        'name' => $category->category ?? 'Uncategorized',
                        'sales' => $category->product_count,
                        'percentage' => 0 // Will be calculated in frontend
                    ];
                })->toArray(),
                'totalCategories' => $totalCategories,
                'totalProducts' => $totalProducts
            ];
        } catch (\Exception $e) {
            Log::error('Error getting categories data: ' . $e->getMessage());
            return [
                'categories' => [],
                'totalCategories' => 0,
                'totalProducts' => 0
            ];
        }
    }

    /**
     * Get order statistics for heatmap
     */
    private function getOrderStatistics($timePeriod = 'Last 7 Days'): array
    {
        try {
            // Determine date range based on time period
            $startDate = match($timePeriod) {
                'Last 7 Days' => now()->subDays(7),
                'Last 30 Days' => now()->subDays(30),
                'Last 90 Days' => now()->subDays(90),
                'All Time' => null, // No date filter for all time
                default => now()->subDays(7)
            };

            $salesQuery = Sale::with('saleItems')
                ->select('id', 'created_at', 'total_amount');
            
            // Only apply date filter if not "All Time"
            if ($startDate !== null) {
                $salesQuery->where('created_at', '>=', $startDate);
            }
            
            $sales = $salesQuery->get();

            // Initialize data structure - match the image design
            $data = [];
            $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            $hours = ['8 Am', '10 Am', '12 Am', '14 Pm', '16 Pm', '18 Pm', '20 Pm', '22 Pm'];
            
            // Create a matrix to count orders by day and hour
            $orderMatrix = [];
            foreach ($days as $day) {
                $orderMatrix[$day] = [];
                foreach ($hours as $hour) {
                    $orderMatrix[$day][$hour] = 0;
                }
            }

            // Count actual orders by day and hour with detailed statistics
            $detailedMatrix = [];
            foreach ($days as $day) {
                $detailedMatrix[$day] = [];
                foreach ($hours as $hour) {
                    $detailedMatrix[$day][$hour] = [
                        'orders' => 0,
                        'total_amount' => 0,
                        'avg_amount' => 0,
                        'items_sold' => 0
                    ];
                }
            }

            foreach ($sales as $sale) {
                $dayOfWeek = $sale->created_at->format('D'); // Mon, Tue, etc.
                $hour = $sale->created_at->format('H'); // 24-hour format
                
                // Map 24-hour format to our display hours
                $displayHour = $this->mapHourToDisplay($hour);
                
                if (isset($orderMatrix[$dayOfWeek][$displayHour])) {
                    $orderMatrix[$dayOfWeek][$displayHour]++;
                    
                    // Update detailed statistics
                    $detailedMatrix[$dayOfWeek][$displayHour]['orders']++;
                    $detailedMatrix[$dayOfWeek][$displayHour]['total_amount'] += $sale->total_amount;
                    $detailedMatrix[$dayOfWeek][$displayHour]['items_sold'] += $sale->saleItems->sum('quantity');
                }
            }

            // Calculate averages
            foreach ($detailedMatrix as $day => $dayHours) {
                foreach ($dayHours as $hour => $stats) {
                    if ($stats['orders'] > 0) {
                        $detailedMatrix[$day][$hour]['avg_amount'] = $stats['total_amount'] / $stats['orders'];
                    }
                }
            }

            // Find max orders for intensity calculation
            $maxOrders = 0;
            foreach ($orderMatrix as $day => $dayHours) {
                foreach ($dayHours as $hour => $count) {
                    $maxOrders = max($maxOrders, $count);
                }
            }

            // Build the data array with detailed statistics
            foreach ($days as $day) {
                foreach ($hours as $hour) {
                    $orders = $orderMatrix[$day][$hour] ?? 0;
                    $intensity = $this->calculateIntensity($orders, $maxOrders);
                    $detailedStats = $detailedMatrix[$day][$hour] ?? [
                        'orders' => 0,
                        'total_amount' => 0,
                        'avg_amount' => 0,
                        'items_sold' => 0
                    ];
                    
                    $data[] = [
                        'day' => $day,
                        'hour' => $hour,
                        'orders' => $orders,
                        'intensity' => $intensity,
                        'total_amount' => $detailedStats['total_amount'],
                        'avg_amount' => $detailedStats['avg_amount'],
                        'items_sold' => $detailedStats['items_sold']
                    ];
                }
            }

            return $data;
        } catch (\Exception $e) {
            Log::error('Error getting order statistics: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Map 24-hour format to display hours
     */
    private function mapHourToDisplay($hour24): string
    {
        $hour = (int) $hour24;
        
        // Combine early morning sales (0-8) into 8 Am
        if ($hour >= 0 && $hour < 8) return '8 Am';
        if ($hour >= 8 && $hour < 10) return '8 Am';
        if ($hour >= 10 && $hour < 12) return '10 Am';
        if ($hour >= 12 && $hour < 14) return '12 Am';
        if ($hour >= 14 && $hour < 16) return '14 Pm';
        if ($hour >= 16 && $hour < 18) return '16 Pm';
        if ($hour >= 18 && $hour < 20) return '18 Pm';
        if ($hour >= 20 && $hour < 22) return '20 Pm';
        // Combine late night sales (22-24) into 22 Pm
        if ($hour >= 22 && $hour < 24) return '22 Pm';
        
        // Default to 10 Am for other hours
        return '10 Am';
    }

    /**
     * Calculate intensity based on order count
     */
    private function calculateIntensity($orders, $maxOrders): string
    {
        if ($maxOrders == 0) return 'none';
        
        $percentage = $orders / $maxOrders;
        
        if ($percentage >= 0.7) return 'high';
        if ($percentage >= 0.3) return 'medium';
        if ($percentage > 0) return 'low';
        
        return 'none';
    }

    /**
     * Get low stock alerts
     */
    private function getLowStockAlerts(): array
    {
        return Product::where('quantity', '<=', 5)
            ->where('quantity', '>', 0)
            ->where('is_active', true)
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku ?? 'N/A',
                    'quantity' => $product->quantity,
                    'threshold' => 5
                ];
            })->toArray();
    }

    private function getOutOfStockAlerts(): array
    {
        return Product::where('quantity', '=', 0)
            ->where('is_active', true)
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku ?? 'N/A',
                    'quantity' => 0
                ];
            })->toArray();
    }
}
