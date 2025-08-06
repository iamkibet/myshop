<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
        $totalSales = Sale::where('created_at', '>=', $startDate)->sum('total_amount');
        $totalOrders = Sale::where('created_at', '>=', $startDate)->count();
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
        $bestSellingProducts = SaleItem::with(['productVariant.product'])
            ->where('sale_items.created_at', '>=', $startDate)
            ->selectRaw('product_variant_id, SUM(quantity) as total_sold, SUM(total_price) as total_revenue')
            ->groupBy('product_variant_id')
            ->orderByDesc('total_sold')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'product_name' => $item->productVariant->product->name ?? 'Unknown',
                    'variant_info' => $this->getVariantInfo($item->productVariant),
                    'total_sold' => $item->total_sold,
                    'total_revenue' => $item->total_revenue,
                ];
            });

        // Sales by category for the period
        $salesByCategory = SaleItem::with(['productVariant.product'])
            ->where('sale_items.created_at', '>=', $startDate)
            ->selectRaw('products.category, SUM(sale_items.quantity) as total_sold, SUM(sale_items.total_price) as total_revenue')
            ->join('product_variants', 'sale_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->groupBy('products.category')
            ->orderByDesc('total_revenue')
            ->get();

        // Sales by size
        $salesBySize = SaleItem::with(['productVariant'])
            ->selectRaw('product_variants.size, SUM(sale_items.quantity) as total_sold, SUM(sale_items.total_price) as total_revenue')
            ->join('product_variants', 'sale_items.product_variant_id', '=', 'product_variants.id')
            ->whereNotNull('product_variants.size')
            ->groupBy('product_variants.size')
            ->orderByDesc('total_sold')
            ->get();

        // Sales by color
        $salesByColor = SaleItem::with(['productVariant'])
            ->selectRaw('product_variants.color, SUM(sale_items.quantity) as total_sold, SUM(sale_items.total_price) as total_revenue')
            ->join('product_variants', 'sale_items.product_variant_id', '=', 'product_variants.id')
            ->whereNotNull('product_variants.color')
            ->groupBy('product_variants.color')
            ->orderByDesc('total_sold')
            ->get();

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
        $lowStockProducts = ProductVariant::with(['product'])
            ->where('quantity', '<=', $lowStockThreshold)
            ->where('quantity', '>', 0)
            ->where('is_active', true)
            ->get()
            ->map(function ($variant) {
                return [
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->product->name ?? 'Unknown',
                    'variant_info' => $this->getVariantInfo($variant),
                    'current_stock' => $variant->quantity,
                    'low_stock_threshold' => $variant->low_stock_threshold,
                ];
            });

        // Out of stock products
        $outOfStockProducts = ProductVariant::with(['product'])
            ->where('quantity', 0)
            ->where('is_active', true)
            ->get()
            ->map(function ($variant) {
                return [
                    'product_variant_id' => $variant->id,
                    'product_name' => $variant->product->name ?? 'Unknown',
                    'variant_info' => $this->getVariantInfo($variant),
                    'last_restocked' => $variant->updated_at,
                ];
            });

        // Inventory turnover rate (simplified calculation)
        $totalInventoryValue = ProductVariant::sum(DB::raw('quantity * cost_price'));
        $totalSalesValue = SaleItem::sum('total_price');
        $inventoryTurnoverRate = $totalInventoryValue > 0 ? $totalSalesValue / $totalInventoryValue : 0;

        // Stock value calculations
        $totalCostValue = ProductVariant::sum(DB::raw('quantity * cost_price'));
        $totalRetailValue = ProductVariant::sum(DB::raw('quantity * selling_price'));
        $totalProducts = ProductVariant::where('is_active', true)->count();

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
        $topManagers = Sale::with(['manager'])
            ->where('created_at', '>=', $startDate)
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
        $topProducts = SaleItem::with(['productVariant.product'])
            ->where('sale_items.created_at', '>=', $startDate)
            ->selectRaw('product_variant_id, SUM(quantity) as total_sold, SUM(total_price) as total_revenue')
            ->groupBy('product_variant_id')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'product_name' => $item->productVariant->product->name ?? 'Unknown',
                    'variant_info' => $this->getVariantInfo($item->productVariant),
                    'total_sold' => $item->total_sold,
                    'total_revenue' => $item->total_revenue,
                ];
            });

        // Top product categories for the period
        $topCategories = SaleItem::with(['productVariant.product'])
            ->where('sale_items.created_at', '>=', $startDate)
            ->selectRaw('products.category, SUM(sale_items.quantity) as total_sold, SUM(sale_items.total_price) as total_revenue')
            ->join('product_variants', 'sale_items.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
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
        // Calculate profits per sale item for the period
        $profitData = SaleItem::with(['productVariant'])
            ->selectRaw('
                sale_items.*,
                (sale_items.unit_price - product_variants.cost_price) * sale_items.quantity as profit
            ')
            ->join('product_variants', 'sale_items.product_variant_id', '=', 'product_variants.id')
            ->where('sale_items.created_at', '>=', $startDate)
            ->get();

        $totalProfit = $profitData->sum('profit');
        $totalRevenue = $profitData->sum('total_price');
        $profitMargin = $totalRevenue > 0 ? ($totalProfit / $totalRevenue) * 100 : 0;

        // Profit trends (last 30 days)
        $profitTrends = SaleItem::with(['productVariant'])
            ->selectRaw('
                DATE(sale_items.created_at) as date,
                SUM((sale_items.unit_price - product_variants.cost_price) * sale_items.quantity) as daily_profit,
                SUM(sale_items.total_price) as daily_revenue
            ')
            ->join('product_variants', 'sale_items.product_variant_id', '=', 'product_variants.id')
            ->where('sale_items.created_at', '>=', Carbon::now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'daily_profit' => (float) $item->daily_profit,
                    'daily_revenue' => (float) $item->daily_revenue,
                ];
            });

        return [
            'totalProfit' => round($totalProfit, 2),
            'totalRevenue' => round($totalRevenue, 2),
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
    private function getRecommendedRestockQuantity($variantId): int
    {
        // Get sales data for the last 30 days
        $recentSales = SaleItem::where('product_variant_id', $variantId)
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

        $lowStockProducts = ProductVariant::with(['product'])
            ->where('quantity', '<=', $lowStockThreshold)
            ->where('quantity', '>', 0)
            ->where('is_active', true)
            ->get();

        $outOfStockProducts = ProductVariant::with(['product'])
            ->where('quantity', 0)
            ->where('is_active', true)
            ->get();

        $totalCostValue = ProductVariant::sum(DB::raw('quantity * cost_price'));
        $totalRetailValue = ProductVariant::sum(DB::raw('quantity * selling_price'));

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

        $variants = ProductVariant::with(['product'])
            ->where('product_id', $productId)
            ->where('is_active', true)
            ->get();

        $recommendations = [];
        foreach ($variants as $variant) {
            $recommendedQuantity = $this->getRecommendedRestockQuantity($variant->id);

            $recommendations[] = [
                'variant_id' => $variant->id,
                'variant_info' => $this->getVariantInfo($variant),
                'current_quantity' => $variant->quantity,
                'recommended_quantity' => $recommendedQuantity,
                'cost_price' => $variant->cost_price,
                'selling_price' => $variant->selling_price,
                'last_restocked' => $variant->updated_at,
            ];
        }

        return response()->json([
            'product_id' => $productId,
            'product_name' => $variants->first()->product->name ?? 'Unknown',
            'recommendations' => $recommendations,
        ]);
    }
}
