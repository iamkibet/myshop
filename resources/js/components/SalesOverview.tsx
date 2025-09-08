
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { 
    ShoppingCart, 
    TrendingUp, 
    Package, 
    DollarSign,
    Calendar,
    Clock,
    Receipt,
    Hash,
    BarChart3,
    Users,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

interface SalesData {
    period: string;
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    averageOrderValue: number;
    sales: Array<{
        id: number;
        date: string;
        amount: number;
        items_count: number;
        items: Array<{
            product_name: string;
            quantity: number;
            unit_price: number;
            total_price: number;
        }>;
    }>;
}

interface SalesOverviewProps {
    data?: {
        today: SalesData;
        yesterday: SalesData;
        last7Days: SalesData;
        last30Days: SalesData;
        allTime: SalesData;
    } | null;
}

const timePeriods = [
    { key: 'today', label: 'Today', shortLabel: 'Today', icon: Clock },
    { key: 'yesterday', label: 'Yesterday', shortLabel: 'Yesterday', icon: Calendar },
    { key: 'last7Days', label: 'Last 7 Days', shortLabel: '7 Days', icon: TrendingUp },
    { key: 'last30Days', label: 'Last 30 Days', shortLabel: '30 Days', icon: Package },
    { key: 'allTime', label: 'All Time', shortLabel: 'All Time', icon: BarChart3 }
];

export default function SalesOverview({ data }: SalesOverviewProps) {
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [isLoading, setIsLoading] = useState(false);

    // Default data structure
    const defaultData = {
        today: {
            period: 'Today',
            totalSales: 0,
            totalOrders: 0,
            totalProducts: 0,
            averageOrderValue: 0,
            sales: []
        },
        yesterday: {
            period: 'Yesterday',
            totalSales: 0,
            totalOrders: 0,
            totalProducts: 0,
            averageOrderValue: 0,
            sales: []
        },
        last7Days: {
            period: 'Last 7 Days',
            totalSales: 0,
            totalOrders: 0,
            totalProducts: 0,
            averageOrderValue: 0,
            sales: []
        },
        last30Days: {
            period: 'Last 30 Days',
            totalSales: 0,
            totalOrders: 0,
            totalProducts: 0,
            averageOrderValue: 0,
            sales: []
        },
        allTime: {
            period: 'All Time',
            totalSales: 0,
            totalOrders: 0,
            totalProducts: 0,
            averageOrderValue: 0,
            sales: []
        }
    };

    // Use backend data directly or fallback to defaults
    const salesData = data || defaultData;
    const currentData = salesData[selectedPeriod as keyof typeof salesData] || defaultData[selectedPeriod as keyof typeof defaultData];
    const hasData = currentData && currentData.sales && currentData.sales.length > 0;

    // Aggregate products sold across all sales for the selected period
    const getProductsSold = (sales: any[]) => {
        const productMap = new Map();
        
        sales.forEach(sale => {
            // Handle both possible data structures: sale.items or sale.sale_items
            const items = sale.items || sale.sale_items || [];
            
            items.forEach((item: any) => {
                // Get product info from nested structure or direct properties
                const productName = item.product?.name || item.product_name;
                const productSku = item.product?.sku || item.product_sku;
                const productImage = item.product?.image || item.product_image;
                
                const key = productName;
                if (productMap.has(key)) {
                    const existing = productMap.get(key);
                    productMap.set(key, {
                        product_name: productName,
                        product_image: productImage || '/placeholder-product.jpg',
                        product_sku: productSku || 'N/A',
                        total_quantity: existing.total_quantity + item.quantity,
                        total_revenue: existing.total_revenue + item.total_price,
                        unit_price: item.unit_price, // Keep the latest unit price
                        sales_count: existing.sales_count + 1 // This counts how many times this product appears in sales
                    });
                } else {
                    productMap.set(key, {
                        product_name: productName,
                        product_image: productImage || '/placeholder-product.jpg',
                        product_sku: productSku || 'N/A',
                        total_quantity: item.quantity,
                        total_revenue: item.total_price,
                        unit_price: item.unit_price,
                        sales_count: 1
                    });
                }
            });
        });
        
        return Array.from(productMap.values()).sort((a, b) => b.total_revenue - a.total_revenue);
    };

    const productsSold = getProductsSold(currentData.sales || []);

    // Debug: Let's see what data we're actually getting
    console.log('Backend data received:', data);
    console.log('Sales data being used:', salesData);
    console.log('Current period data:', currentData);
    console.log('Sample sale data:', currentData.sales?.[0]);
    console.log('Sample sale items:', currentData.sales?.[0]?.items);
    console.log('First product sold:', productsSold[0]);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric'
        });
    };

    return (
        <div className="w-full space-y-6">
            {/* Header Section */}
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Sales Overview</h2>
                        <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Track your sales performance across different time periods</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1 flex-shrink-0">
                        {currentData.period}
                    </Badge>
                </div>

            {/* Period Navigation */}
            <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
                        {timePeriods.map((period) => {
                            const Icon = period.icon;
                            const isActive = selectedPeriod === period.key;
                            
                            return (
                        <button
                                    key={period.key}
                            onClick={() => setSelectedPeriod(period.key)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 whitespace-nowrap ${
                                        isActive 
                                    ? 'text-blue-600 border-blue-600 bg-blue-50/50' 
                                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="hidden sm:inline">{period.label}</span>
                            <span className="sm:hidden">{period.shortLabel}</span>
                        </button>
                            );
                        })}
            </div>

            {/* Content for Selected Period */}
                    {timePeriods.map((period) => {
                        const periodData = salesData[period.key as keyof typeof salesData] || defaultData[period.key as keyof typeof defaultData];
                const isActive = selectedPeriod === period.key;
                
                if (!isActive) return null;
                        
                        return (
                    <div key={period.key} className="space-y-6">
                        {/* Sales Summary Paragraph */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-100">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                                <div className="p-2 sm:p-3 bg-blue-100 rounded-lg self-start">
                                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
                                        {currentData.period} Sales Summary
                                    </h3>
                                    <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                                        {hasData ? (
                                            <>
                                                <span className="block sm:inline">You sold <strong>{productsSold.length} products</strong></span>
                                                <span className="block sm:inline sm:ml-1"> with <strong className="break-words">{productsSold[0]?.product_name || 'various products'}</strong> being the highest selling in this period.</span>
                                                <span className="block sm:inline sm:ml-1"> This generated <strong>{formatCurrency(periodData.totalSales)}</strong> in revenue from <strong>{periodData.totalOrders} orders</strong>.</span>
                                                {selectedPeriod !== 'today' && selectedPeriod !== 'yesterday' && (
                                                    <span className="block sm:inline sm:ml-1"> The average order value was <strong>{formatCurrency(periodData.averageOrderValue)}</strong> per transaction.</span>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                No sales recorded for {currentData.period.toLowerCase()}. 
                                                {selectedPeriod === 'today' ? ' Start making sales to see your performance here!' : ' Check back when sales are made in this period.'}
                                            </>
                                        )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                        {/* Products Sold Section */}
                        <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">All Products Sold</h3>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                        {productsSold.length} products
                                    </Badge>
                                        </div>
                                    </div>

                            {/* Professional Table Container */}
                            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                                        {hasData && productsSold.length > 0 ? (
                                    <div className="relative">
                                        {/* Desktop Table Header - Hidden on Mobile */}
                                        <div className="hidden sm:block bg-gray-50 border-b border-gray-200">
                                            <div className="grid grid-cols-12 gap-2 px-4 py-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                <div className="col-span-1 text-center">Image</div>
                                                <div className="col-span-5 font-medium">Product</div>
                                                <div className="col-span-2 text-center">Qty</div>
                                                <div className="col-span-2 text-right">Unit Price</div>
                                                <div className="col-span-2 text-right">Total</div>
                                        </div>
                                    </div>

                                        {/* Mobile Header - Visible on Mobile */}
                                        <div className="sm:hidden bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-4 py-3">
                                            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Products Sold</h3>
                                        </div>
                                        
                                        {/* Scrollable Content */}
                                        <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                                            {/* Desktop Table View */}
                                            <div className="hidden sm:block divide-y divide-gray-100 pt-2">
                                                {productsSold.map((product, index) => (
                                                    <div key={index} className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 last:border-b-0">
                                                        {/* Product Image */}
                                                        <div className="col-span-1 flex items-center justify-center">
                                                            <div className="w-10 h-10 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                                                {product.product_image && product.product_image !== '/placeholder-product.jpg' ? (
                                                                    <img 
                                                                        src={product.product_image} 
                                                                        alt={product.product_name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                                            if (nextElement) {
                                                                                nextElement.style.display = 'flex';
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div className={`w-full h-full flex items-center justify-center ${product.product_image && product.product_image !== '/placeholder-product.jpg' ? 'hidden' : 'flex'}`}>
                                                                    <Package className="h-4 w-4 text-gray-400" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Product Name */}
                                                        <div className="col-span-5 flex items-center min-w-0">
                                                            <div className="min-w-0 flex-1">
                                                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                                                    {product.product_name}
                                                                </h4>
                                    </div>
                                </div>

                                                        {/* Quantity */}
                                                        <div className="col-span-2 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {product.total_quantity}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Unit Price */}
                                                        <div className="col-span-2 flex items-center justify-end">
                                                            <span className="text-sm text-gray-600">
                                                                {formatCurrency(product.unit_price)}
                                                            </span>
                                                        </div>
                                                        
                                                        {/* Total Revenue */}
                                                        <div className="col-span-2 flex items-center justify-end">
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {formatCurrency(product.total_revenue)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                    </div>

                                            {/* Mobile Card View */}
                                            <div className="sm:hidden divide-y divide-gray-100 pt-2">
                                                        {productsSold.map((product, index) => (
                                                    <div key={index} className="p-3 border-b border-gray-100 last:border-b-0">
                                                        <div className="flex items-center gap-3">
                                                            {/* Product Image */}
                                                            <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                                                                {product.product_image && product.product_image !== '/placeholder-product.jpg' ? (
                                                                    <img 
                                                                        src={product.product_image} 
                                                                        alt={product.product_name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                                                                            if (nextElement) {
                                                                                nextElement.style.display = 'flex';
                                                                            }
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <div className={`w-full h-full flex items-center justify-center ${product.product_image && product.product_image !== '/placeholder-product.jpg' ? 'hidden' : 'flex'}`}>
                                                                    <Package className="h-5 w-5 text-gray-400" />
                                                                </div>
                                                                        </div>
                                                            
                                                            {/* Product Details */}
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                                                                            {product.product_name}
                                                                </h4>
                                                                
                                                                {/* Stats and Price Row */}
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-xs text-gray-500">
                                                                            {product.total_quantity} units
                                                                        </span>
                                                                        <span className="text-xs text-blue-600">
                                                                            {product.sales_count} sales
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="text-xs text-gray-500">
                                                                            {formatCurrency(product.unit_price)} each
                                                                        </div>
                                                                        <div className="text-sm font-semibold text-gray-900">
                                                                        {formatCurrency(product.total_revenue)}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Footer */}
                                        <div className="bg-gray-50 border-t border-gray-200">
                                            <div className="px-4 py-3">
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">{productsSold.length} products</span>
                                                    </div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        Total: {formatCurrency(productsSold.reduce((sum, product) => sum + product.total_revenue, 0))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                            </div>
                                        ) : (
                                    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                                        <div className="relative mb-8">
                                            <div className="w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl flex items-center justify-center shadow-lg">
                                                <Package className="h-12 w-12 text-gray-300" />
                                            </div>
                                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                                <Clock className="h-4 w-4 text-yellow-600" />
                                            </div>
                                        </div>
                                        
                                        <h4 className="text-2xl font-bold text-gray-900 mb-4">
                                            {selectedPeriod === 'today' ? 'No sales today yet' : 
                                             selectedPeriod === 'yesterday' ? 'No sales yesterday' :
                                             selectedPeriod === 'last7Days' ? 'No sales in the last 7 days' :
                                             selectedPeriod === 'last30Days' ? 'No sales in the last 30 days' :
                                             'No sales recorded yet'}
                                        </h4>
                                        
                                        <p className="text-gray-600 max-w-lg leading-relaxed mb-8 text-lg">
                                            {selectedPeriod === 'today' ? 
                                                'Start making sales today to see your products appear here. Every sale counts!' :
                                             selectedPeriod === 'yesterday' ? 
                                                'Yesterday was quiet on the sales front. Today is a new opportunity to make it happen!' :
                                             selectedPeriod === 'last7Days' ? 
                                                'The past week hasn\'t seen any sales yet. Time to turn things around!' :
                                             selectedPeriod === 'last30Days' ? 
                                                'The past month is still waiting for its first sale. Let\'s make it happen!' :
                                                'Your business is ready for its first sale! Start making sales to see your performance here.'}
                                        </p>
                                        
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl px-8 py-6 max-w-md">
                                            <div className="flex items-center justify-center gap-3 text-blue-700 mb-2">
                                                <TrendingUp className="h-5 w-5" />
                                                <span className="text-lg font-semibold">
                                                    {selectedPeriod === 'today' ? 'Ready to start selling?' :
                                                     selectedPeriod === 'yesterday' ? 'Today\'s your chance!' :
                                                     selectedPeriod === 'last7Days' ? 'Turn this week around!' :
                                                     selectedPeriod === 'last30Days' ? 'Make this month count!' :
                                                     'Ready to make your first sale?'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-blue-600">
                                                {selectedPeriod === 'today' ? 'Your first sale could be just moments away!' :
                                                 selectedPeriod === 'yesterday' ? 'Yesterday is history, today is opportunity!' :
                                                 selectedPeriod === 'last7Days' ? 'Every day is a chance to make sales!' :
                                                 selectedPeriod === 'last30Days' ? 'Every month brings new possibilities!' :
                                                 'Every great business starts with a single sale!'}
                                            </p>
                                        </div>
                                            </div>
                                        )}
                            </div>
                                    </div>
                                </div>
                        );
                    })}
        </div>
    );
}