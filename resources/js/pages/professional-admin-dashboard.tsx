import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import {
    AlertTriangle,
    BarChart3,
    DollarSign,
    FileText,
    Package,
    Receipt,
    ShoppingCart,
    TrendingUp,
    TrendingDown,
    Users,
    X,
    Settings,
    Calendar,
    Clock,
    Hash,
    AtSign,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { useEffect, useState } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Dashboard',
        href: '/admin-dashboard',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager';
}

interface ProfessionalData {
    kpi: {
        totalSales: { value: number; change: number; changeType: string };
        totalSalesReturn: { value: number; change: number; changeType: string };
        totalPurchase: { value: number; change: number; changeType: string };
        totalPurchaseReturn: { value: number; change: number; changeType: string };
    };
    financial: {
        profit: { value: number; change: number; changeType: string };
        invoiceDue: { value: number; change: number; changeType: string };
        totalExpenses: { value: number; change: number; changeType: string };
        totalPaymentReturns: { value: number; change: number; changeType: string };
    };
    recentOrders: Array<{
        id: number;
        date: string;
        customer: { name: string; id: string; avatar?: string };
        product: { name: string; category: string; image?: string };
        amount: number;
        status: string;
    }>;
    topCustomers: Array<{
        name: string;
        location: string;
        orderCount: number;
        totalSpent: number;
        avatar?: string;
    }>;
    categories: {
        categories: Array<{ name: string; sales: number; percentage: number }>;
        totalCategories: number;
        totalProducts: number;
    };
    orderStatistics: Array<{
        day: string;
        hour: string;
        orders: number;
        intensity: string;
    }>;
    lowStockAlerts: Array<{
        id: number;
        name: string;
        quantity: number;
        threshold: number;
    }>;
}

interface PageProps {
    auth: {
        user: User;
    };
    analytics: {
        professional: ProfessionalData;
    };
    flash: {
        message?: string;
    };
}

// Utility function to format large numbers
const formatNumber = (value: number): string => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
};

// KPI Card Component
function KPICard({ title, value, change, changeType, icon: Icon, color, bgColor, format = 'currency' }: {
    title: string;
    value: number;
    change: number;
    changeType: string;
    icon: any;
    color: string;
    bgColor: string;
    format?: 'currency' | 'number';
}) {
    const isPositive = changeType === 'increase';
    
    const formatValue = (val: number) => {
        if (format === 'number') {
            return val.toLocaleString();
        }
        return formatCurrency(val);
    };

    return (
        <Card className={`${bgColor} text-white border-0 shadow-lg`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium opacity-90">{title}</p>
                            <Icon className="h-6 w-6 opacity-80" />
                        </div>
                        <p className="text-3xl font-bold mb-2">{formatValue(value)}</p>
                        <div className="flex items-center">
                            {isPositive ? (
                                <ArrowUpRight className="h-4 w-4 text-green-300 mr-1" />
                            ) : (
                                <ArrowDownRight className="h-4 w-4 text-red-300 mr-1" />
                            )}
                            <span className={`text-sm font-medium ${isPositive ? 'text-green-300' : 'text-red-300'}`}>
                                {isPositive ? '+' : ''}{Math.abs(change)}%
                            </span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Financial Overview Card Component
function FinancialCard({ title, value, change, changeType, icon: Icon }: {
    title: string;
    value: number;
    change: number;
    changeType: string;
    icon: any;
}) {
    const isPositive = changeType === 'increase';
    
    return (
        <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-2xl font-bold text-gray-900 mb-1">{formatCurrency(value)}</p>
                        <p className="text-sm text-gray-600 mb-3">{title}</p>
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}{change}% vs Last Month
                            </span>
                            <Link href="#" className="text-sm text-blue-600 hover:underline">
                                View All
                            </Link>
                        </div>
                    </div>
                    <div className="ml-4">
                        <Icon className="h-8 w-8 text-gray-400" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Sales Chart Component with AmCharts
function SalesChart({ data }: { data: any[] }) {
    const [chartRef, setChartRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!chartRef) return;

        const root = am5.Root.new(chartRef);
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "panX",
                wheelY: "zoomX",
                paddingLeft: 0,
                paddingRight: 1
            })
        );

        const cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
        cursor.lineY.set("visible", false);

        const xRenderer = am5xy.AxisRendererX.new(root, {
            minGridDistance: 30
        });

        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                maxDeviation: 0.3,
                categoryField: "time",
                renderer: xRenderer,
                tooltip: am5.Tooltip.new(root, {})
            })
        );

        const yRenderer = am5xy.AxisRendererY.new(root, {
            strokeOpacity: 0.1
        });

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                maxDeviation: 0.3,
                renderer: yRenderer
            })
        );

        // Create series
        const series1 = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Total Purchase",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "purchase",
                categoryXField: "time",
                fill: am5.color("#FF6B35")
            })
        );

        const series2 = chart.series.push(
            am5xy.ColumnSeries.new(root, {
                name: "Total Sales",
                xAxis: xAxis,
                yAxis: yAxis,
                valueYField: "sales",
                categoryXField: "time",
                fill: am5.color("#FFB366")
            })
        );

        // Add data
        xAxis.data.setAll(data);
        series1.data.setAll(data);
        series2.data.setAll(data);

        // Add legend
        const legend = chart.children.push(am5.Legend.new(root, {
            centerX: am5.p50,
            x: am5.p50,
            marginTop: 15,
            marginBottom: 15,
        }));

        legend.data.setAll(chart.series.values);

        return () => {
            root.dispose();
        };
    }, [chartRef, data]);

    return <div ref={setChartRef} style={{ width: "100%", height: "300px" }} />;
}

