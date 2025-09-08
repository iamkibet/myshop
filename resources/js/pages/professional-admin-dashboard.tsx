import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import KPICard from '@/components/KPICard';
import SalesOverview from '@/components/SalesOverview';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState } from 'react';
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
    ArrowDownRight,
    CheckSquare,
    TriangleAlert,
    Info
} from 'lucide-react';
import { useEffect } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5xy from '@amcharts/amcharts5/xy';
import * as am5percent from '@amcharts/amcharts5/percent';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

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
        totalOrders: { value: number; change: number; changeType: string };
        totalPurchase: { value: number; change: number; changeType: string };
        totalInventoryValue: { value: number; change: number; changeType: string };
    };
    financial: {
        grossProfit: { value: number; change: number; changeType: string };
        netProfit: { value: number; change: number; changeType: string };
        averageOrderValue: { value: number; change: number; changeType: string };
        totalExpenses: { value: number; change: number; changeType: string };
    };
    recentSales: Array<{
        id: number;
        date: string;
        amount: number;
        items_count: number;
        items: Array<{
            product_name: string;
            quantity: number;
        }>;
    }>;
    topProducts: Array<{
        id: number;
        name: string;
        initials: string;
        sku: string;
        total_quantity: number;
        total_revenue: number;
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
    outOfStockAlerts: Array<{
        id: number;
        name: string;
        sku: string;
    }>;
    recentExpenses: Array<{
        id: number;
        title: string;
        amount: number;
        category: string;
        date: string;
        added_by: string;
        status: string;
    }>;
    salesPurchaseChartData: Array<{
        time: string;
        sales: number;
        purchase: number;
    }>;
    chartTotals: {
        totalSales: number;
        totalPurchase: number;
    };
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
            <CardContent className="p-2 sm:p-4 lg:p-6">
                {/* Mobile Layout - Stacked */}
                <div className="block sm:hidden">
                    <div className="flex items-start justify-between mb-1">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-600 leading-tight">{title}</p>
                        </div>
                        <Icon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-1" />
                    </div>
                    <div className="space-y-0.5">
                        <p className="text-sm font-bold text-gray-900 leading-tight break-words">{formatCurrency(value)}</p>
                        <span className={`text-xs font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? '+' : ''}{change}%
                        </span>
                    </div>
                </div>

                {/* Desktop Layout - Horizontal */}
                <div className="hidden sm:flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                        <p className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">{formatCurrency(value)}</p>
                        <p className="text-sm text-gray-600 mb-2 lg:mb-3">{title}</p>
                        <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isPositive ? '+' : ''}{change}% vs Last Month
                            </span>
                        </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                        <Icon className="h-7 w-7 lg:h-8 lg:w-8 text-gray-400" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Revenue vs Expenses Chart Component
function RevenueExpensesChart({ data, period = '1M', analytics }: { data: any[], period?: string, analytics?: any }) {
    console.log('Chart - Backend data:', data);
    console.log('Chart - Data length:', data?.length);
    console.log('Chart - Period:', period);
    
    // Simple fallback - use the data as-is and filter by period
    const getFilteredData = (data: any[], period: string) => {
        if (!data || data.length === 0) {
            console.log('No data available');
            return [];
        }
        
        // Take the last N days based on period
        const daysToShow = period === '1W' ? 7 : 30;
        const filteredData = data.slice(-daysToShow);
        
        console.log('Filtered data for period:', period, filteredData);
        return filteredData;
    };

    const filteredData = getFilteredData(data, period);
    
    if (filteredData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                    Revenue vs Expenses data will appear here once you start recording transactions.
                </p>
            </div>
        );
    }
    
    // Calculate daily expenses for the period
    const totalExpenses = analytics?.professional?.financial?.totalExpenses?.value || 0;
    const daysInPeriod = period === '1W' ? 7 : 30;
    const dailyExpenses = totalExpenses / 30; // Use monthly average
    
    const chartData = {
        labels: filteredData.map(item => item.time),
        datasets: [
            {
                label: 'Revenue',
                data: filteredData.map(item => item.sales || 0),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            },
            {
                label: 'Expenses',
                data: filteredData.map(() => dailyExpenses), // Same daily expense for all days
                borderColor: '#EF4444',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#EF4444',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index' as const
        },
        plugins: {
            legend: {
                display: false // We have custom legend in the UI
            },
            tooltip: {
                backgroundColor: 'rgba(31, 41, 55, 0.95)',
                titleColor: '#D1D5DB',
                bodyColor: '#FFFFFF',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                padding: 10,
                callbacks: {
                    label: function(context: any) {
                        const value = context.parsed.y;
                        const label = context.dataset.label;
                        let formattedValue;
                        if (value >= 1000000) {
                            formattedValue = (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                            formattedValue = (value / 1000).toFixed(1) + 'K';
                        } else {
                            formattedValue = value.toLocaleString();
                        }
                        return `${label}: ${formattedValue}`;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: false
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif'
                    }
                }
            },
            y: {
                display: true,
                grid: {
                    display: true,
                    color: '#F3F4F6',
                    drawBorder: false
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif'
                    },
                    callback: function(value: any) {
                        if (value >= 1000000) {
                            return (value / 1000000).toFixed(1) + 'M';
                        } else if (value >= 1000) {
                            return (value / 1000).toFixed(1) + 'K';
                        }
                        return value.toLocaleString();
                    }
                }
            }
        },
        elements: {
            line: {
                borderCapStyle: 'round' as const
            }
        },
        animation: {
            duration: 800,
            easing: 'easeInOutQuart' as const
        }
    };

    return (
        <div className="w-full h-full">
            <Line data={chartData} options={chartOptions} />
        </div>
    );
}

// Sales Chart Component with Chart.js
function SalesChart({ data, onExport }: { data: any[], onExport?: (chartRef: ChartJS | null) => void }) {
    const [chartRef, setChartRef] = useState<ChartJS | null>(null);

    // If no data, show empty state
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center" style={{ height: "300px" }}>
                <div className="text-6xl mb-4">📈</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sales Data</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                    Sales and purchase data will appear here once you start recording transactions.
                </p>
            </div>
        );
    }

    // Pass chartRef to parent when it changes
    useEffect(() => {
        if (onExport && chartRef) {
            onExport(chartRef);
        }
    }, [chartRef, onExport]);

    const chartData = {
        labels: data.map(item => item.time),
        datasets: [
            {
                label: 'Cost of Goods Sold',
                data: data.map(item => item.purchase || 0),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 4,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3B82F6',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#3B82F6',
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 4,
                gradient: {
                    backgroundColor: {
                        type: 'linear' as const,
                        x0: 0,
                        y0: 0,
                        x1: 0,
                        y1: 1,
                        colorStops: [
                            {
                                offset: 0,
                                color: 'rgba(59, 130, 246, 0.3)'
                            },
                            {
                                offset: 1,
                                color: 'rgba(59, 130, 246, 0.05)'
                            }
                        ]
                    }
                }
            },
            {
                label: 'Total Sales',
                data: data.map(item => item.sales || 0),
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 4,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#FFFFFF',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointHoverBackgroundColor: '#10B981',
                pointHoverBorderColor: '#FFFFFF',
                pointHoverBorderWidth: 4,
                gradient: {
                    backgroundColor: {
                        type: 'linear' as const,
                        x0: 0,
                        y0: 0,
                        x1: 0,
                        y1: 1,
                        colorStops: [
                            {
                                offset: 0,
                                color: 'rgba(16, 185, 129, 0.3)'
                            },
                            {
                                offset: 1,
                                color: 'rgba(16, 185, 129, 0.05)'
                            }
                        ]
                    }
                }
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index' as const
        },
        layout: {
            padding: {
                left: 10,
                right: 10,
                top: 10,
                bottom: 10
            }
        },
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'center' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 14,
                        family: 'Inter, sans-serif',
                        weight: 'bold' as const
                    },
                    color: '#374151'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(31, 41, 55, 0.95)',
                titleColor: '#D1D5DB',
                bodyColor: '#FFFFFF',
                borderColor: '#374151',
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: true,
                padding: 12,
                titleFont: {
                    size: 13,
                    weight: 'normal' as const
                },
                bodyFont: {
                    size: 14,
                    weight: 'bold' as const
                },
                callbacks: {
                    label: function(context: any) {
                        const value = context.parsed.y;
                        const label = context.dataset.label;
                        return `${label}: Ksh ${value.toLocaleString()}`;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: true,
                    color: '#F3F4F6',
                    drawBorder: false
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 13,
                        family: 'Inter, sans-serif',
                        weight: 'normal' as const
                    }
                }
            },
            y: {
                display: true,
                grid: {
                    display: true,
                    color: '#F3F4F6',
                    drawBorder: false
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 13,
                        family: 'Inter, sans-serif',
                        weight: 'normal' as const
                    },
                    callback: function(value: any) {
                        return value.toLocaleString();
                    }
                }
            }
        },
        elements: {
            line: {
                borderCapStyle: 'round' as const
            },
            point: {
                hoverBackgroundColor: '#FFFFFF'
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart' as const
        }
    };

    return (
        <div className="w-full" style={{ height: "300px", position: 'relative' }}>
            <Line 
                ref={(ref) => setChartRef(ref as ChartJS | null)}
                data={chartData} 
                options={chartOptions} 
            />
        </div>
    );
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

        // Hide all labels on the chart
        series.labels.template.setAll({
            forceHidden: true
        });
        
        // Also hide tick labels
        series.ticks.template.setAll({
            forceHidden: true
        });

        series.data.setAll(data.categories);

        return () => {
            root.dispose();
        };
    }, [chartRef, data]);

    return <div ref={setChartRef} style={{ width: "180px", height: "180px" }} />;
}

// Sales Expenses Chart Component
function SalesExpensesChart({ data }: { data: any[] }) {
    const [chartRef, setChartRef] = useState<HTMLDivElement | null>(null);
    const [chartType, setChartType] = useState<'column' | 'line'>('column');

    useEffect(() => {
        if (!chartRef) return;

        let root: any = null;
        try {
            root = am5.Root.new(chartRef);
            root.setThemes([am5themes_Animated.new(root)]);

        const chart = root.container.children.push(
            am5xy.XYChart.new(root, {
                panX: false,
                panY: false,
                wheelX: "panX",
                wheelY: "zoomX",
                layout: root.verticalLayout,
                paddingLeft: 0,
                paddingRight: 0,
            })
        );

        // Create axes
        const xAxis = chart.xAxes.push(
            am5xy.CategoryAxis.new(root, {
                categoryField: "time",
                renderer: am5xy.AxisRendererX.new(root, {
                    cellStartLocation: 0.1,
                    cellEndLocation: 0.9,
                    minGridDistance: 40,
                }),
            })
        );

        // Configure x-axis labels
        xAxis.get("renderer").labels.template.setAll({
            rotation: -45,
            centerX: 0,
            centerY: 0,
            fontSize: 11,
        });

        const yAxis = chart.yAxes.push(
            am5xy.ValueAxis.new(root, {
                renderer: am5xy.AxisRendererY.new(root, {
                    minGridDistance: 30,
                }),
            })
        );

        // Process data to make expenses negative
        const processedData = data.length > 0 ? data.map(item => ({
            ...item,
            sales: item.sales || 0,
            expenses: -(item.purchase || 0) // Make expenses negative
        })) : [];

        let salesSeries, expensesSeries;

        if (chartType === 'column') {
            // Create column series for Sales (positive values)
            salesSeries = chart.series.push(
                am5xy.ColumnSeries.new(root, {
                    name: "Sales",
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: "sales",
                    categoryXField: "time",
                    fill: am5.color("#14b8a6"), // Teal color
                    stroke: am5.color("#14b8a6"),
                })
            );

            // Create column series for Expenses (negative values)
            expensesSeries = chart.series.push(
                am5xy.ColumnSeries.new(root, {
                    name: "Expenses",
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: "expenses",
                    categoryXField: "time",
                    fill: am5.color("#f97316"), // Orange color
                    stroke: am5.color("#f97316"),
                })
            );
        } else {
            // Create line series for Sales
            salesSeries = chart.series.push(
                am5xy.LineSeries.new(root, {
                    name: "Sales",
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: "sales",
                    categoryXField: "time",
                    stroke: am5.color("#14b8a6"), // Teal color
                    fill: am5.color("#14b8a6"),
                    fillOpacity: 0.2,
                })
            );

            // Create line series for Expenses
            expensesSeries = chart.series.push(
                am5xy.LineSeries.new(root, {
                    name: "Expenses",
                    xAxis: xAxis,
                    yAxis: yAxis,
                    valueYField: "expenses",
                    categoryXField: "time",
                    stroke: am5.color("#f97316"), // Orange color
                    fill: am5.color("#f97316"),
                    fillOpacity: 0.2,
                })
            );
        }

        xAxis.data.setAll(processedData);
        salesSeries.data.setAll(processedData);
        expensesSeries.data.setAll(processedData);

        // Add cursor for interactivity
        chart.set("cursor", am5xy.XYCursor.new(root, {}));

        // Add tooltips for hover data
        const tooltip = chart.set("tooltip", am5.Tooltip.new(root, {
            getFillFromSprite: false,
            autoTextColor: false,
            getStrokeFromSprite: false,
            getLabelFillFromSprite: false,
            pointerOrientation: "horizontal",
            getPointerOrientation: "horizontal",
        }));

        // Configure tooltip styling safely
        if (tooltip.label) {
            tooltip.label.setAll({
                fill: am5.color("#ffffff"),
                fontSize: 12,
                fontWeight: "500",
            });
        }

        if (tooltip.background) {
            tooltip.background.setAll({
                fill: am5.color("#1f2937"),
                stroke: am5.color("#374151"),
                strokeWidth: 1,
                cornerRadius: 6,
                shadowColor: am5.color("#000000"),
                shadowBlur: 10,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                shadowOpacity: 0.3,
            });
        }

        // Configure tooltip content
        salesSeries.set("tooltipText", "{name}: {valueY.formatNumber('#,###.00')}");
        expensesSeries.set("tooltipText", "{name}: {valueY.formatNumber('#,###.00')}");

        // Add legend
        const legend = chart.children.push(
            am5.Legend.new(root, {
                centerX: am5.p50,
                x: am5.p50,
                marginTop: 15,
                marginBottom: 15,
            })
        );

        legend.data.setAll([salesSeries, expensesSeries]);

        } catch (error) {
            console.error('Error initializing SalesExpensesChart:', error);
        }

        return () => {
            if (root) {
                root.dispose();
            }
        };
    }, [chartRef, data, chartType]);

    // If no data, show empty state
    if (data.length === 0) {
        return (
            <div className="w-full">
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                    <p className="text-gray-500 text-sm max-w-sm">
                        Sales and expenses data will appear here once you start recording transactions.
                    </p>
                </div>
                {/* Bottom padding for mobile navigation */}
                <div className="h-20 sm:h-0"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Chart Type Toggle - Mobile Responsive */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-600 hidden sm:block">
                    Chart Type
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                    <button
                        onClick={() => setChartType('column')}
                        className={`flex-1 sm:flex-none px-3 py-1 text-xs rounded-md transition-colors ${
                            chartType === 'column' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span className="hidden sm:inline">Column</span>
                        <span className="sm:hidden">📊</span>
                    </button>
                    <button
                        onClick={() => setChartType('line')}
                        className={`flex-1 sm:flex-none px-3 py-1 text-xs rounded-md transition-colors ${
                            chartType === 'line' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span className="hidden sm:inline">Line</span>
                        <span className="sm:hidden">📈</span>
                    </button>
                </div>
            </div>
            
            {/* Chart Container - Mobile Responsive */}
            <div className="w-full overflow-hidden">
                <div 
                    ref={setChartRef} 
                    style={{ 
                        width: "100%", 
                        height: "300px",
                        minHeight: "250px"
                    }} 
                    className="chart-container"
                />
            </div>
            
            {/* Mobile Legend - Show on small screens */}
            <div className="flex justify-center mt-4 sm:hidden">
                <div className="flex space-x-4 text-xs">
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-teal-500 rounded mr-2"></div>
                        <span className="text-gray-600">Sales</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
                        <span className="text-gray-600">Expenses</span>
                    </div>
                </div>
            </div>
            
            {/* Bottom padding for mobile navigation */}
            <div className="h-20 sm:h-0"></div>
        </div>
    );
}

// Order Statistics Heatmap Component
function OrderStatisticsHeatmap({ data }: { data: any[] }) {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const hours = ['8 AM', '10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM', '10 PM'];
    const [hoveredCell, setHoveredCell] = useState<{day: string, hour: string} | null>(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // Debug: Log the data to see what we're receiving
    console.log('Order Statistics Data:', data);
    console.log('Data length:', data?.length);
    if (data && data.length > 0) {
        console.log('Sample data item:', data[0]);
        console.log('Available hours in data:', [...new Set(data.map(d => d.hour))]);
        console.log('Available days in data:', [...new Set(data.map(d => d.day))]);
    }

    // Transform data to handle both old and new hour formats
    const transformedData = data?.map(item => {
        // Map old format to new format if needed
        const hourMapping: { [key: string]: string } = {
            '8 Am': '8 AM',
            '10 Am': '10 AM', 
            '12 Am': '12 PM',
            '14 Pm': '2 PM',
            '16 Pm': '4 PM',
            '18 Pm': '6 PM',
            '20 Pm': '8 PM',
            '22 Pm': '10 PM'
        };
        
        return {
            ...item,
            hour: hourMapping[item.hour] || item.hour
        };
    }) || [];

    const getIntensityColor = (intensity: string) => {
        switch (intensity) {
            case 'high': return 'bg-orange-600';
            case 'medium': return 'bg-orange-400';
            case 'low': return 'bg-orange-200';
            case 'none': return 'bg-gray-100';
            default: return 'bg-gray-100';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleMouseEnter = (day: string, hour: string, event: React.MouseEvent) => {
        setHoveredCell({ day, hour });
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const handleMouseLeave = () => {
        setHoveredCell(null);
    };

    const handleMouseMove = (event: React.MouseEvent) => {
        setMousePosition({ x: event.clientX, y: event.clientY });
    };

    const getTooltipContent = () => {
        if (!hoveredCell) return null;
        
        const cellData = transformedData.find(d => d.day === hoveredCell.day && d.hour === hoveredCell.hour);
        
        // Get the date for this day (assuming current week)
        const getDateForDay = (day: string) => {
            const today = new Date();
            const currentDay = today.getDay();
            const dayMap: { [key: string]: number } = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0 };
            const targetDay = dayMap[day];
            const diff = targetDay - currentDay;
            const targetDate = new Date(today);
            targetDate.setDate(today.getDate() + diff);
            return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        };
        
        if (!cellData || cellData.orders === 0) {
            return (
                <div className="bg-gray-800 text-white p-2 rounded shadow-lg text-xs">
                    <div className="font-semibold">{hoveredCell.day} {hoveredCell.hour}</div>
                    <div className="text-gray-300 text-xs">{getDateForDay(hoveredCell.day)}</div>
                    <div>No sales recorded</div>
                </div>
            );
        }
        
        const intensityText = cellData.intensity === 'high' ? 'High Activity' : 
                             cellData.intensity === 'medium' ? 'Medium Activity' : 
                             cellData.intensity === 'low' ? 'Low Activity' : 'No Activity';
        
        return (
            <div className="bg-gray-800 text-white p-3 rounded shadow-lg text-xs min-w-[200px]">
                <div className="font-semibold text-orange-300 mb-1">{hoveredCell.day} {hoveredCell.hour}</div>
                <div className="text-gray-300 text-xs mb-2">{getDateForDay(hoveredCell.day)}</div>
                <div className="mb-1">{cellData.orders} {cellData.orders === 1 ? 'order' : 'orders'}</div>
                <div className="mb-1 text-orange-200">{intensityText}</div>
                <div className="mb-1">Total: {formatCurrency(cellData.total_amount || 0)}</div>
                <div className="mb-1">Avg: {formatCurrency(cellData.avg_amount || 0)}</div>
                <div>Items: {cellData.items_sold || 0}</div>
            </div>
        );
    };

    // If no data, show a message
    if (!transformedData || transformedData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-4xl mb-2">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Order Data</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                    Order statistics will appear here once you start recording sales.
                </p>
                <div className="mt-4 text-xs text-gray-400">
                    Debug: Data length = {transformedData?.length || 0}
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="grid grid-cols-8 gap-1">
                {/* Header row */}
                <div></div>
                {days.map(day => (
                    <div key={day} className="text-xs sm:text-sm text-center font-medium text-gray-600">
                        {day}
                    </div>
                ))}
                
                {/* Data rows */}
                {hours.map(hour => (
                    <div key={hour} className="contents">
                        <div className="text-xs sm:text-sm text-gray-600 pr-1 sm:pr-2 text-right sm:text-left flex items-center justify-end sm:justify-start min-h-[16px] sm:min-h-[24px]">
                            <span className="hidden sm:inline">{hour}</span>
                            <span className="sm:hidden text-[10px] leading-none">{hour.replace(' AM', 'A').replace(' PM', 'P')}</span>
                        </div>
                        {days.map(day => {
                            const cellData = transformedData.find(d => d.day === day && d.hour === hour);
                            return (
                                <div
                                    key={`${day}-${hour}`}
                                    className={`w-4 h-4 sm:w-6 sm:h-6 rounded-sm ${getIntensityColor(cellData?.intensity || 'none')} hover:opacity-80 cursor-pointer transition-all duration-200 hover:scale-105`}
                                    onMouseEnter={(e) => handleMouseEnter(day, hour, e)}
                                    onMouseLeave={handleMouseLeave}
                                    onMouseMove={handleMouseMove}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
            
            {/* Custom Tooltip */}
            {hoveredCell && (
                <div 
                    className="fixed z-50 pointer-events-none"
                    style={{
                        left: mousePosition.x + 10,
                        top: mousePosition.y - 10,
                    }}
                >
                    {getTooltipContent()}
                </div>
            )}
        </div>
    );
}

export default function ProfessionalAdminDashboard() {
    const { analytics, flash } = usePage().props as any;
    const [selectedPeriod, setSelectedPeriod] = useState('1M'); // Default to 1 month
    const [selectedChartPeriod, setSelectedChartPeriod] = useState((usePage().props as any).chartPeriod || '1M'); // For Sales Statistics chart
    const [salesChartRef, setSalesChartRef] = useState<ChartJS | null>(null);
    const [salesOverviewData, setSalesOverviewData] = useState<{
        today: any;
        yesterday: any;
        last7Days: any;
        last30Days: any;
        allTime: any;
    } | null>(null);
    const [isLoadingSalesOverview, setIsLoadingSalesOverview] = useState(false);
    
    // State for managing permanently dismissed alerts (persistent)
    const [dismissedLowStock, setDismissedLowStock] = useState<number[]>(() => {
        if (typeof window !== 'undefined') {
            return JSON.parse(localStorage.getItem('dismissedLowStock') || '[]');
        }
        return [];
    });
    const [dismissedOutOfStock, setDismissedOutOfStock] = useState<number[]>(() => {
        if (typeof window !== 'undefined') {
            return JSON.parse(localStorage.getItem('dismissedOutOfStock') || '[]');
        }
        return [];
    });
    const [dismissedExpenses, setDismissedExpenses] = useState<number[]>(() => {
        if (typeof window !== 'undefined') {
            return JSON.parse(localStorage.getItem('dismissedExpenses') || '[]');
        }
        return [];
    });

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
            averageOrderValue: { value: 0, change: 0, changeType: 'increase' },
            totalExpenses: { value: 0, change: 0, changeType: 'increase' }
        },
        recentSales: [],
        topProducts: [],
        categories: { categories: [], totalCategories: 0, totalProducts: 0 },
        orderStatistics: [],
        lowStockAlerts: [],
        salesPurchaseChartData: [],
        chartTotals: { totalSales: 0, totalPurchase: 0 }
    };

    const professionalData = analytics?.professional || defaultData;
    const { kpi, financial, recentSales, topProducts, categories, orderStatistics, lowStockAlerts, salesPurchaseChartData, chartTotals } = professionalData;
    
    // Calculate alert counts for nav badge (actual system state, not filtered by dismissed)
    const alertCounts = {
        lowStock: lowStockAlerts.length,
        outOfStock: analytics?.professional?.outOfStockAlerts?.length || 0,
        pendingExpenses: analytics?.professional?.recentExpenses?.filter((expense: any) => expense.status === 'pending').length || 0,
    };
    
    const totalAlerts = alertCounts.lowStock + alertCounts.outOfStock + alertCounts.pendingExpenses;

    // Use real chart data from analytics
    const chartData = salesPurchaseChartData && salesPurchaseChartData.length > 0 ? salesPurchaseChartData : [];

    // Fetch sales overview data
    useEffect(() => {
        const fetchSalesOverview = async () => {
            setIsLoadingSalesOverview(true);
            try {
                const response = await fetch('/dashboard/sales-overview');
                if (response.ok) {
                    const data = await response.json();
                    setSalesOverviewData(data);
                }
            } catch (error) {
                console.error('Error fetching sales overview:', error);
            } finally {
                setIsLoadingSalesOverview(false);
            }
        };

        fetchSalesOverview();
    }, []);

    // Handle period change
    const handlePeriodChange = (newPeriod: string) => {
        setSelectedPeriod(newPeriod);
        // Reload the page with the new period parameter
        router.get('/admin-dashboard', { period: newPeriod }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // Handle chart export
    const handleExportChart = () => {
        if (salesChartRef) {
            const canvas = salesChartRef.canvas;
            const link = document.createElement('a');
            link.download = `sales-purchase-chart-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
        }
    };

    // Handle sale click - navigate to receipt
    const handleSaleClick = (saleId: number) => {
        router.get(`/receipts/${saleId}`);
    };

    return (
        <AppLayout 
            breadcrumbs={breadcrumbs}
            alertCounts={{
                lowStock: alertCounts.lowStock,
                outOfStock: alertCounts.outOfStock,
                pendingExpenses: alertCounts.pendingExpenses,
                total: totalAlerts
            }}
            analytics={analytics}
        >
            <Head title="Admin Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 bg-gray-50 pb-24 sm:pb-4">
                {/* Welcome Section */}
                <div className="space-y-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Welcome, Admin</h1>
                        
                    </div>
                    
                    {/* Alerts Section */}
                    <div className="space-y-3">
                        {/* Low Stock Alerts */}
                        {lowStockAlerts
                            .filter((product: any) => !dismissedLowStock.includes(product.id))
                            .slice(0, 2)
                            .map((product: any, index: number) => (
                            <div key={`low-stock-${product.id}`} className="bg-orange-50 border-l-4 border-orange-400 rounded-r-lg p-3 flex items-center justify-between">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 flex-shrink-0" />
                                    <div>
                                        <p className="text-orange-800 text-sm font-medium">
                                            {product.name} - {product.quantity} units left
                                        </p>
                                        <Link href="/products" className="text-orange-600 hover:underline text-xs">
                                            Add Stock
                                        </Link>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                        const newDismissed = [...dismissedLowStock, product.id];
                                        setDismissedLowStock(newDismissed);
                                        localStorage.setItem('dismissedLowStock', JSON.stringify(newDismissed));
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}

                        {/* Out of Stock Alerts */}
                        {analytics?.professional?.outOfStockAlerts
                            ?.filter((product: any) => !dismissedOutOfStock.includes(product.id))
                            ?.slice(0, 2)
                            ?.map((product: any, index: number) => (
                            <div key={`out-of-stock-${product.id}`} className="bg-red-50 border-l-4 border-red-400 rounded-r-lg p-3 flex items-center justify-between">
                                <div className="flex items-center">
                                    <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                                    <div>
                                        <p className="text-red-800 text-sm font-medium">
                                            {product.name} - Out of stock
                                        </p>
                                        <Link href="/products" className="text-red-600 hover:underline text-xs">
                                            Restock Now
                                        </Link>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                        const newDismissed = [...dismissedOutOfStock, product.id];
                                        setDismissedOutOfStock(newDismissed);
                                        localStorage.setItem('dismissedOutOfStock', JSON.stringify(newDismissed));
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}

                        {/* Expense Approval Alerts */}
                        {analytics?.professional?.recentExpenses
                            ?.filter((expense: any) => expense.status === 'pending' && !dismissedExpenses.includes(expense.id))
                            ?.slice(0, 2)
                            ?.map((expense: any, index: number) => (
                            <div key={`expense-${expense.id}`} className="bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg p-3 flex items-center justify-between">
                                <div className="flex items-center">
                                    <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                                    <div>
                                        <p className="text-yellow-800 text-sm font-medium">
                                            {expense.title} - Ksh {expense.amount.toLocaleString()}
                                        </p>
                                        <Link href="/expenses" className="text-yellow-600 hover:underline text-xs">
                                            Review Expense
                                        </Link>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                        const newDismissed = [...dismissedExpenses, expense.id];
                                        setDismissedExpenses(newDismissed);
                                        localStorage.setItem('dismissedExpenses', JSON.stringify(newDismissed));
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                    <KPICard
                        title="Total Sales"
                        value={kpi.totalSales.value}
                        change={kpi.totalSales.change}
                        changeType={kpi.totalSales.changeType}
                        icon={DollarSign}
                        color="orange"
                        bgColor="bg-orange-800"
                        tooltip="Total revenue generated from all completed sales transactions. This includes the sum of all items sold to customers."
                    />
                    <KPICard
                        title="Total Orders"
                        value={kpi.totalOrders.value}
                        change={kpi.totalOrders.change}
                        changeType={kpi.totalOrders.changeType}
                        icon={TrendingDown}
                        color="blue"
                        bgColor="bg-blue-800"
                        format="number"
                        tooltip="Total number of completed sales transactions. Each order represents a single customer purchase containing one or more items."
                    />
                    <KPICard
                        title="Cost of Goods Sold"
                        value={kpi.totalPurchase.value}
                        change={kpi.totalPurchase.change}
                        changeType={kpi.totalPurchase.changeType}
                        icon={Package}
                        color="green"
                        bgColor="bg-green-800"
                        tooltip="Total cost of inventory items that were sold to customers. This helps calculate your profit margins and business profitability."
                    />
                    <KPICard
                        title="Total Inventory Value"
                        value={kpi.totalInventoryValue.value}
                        change={kpi.totalInventoryValue.change}
                        changeType={kpi.totalInventoryValue.changeType}
                        icon={TrendingUp}
                        color="blue"
                        bgColor="bg-gray-900"
                        tooltip="Current value of all inventory items in stock, calculated using the cost price × quantity for each product."
                    />
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
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
                        title="Average Order Value"
                        value={financial.averageOrderValue.value}
                        change={financial.averageOrderValue.change}
                        changeType={financial.averageOrderValue.changeType}
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

                {/* Sales Overview Component */}
                <SalesOverview data={salesOverviewData} />

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Sales & Purchase Chart */}
                    <div className="lg:col-span-2 w-full">
                        <Card className="w-full">
                            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <CardTitle className="flex items-center">
                                    <BarChart3 className="h-5 w-5 mr-2" />
                                    Sales & Cost of Goods Sold (Ksh)
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
                                    
                                    {/* Export Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleExportChart}
                                        className="flex items-center gap-2"
                                        title="Export Chart as Image"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Export
                                    </Button>
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
                            <CardContent className="w-full overflow-hidden">
                                {/* Chart Totals - Responsive Layout */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 bg-orange-500 rounded-full flex-shrink-0"></div>
                                        <span className="text-sm">
                                            <span className="hidden sm:inline">Cost of Goods Sold: </span>
                                            <span className="sm:hidden">COGS: </span>
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
                                    <div className="min-w-[300px] w-full">
                                        <SalesChart data={chartData} onExport={setSalesChartRef} />
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
                                {recentSales.map((sale: any) => (
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
                                                    <span>{sale.items.reduce((total: any, item: any) => total + item.quantity, 0)} items</span>
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
                    {/* Top Products */}
                    <div>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle className="flex items-center">
                                    <Package className="h-5 w-5 mr-2" />
                                    Top Products
                                </CardTitle>
                                <Link href="/products" className="text-sm text-blue-600 hover:underline">
                                    View All
                                </Link>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3 sm:space-y-4">
                                    {topProducts.map((product: any, index: number) => (
                                        <div key={product.id} className="flex items-center justify-between py-2 sm:py-3">
                                            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                                                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center shadow-sm flex-shrink-0">
                                                    <span className="text-xs sm:text-sm font-semibold text-orange-700">
                                                        {product.initials}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                        <span className="hidden sm:inline">{product.sku} • </span>
                                                        <span className="sm:hidden">{product.sku}</span>
                                                        <span className="sm:hidden block">{product.total_quantity} sold</span>
                                                        <span className="hidden sm:inline">{product.total_quantity} sold</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right ml-2 flex-shrink-0">
                                                <p className="text-xs sm:text-sm font-bold text-gray-900">
                                                    {formatCurrency(product.total_revenue)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Categories */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Users className="h-5 w-5 mr-2" />
                                    Top Categories
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                                    {/* Chart Section */}
                                    <div className="flex-shrink-0">
                                        <CategoriesChart data={categories} />
                                    </div>
                                    
                                    {/* Key Section */}
                                    <div className="flex-1 w-full space-y-3">
                                        {/* Category Legend */}
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Categories</h4>
                                            {categories.categories.map((category: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center min-w-0 flex-1">
                                                        <div className={`w-3 h-3 rounded-full mr-3 flex-shrink-0 ${
                                                            index === 0 ? 'bg-orange-500' : 
                                                            index === 1 ? 'bg-blue-600' : 'bg-orange-300'
                                                        }`}></div>
                                                        <span className="text-gray-600 truncate">{category.name}</span>
                                                    </div>
                                                    <span className="font-medium text-gray-900 ml-2 flex-shrink-0">{category.sales} Sales</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        {/* Summary Stats */}
                                        <div className="pt-3 border-t border-gray-100 space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center min-w-0 flex-1">
                                                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                                                    <span className="text-gray-600 truncate">Total Categories</span>
                                                </div>
                                                <span className="font-medium text-gray-900 ml-2 flex-shrink-0">{categories.totalCategories}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center min-w-0 flex-1">
                                                    <div className="w-3 h-3 bg-orange-400 rounded-full mr-3 flex-shrink-0"></div>
                                                    <span className="text-gray-600 truncate">Total Products</span>
                                                </div>
                                                <span className="font-medium text-gray-900 ml-2 flex-shrink-0">{categories.totalProducts}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Statistics */}
                    <div>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-sm sm:text-base">
                                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                    Order Statistics (7 Days)
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <OrderStatisticsHeatmap data={orderStatistics} />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Shop Summary */}
                <div className="col-span-full">
                    <Card className="h-fit">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <CardTitle className="flex items-center text-lg">
                                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                                    <span className="text-base sm:text-lg">Shop Summary</span>
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm w-fit"
                                        onClick={() => router.get('/sales')}
                                    >
                                        View All Sales
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="text-orange-600 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm w-fit"
                                        onClick={() => router.get('/products')}
                                    >
                                        View All Products
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 pb-6 sm:pb-6">
                            <Tabs defaultValue="sale" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-6 h-auto bg-gray-100">
                                    <TabsTrigger value="sale" className="text-sm font-semibold py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600">
                                        Sales
                                    </TabsTrigger>
                                    <TabsTrigger value="low-stock" className="text-sm font-semibold py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600">
                                        Low Stock
                                    </TabsTrigger>
                                    <TabsTrigger value="out-of-stock" className="text-sm font-semibold py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-red-600">
                                        Out of Stock
                                    </TabsTrigger>
                                    <TabsTrigger value="expenses" className="text-sm font-semibold py-3 px-4 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-purple-600">
                                        Expenses
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="sale" className="mt-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Customer</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Sale ID</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics?.professional?.recentSales?.slice(0, 10).map((sale: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {sale.customer?.name || `Sale #${sale.id}`}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-sm text-gray-600">#{sale.id}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-sm text-gray-600">{sale.date}</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="text-sm font-semibold text-gray-900">{formatCurrency(sale.amount || sale.total || 0)}</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
                                                                Completed
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="low-stock" className="mt-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics?.professional?.lowStockAlerts?.slice(0, 4).map((product: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-sm text-gray-600">{product.sku}</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="text-sm font-semibold text-gray-900">{product.quantity} units</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                                                Low Stock
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="out-of-stock" className="mt-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Product</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">SKU</th>
                                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Quantity</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics?.professional?.outOfStockAlerts?.slice(0, 4).map((product: any, index: number) => (
                                                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                        <td className="py-3 px-4">
                                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="text-sm text-gray-600">{product.sku}</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-right">
                                                            <div className="text-sm font-semibold text-gray-900">0 units</div>
                                                        </td>
                                                        <td className="py-3 px-4 text-center">
                                                            <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200 text-xs">
                                                                Out of Stock
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                                
                                <TabsContent value="expenses" className="mt-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Title</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Category</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Added By</th>
                                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                                                    <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics?.professional?.recentExpenses && analytics.professional.recentExpenses.length > 0 ? (
                                                    analytics.professional.recentExpenses.slice(0, 4).map((expense: any, index: number) => (
                                                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-3 px-4">
                                                                <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="text-sm text-gray-600">{expense.category}</div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="text-sm text-gray-600">{expense.added_by}</div>
                                                            </td>
                                                            <td className="py-3 px-4 text-right">
                                                                <div className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="text-sm text-gray-600">{expense.date}</div>
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                                                    {expense.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={6} className="py-8 text-center text-gray-500">
                                                            <div className="text-4xl mb-2">💰</div>
                                                            <p className="text-sm">No expenses recorded</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
