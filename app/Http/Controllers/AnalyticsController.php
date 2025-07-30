<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnalyticsController extends Controller
{
    /**
     * Get sales analytics for a date range.
     */
    public function sales(Request $request): JsonResponse
    {
        $from = $request->get('from', now()->subDays(30)->format('Y-m-d'));
        $to = $request->get('to', now()->format('Y-m-d'));

        $sales = Sale::whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59']);

        $totalRevenue = $sales->sum('total_amount');
        $totalSales = $sales->count();
        $avgSaleValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_sales' => $totalSales,
            'avg_sale_value' => round($avgSaleValue, 2),
            'date_range' => [
                'from' => $from,
                'to' => $to,
            ],
        ]);
    }

    /**
     * Get top products by sales.
     */
    public function topProducts(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);

        $topProducts = SaleItem::selectRaw('
                product_id,
                products.name,
                SUM(quantity) as sold_quantity,
                SUM(quantity * sale_price) as total_revenue
            ')
            ->join('products', 'sale_items.product_id', '=', 'products.id')
            ->groupBy('product_id', 'products.name')
            ->orderByDesc('total_revenue')
            ->limit($limit)
            ->get();

        return response()->json([
            'top_products' => $topProducts,
        ]);
    }
} 