// Categories Donut Chart Component
function CategoriesChart({ data }: { data: any }) {
    const [chartRef, setChartRef] = useState<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!chartRef) return;

        const root = am5.Root.new(chartRef);
        root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5percent.PieChart.new(root, {
                layout: root.verticalLayout,
                innerRadius: am5.percent(50)
            })
        );

        const series = chart.series.push(
            am5percent.PieSeries.new(root, {
                valueField: "sales",
                categoryField: "name",
                alignLabels: false
            })
        );

        series.labels.template.setAll({
            textType: "circular",
            centerX: 0,
            centerY: 0
        });

        series.data.setAll(data.categories);

        return () => {
            root.dispose();
        };
    }, [chartRef, data]);

    return <div ref={setChartRef} style={{ width: "100%", height: "200px" }} />;
}

// Order Statistics Heatmap Component
function OrderStatisticsHeatmap({ data }: { data: any[] }) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['2 Am', '4 Am', '6 Am', '8 Am', '10 Am', '12 Am', '14 Pm', '16 Pm', '18 Pm'];

    const getIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'high': return 'bg-orange-600';
            case 'medium': return 'bg-orange-400';
            case 'low': return 'bg-orange-200';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="grid grid-cols-8 gap-1">
            {/* Header row */}
            <div></div>
            {days.map(day => (
                <div key={day} className="text-xs text-center font-medium text-gray-600">
                    {day}
                </div>
            ))}
            
            {/* Data rows */}
            {hours.map(hour => (
                <div key={hour} className="contents">
                    <div className="text-xs text-gray-600 pr-2">{hour}</div>
                    {days.map(day => {
                        const cellData = data.find(d => d.day === day && d.hour === hour);
                        return (
                            <div
                                key={`${day}-${hour}`}
                                className={`w-6 h-6 rounded-sm ${getIntensityColor(cellData?.intensity || 'low')} hover:opacity-80 cursor-pointer`}
                                title={`${day} ${hour}: ${cellData?.orders || 0} orders`}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

export default function ProfessionalAdminDashboard() {
    const { analytics, flash } = usePage<PageProps>().props;
    const [selectedPeriod, setSelectedPeriod] = useState('1M'); // Default to 1 month
    const [selectedTimeframe, setSelectedTimeframe] = useState('Today');

    // Provide default data if analytics is not available
    const defaultData = {
        kpi: {
            totalSales: { value: 0, change: 0, changeType: 'increase' },
            totalOrders: { value: 0, change: 0, changeType: 'increase' },
            totalPurchase: { value: 0, change: 0, changeType: 'increase' },
            totalInventoryValue: { value: 0, change: 0, changeType: 'increase' }
        },
        financial: {
            grossProfit: { value: 0, change: 0, changeType: 'increase' },
            netProfit: { value: 0, change: 0, changeType: 'increase' },
            invoiceDue: { value: 0, change: 0, changeType: 'increase' },
            totalExpenses: { value: 0, change: 0, changeType: 'increase' }
        },
        recentSales: [],
        topCustomers: [],
        categories: { categories: [], totalCategories: 0, totalProducts: 0 },
        orderStatistics: [],
        lowStockAlerts: [],
        salesPurchaseChartData: [],
        chartTotals: { totalSales: 0, totalPurchase: 0 }
    };

    const professionalData = analytics?.professional || defaultData;
    const { kpi, financial, recentSales, topCustomers, categories, orderStatistics, lowStockAlerts, salesPurchaseChartData, chartTotals } = professionalData;

    // Use real chart data from analytics
    const chartData = salesPurchaseChartData && salesPurchaseChartData.length > 0 ? salesPurchaseChartData : [
        { time: "No Data", sales: 0, purchase: 0 }
    ];

    // Handle period change
    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        // Reload the page with the new period parameter
        router.get('/admin-dashboard', { period: newPeriod }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle sale click - navigate to receipt
    const handleSaleClick = (saleId: number) => {
        router.get(`/receipts/${saleId}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 bg-gray-50">
                {/* Welcome Section */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome, Admin</h1>
                        <p className="text-sm sm:text-base text-gray-600">You have 200+ Orders, Today.</p>
                    </div>
                    
                    {/* Low Stock Alert */}
                    {lowStockAlerts.length > 0 && (
                        <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div className="flex items-start sm:items-center">
                                <AlertTriangle className="h-5 w-5 text-orange-600 mr-3 flex-shrink-0 mt-0.5 sm:mt-0" />
                                <div>
                                    <p className="text-orange-800 text-sm sm:text-base">
                                        Your Product {lowStockAlerts[0].name} is running Low, already below {lowStockAlerts[0].threshold} Pcs.
                                    </p>
                                    <Link href="/products" className="text-orange-600 hover:underline text-sm sm:text-base">
                                        Add Stock
                                    </Link>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="self-end sm:self-auto">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KPICard
                        title="Total Sales"
                        value={kpi.totalSales.value}
                        change={kpi.totalSales.change}
                        changeType={kpi.totalSales.changeType}
                        icon={DollarSign}
                        color="orange"
                        bgColor="bg-orange-500"
                    />
                    <KPICard
                        title="Total Orders"
                        value={kpi.totalOrders.value}
                        change={kpi.totalOrders.change}
                        changeType={kpi.totalOrders.changeType}
                        icon={TrendingDown}
                        color="blue"
                        bgColor="bg-blue-600"
                        format="number"
                    />
                    <KPICard
                        title="Total Purchase"
                        value={kpi.totalPurchase.value}
                        change={kpi.totalPurchase.change}
                        changeType={kpi.totalPurchase.changeType}
                        icon={Package}
                        color="green"
                        bgColor="bg-green-500"
                    />
                    <KPICard
                        title="Total Inventory Value"
                        value={kpi.totalInventoryValue.value}
                        change={kpi.totalInventoryValue.change}
                        changeType={kpi.totalInventoryValue.changeType}
                        icon={TrendingUp}
                        color="blue"
                        bgColor="bg-blue-400"
                    />
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FinancialCard
                        title="Gross Profit"
                        value={financial.grossProfit.value}
                        change={financial.grossProfit.change}
                        changeType={financial.grossProfit.changeType}
                        icon={FileText}
                    />
                    <FinancialCard
                        title="Net Profit"
                        value={financial.netProfit.value}
                        change={financial.netProfit.change}
                        changeType={financial.netProfit.changeType}
                        icon={Clock}
                    />
                    <FinancialCard
                        title="Invoice Due"
                        value={financial.invoiceDue.value}
                        change={financial.invoiceDue.change}
                        changeType={financial.invoiceDue.changeType}
                        icon={AtSign}
                    />
                    <FinancialCard
                        title="Total Expenses"
                        value={financial.totalExpenses.value}
                        change={financial.totalExpenses.change}
                        changeType={financial.totalExpenses.changeType}
                        icon={Hash}
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Sales & Purchase Chart */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <CardTitle className="flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2" />
                                    Sales & Purchase
                                </CardTitle>
                                
                                {/* Desktop: Button Group */}
                                <div className="hidden sm:flex gap-2">
                                    {['1D', '1W', '1M', '3M', '6M', '1Y'].map(period => (
                                        <Button
                                            key={period}
                                            variant={selectedPeriod === period ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handlePeriodChange(period)}
                                            className={selectedPeriod === period ? 'bg-orange-500' : ''}
                                        >
                                            {period}
                                        </Button>
                                    ))}
                                </div>
                                
                                {/* Mobile: Dropdown */}
                                <div className="sm:hidden w-full">
                                    <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {['1D', '1W', '1M', '3M', '6M', '1Y'].map(period => (
                                                <SelectItem key={period} value={period}>
                                                    {period}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Chart Totals - Responsive Layout */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                                        <span className="text-sm">
                                            <span className="hidden sm:inline">Total Purchase: </span>
                                            <span className="sm:hidden">Purchase: </span>
                                            {formatCurrency(chartTotals?.totalPurchase || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-orange-300 rounded-full flex-shrink-0"></div>
                                        <span className="text-sm">
                                            <span className="hidden sm:inline">Total Sales: </span>
                                            <span className="sm:hidden">Sales: </span>
                                            {formatCurrency(chartTotals?.totalSales || 0)}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Chart Container - Responsive */}
                                <div className="w-full overflow-x-auto">
                                    <div className="min-w-[300px]">
                                        <SalesChart data={chartData} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                                    {/* Recent Sales */}
                <div>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center">
                                    <Calendar className="h-5 w-5 mr-2" />
                                    Recent Sales
                                </CardTitle>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => router.get('/sales')}
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                                >
                                    View More
                                </Button>
                            </div>
                        </CardHeader>
                            <CardContent>
                                                            <div className="space-y-3">
                                {recentSales.map((sale) => (
                                    <div
                                        key={sale.id}
                                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleSaleClick(sale.id)}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                {sale.items && sale.items.length > 0 ? (
                                                    <div className="h-full w-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-orange-600">
                                                            {sale.items[0].product_name.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="h-full w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                                        <span className="text-xs font-medium text-gray-500">?</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">
                                                    Receipt #{sale.id}
                                                </p>
                                                <p className="text-xs text-gray-500">{sale.date}</p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    {sale.items && sale.items.length > 0 ? sale.items[0].product_name : 'Unknown Product'}
                                                    {sale.items_count > 1 && ` +${sale.items_count - 1} more`}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{formatCurrency(sale.amount)}</p>
                                            <p className="text-xs text-gray-500">
                                                {sale.items && sale.items.length > 0 && (
                                                    <span>{sale.items.reduce((total, item) => total + item.quantity, 0)} items</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Bottom Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Top Customers */}
                    <div>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center">
                                    <Users className="h-5 w-5 mr-2" />
                                    Top Customers
                                </CardTitle>
                                <Link href="#" className="text-sm text-blue-600 hover:underline">
                                    View All
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {topCustomers.map((customer, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={customer.avatar} />
                                                    <AvatarFallback>
                                                        {customer.name.split(' ').map(n => n[0]).join('')}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">{customer.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {customer.location} • {customer.orderCount} Orders
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium">{formatCurrency(customer.totalSpent)}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Categories */}
                    <div>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center">
                                    <Users className="h-5 w-5 mr-2" />
                                    Top Categories
                                </CardTitle>
                                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Today">Today</SelectItem>
                                        <SelectItem value="Weekly">Weekly</SelectItem>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-center mb-4">
                                    <CategoriesChart data={categories} />
                                </div>
                                <div className="space-y-2">
                                    {categories.categories.map((category, index) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center">
                                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                                    index === 0 ? 'bg-orange-500' : 
                                                    index === 1 ? 'bg-blue-600' : 'bg-orange-300'
                                                }`}></div>
                                                <span>{category.name}</span>
                                            </div>
                                            <span className="font-medium">{category.sales} Sales</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 pt-4 border-t space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                            <span>Total Number Of Categories</span>
                                        </div>
                                        <span className="font-medium">{categories.totalCategories}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                                            <span>Total Number Of Products</span>
                                        </div>
                                        <span className="font-medium">{categories.totalProducts}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Statistics */}
                    <div>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2" />
                                    Order Statistics
                                </CardTitle>
                                <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                                    <SelectTrigger className="w-24">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Today">Today</SelectItem>
                                        <SelectItem value="Weekly">Weekly</SelectItem>
                                        <SelectItem value="Monthly">Monthly</SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardHeader>
                            <CardContent>
                                <OrderStatisticsHeatmap data={orderStatistics} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Overall Information Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">6,987</p>
                            <p className="text-sm text-gray-600">Suppliers</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                    <Users className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">4,896</p>
                            <p className="text-sm text-gray-600">Customer</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-6 text-center">
                            <div className="flex items-center justify-center mb-3">
                                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                    <ShoppingCart className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 mb-1">487</p>
                            <p className="text-sm text-gray-600">Orders</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
