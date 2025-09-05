import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { DollarSign, Edit, Eye, Plus, Receipt, TrendingUp, Filter, Calendar, Search, BarChart3, TrendingDown, Hash, AtSign, Clock, Info, Check, X } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import KPICard from '@/components/KPICard';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);


interface Expense {
    id: number;
    title: string;
    description?: string;
    amount: number;
    category: string;
    expense_date: string;
    receipt_path?: string;
    status: 'pending' | 'approved' | 'rejected';
    is_approved: boolean;
    approved_at?: string;
    approved_by?: {
        name: string;
    };
    approval_notes?: string;
    added_by: {
        name: string;
    };
    created_at: string;
}

interface Summary {
    total_expenses: number;
    total_sales?: number;
    total_gross_profit?: number;
    total_profit?: number;
    net_profit_margin?: number;
    monthly_expenses: Array<{
        month: number;
        total: number;
    }>;
    category_totals: Array<{
        category: string;
        total: number;
    }>;
}

interface Props {
    expenses: {
        data: Expense[];
        links: any[];
    };
    categories: Record<string, string>;
    summary: Summary;
    filters: {
        search?: string;
        category?: string;
        date_from?: string;
        date_to?: string;
        status?: string;
    };
    userRole: string;
    pendingExpensesCount: number;
}

export default function ExpensesIndex({ expenses, categories, summary, filters, userRole, pendingExpensesCount }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || 'all');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleFilter = () => {
        router.get(
            '/expenses',
            {
                search,
                category: category === 'all' ? undefined : category,
                status: status === 'all' ? undefined : status,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleReset = () => {
        setSearch('');
        setCategory('all');
        setStatus('all');
        router.get('/expenses');
    };

    const handleApprove = (expenseId: number) => {
        if (confirm('Are you sure you want to approve this expense?')) {
            router.post(`/expenses/${expenseId}/approve`);
        }
    };

    const handleReject = (expenseId: number) => {
        if (confirm('Are you sure you want to reject this expense?')) {
            router.post(`/expenses/${expenseId}/reject`);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            rent: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
            utilities: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            inventory: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
            maintenance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            marketing: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        };
        return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    };

    const getPieChartColors = (category: string) => {
        const colors: Record<string, string> = {
            rent: '#EF4444', // red-500
            utilities: '#3B82F6', // blue-500
            inventory: '#10B981', // green-500
            maintenance: '#F59E0B', // yellow-500
            marketing: '#8B5CF6', // purple-500
            other: '#6B7280', // gray-500
        };
        return colors[category] || colors['other'];
    };

    const preparePieChartData = () => {
        if (!summary.category_totals || summary.category_totals.length === 0) {
            return {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }]
            };
        }

        const labels = summary.category_totals.map(item => categories[item.category] || item.category);
        const data = summary.category_totals.map(item => item.total);
        const backgroundColors = summary.category_totals.map(item => getPieChartColors(item.category));
        const borderColors = summary.category_totals.map(item => getPieChartColors(item.category));

        return {
            labels,
            datasets: [{
                data,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 2,
                hoverOffset: 4
            }]
        };
    };

    const pieChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                    font: {
                        size: 12,
                        family: 'Inter, sans-serif',
                        weight: 'normal' as const
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
                cornerRadius: 8,
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
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${context.label}: Ksh ${value.toLocaleString()} (${percentage}%)`;
                    }
                }
            }
        }
    };

    return (
        <AppLayout>
            <Head title="Expenses" />
            <div className="flex h-full flex-1 flex-col gap-4 sm:gap-6 overflow-x-auto rounded-xl p-3 sm:p-4 bg-gray-50 pb-24 sm:pb-4">
                {/* Welcome Section */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                {userRole === 'manager' ? 'My Expenses' : 'Expenses Management'}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 mt-1">
                                {userRole === 'manager' 
                                    ? 'Track and manage your personal expenses with proof of purchase' 
                                    : 'Track and manage your shop expenses with detailed analytics'
                                }
                            </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                            <Link href="/expenses/create" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full">
                                    <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    Add New Expense
                                </Button>
                            </Link>
                            
                            {userRole === 'admin' && pendingExpensesCount > 0 && (
                                <Link href="/expenses/pending/approval" className="w-full sm:w-auto">
                                    <Button variant="outline" size="lg" className="w-full bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100">
                                        <Clock className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        {pendingExpensesCount} Pending
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Cards - Matching Dashboard Style */}
                {userRole === 'admin' ? (
                    // Admin sees full summary with sales and profit
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        <KPICard
                            title="Total Expenses"
                            value={summary.total_expenses}
                            change={15}
                            changeType="increase"
                            icon={Receipt}
                            color="red"
                            bgColor="bg-red-800"
                            tooltip="Total amount spent on all business expenses including rent, utilities, inventory, maintenance, and other operational costs."
                        />
                        <KPICard
                            title="Total Sales"
                            value={summary.total_sales || 0}
                            change={25}
                            changeType="increase"
                            icon={TrendingUp}
                            color="green"
                            bgColor="bg-green-800"
                            tooltip="Total revenue generated from all completed sales transactions. This represents your gross income before expenses."
                        />
                        <KPICard
                            title="Net Profit"
                            value={summary.total_profit || 0}
                            change={8}
                            changeType="increase"
                            icon={DollarSign}
                            color="blue"
                            bgColor="bg-blue-800"
                            tooltip="Net profit calculated as total sales minus total expenses. This shows your actual business profitability."
                        />
                        <KPICard
                            title="Profit Margin"
                            value={summary.net_profit_margin || 0}
                            change={5}
                            changeType="increase"
                            icon={AtSign}
                            color="blue"
                            bgColor="bg-gray-900"
                            format="number"
                            tooltip="Net profit margin as a percentage of total sales. Higher percentages indicate better profitability efficiency."
                        />
                    </div>
                ) : (
                    // Manager sees only their expense summary
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        <KPICard
                            title="My Total Expenses"
                            value={summary.total_expenses}
                            change={12}
                            changeType="increase"
                            icon={Receipt}
                            color="red"
                            bgColor="bg-red-800"
                            tooltip="Total amount of expenses you have submitted for approval. This includes all your expense claims."
                        />
                        <KPICard
                            title="Pending Expenses"
                            value={expenses.data.filter(e => e.status === 'pending').length}
                            change={3}
                            changeType="increase"
                            icon={Clock}
                            color="yellow"
                            bgColor="bg-yellow-600"
                            format="number"
                            tooltip="Number of your expense claims that are currently awaiting approval from administrators."
                        />
                        <KPICard
                            title="Approved Expenses"
                            value={expenses.data.filter(e => e.status === 'approved').length}
                            change={18}
                            changeType="increase"
                            icon={Check}
                            color="green"
                            bgColor="bg-green-800"
                            format="number"
                            tooltip="Number of your expense claims that have been successfully approved by administrators."
                        />
                        <KPICard
                            title="Rejected Expenses"
                            value={expenses.data.filter(e => e.status === 'rejected').length}
                            change={2}
                            changeType="increase"
                            icon={X}
                            color="red"
                            bgColor="bg-red-600"
                            format="number"
                            tooltip="Number of your expense claims that have been rejected by administrators and need to be resubmitted."
                        />
                    </div>
                )}

                {/* Business Health Overview - Only for Admins */}
                {userRole === 'admin' && (
                    <Card className="bg-white border-0 shadow-sm">
                        <CardHeader className="pb-3 sm:pb-4">
                            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Business Health Overview
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Key performance indicators and expense efficiency metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                                {/* Expense-to-Sales Ratio */}
                                <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                                    <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
                                        {summary.total_sales && summary.total_sales > 0 ? ((summary.total_expenses / summary.total_sales) * 100).toFixed(1) : 0}%
                                    </div>
                                    <p className="text-sm text-blue-700 font-medium">
                                        Expense Ratio
                                    </p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Expenses as % of sales
                                    </p>
                                </div>

                                {/* Average Monthly Expenses */}
                                <div className="text-center p-4 rounded-lg bg-purple-50 border border-purple-200">
                                    <div className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">
                                        {formatCurrency(summary.monthly_expenses && summary.monthly_expenses.length > 0 
                                            ? summary.monthly_expenses.reduce((sum, month) => sum + month.total, 0) / summary.monthly_expenses.length 
                                            : 0
                                        )}
                                    </div>
                                    <p className="text-sm text-purple-700 font-medium">
                                        Avg Monthly Expenses
                                    </p>
                                    <p className="text-xs text-purple-600 mt-1">
                                        Based on available data
                                    </p>
                                </div>

                                {/* Top Spending Category */}
                                <div className="text-center p-4 rounded-lg bg-orange-50 border border-orange-200">
                                    <div className="text-2xl sm:text-3xl font-bold text-orange-900 mb-2">
                                        {summary.category_totals && summary.category_totals.length > 0 
                                            ? (summary.category_totals[0].total / summary.total_expenses * 100).toFixed(0) + '%'
                                            : '0%'
                                        }
                                    </div>
                                    <p className="text-sm text-orange-700 font-medium">
                                        Top Category
                                    </p>
                                    <p className="text-xs text-orange-600 mt-1">
                                        {summary.category_totals && summary.category_totals.length > 0 
                                            ? categories[summary.category_totals[0].category] || summary.category_totals[0].category
                                            : 'No data'
                                        }
                                    </p>
                                </div>

                                {/* Expense Growth Rate */}
                                <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                                    <div className="text-2xl sm:text-3xl font-bold text-green-900 mb-2">
                                        +12%
                                    </div>
                                    <p className="text-sm text-green-700 font-medium">
                                        Growth Rate
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        Month-over-month
                                    </p>
                                </div>
                            </div>

                            {/* Monthly Expense Trends */}
                            {summary.monthly_expenses && summary.monthly_expenses.length > 0 && (
                                <div className="mt-6">
                                    <h4 className="font-semibold text-gray-900 mb-4 text-center sm:text-left">
                                        Monthly Expense Trends
                                    </h4>
                                    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                                        {summary.monthly_expenses.slice(-6).map((monthData, index) => {
                                            const monthName = new Date(2024, monthData.month - 1).toLocaleDateString('en-US', { month: 'short' });
                                            return (
                                                <div key={index} className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                                                    <div className="text-sm font-medium text-gray-900 mb-1">
                                                        {monthName}
                                                    </div>
                                                    <div className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(monthData.total)}
                                                    </div>
                                                    <div className="text-xs text-gray-600">
                                                        Expenses
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Search and Filters - Dashboard Style */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">Search & Filter</CardTitle>
                        <CardDescription className="text-gray-600">Find and filter expenses by category, status, or search terms</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:space-x-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <Input 
                                    placeholder="Search expenses by title, description, or amount..."
                                        value={search} 
                                        onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10 h-10 sm:h-11 text-sm"
                                />
                            </div>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="w-full sm:w-48">
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="h-10 sm:h-11">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {Object.entries(categories).map(([key, value]) => (
                                                <SelectItem key={key} value={key}>
                                                    {value}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full sm:w-48">
                                    <Select value={status} onValueChange={setStatus}>
                                        <SelectTrigger className="h-10 sm:h-11">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="approved">Approved</SelectItem>
                                            <SelectItem value="rejected">Rejected</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleFilter} size="sm" className="h-10 sm:h-11 px-4">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                                <Button onClick={handleReset} variant="outline" size="sm" className="h-10 sm:h-11 px-4">
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Breakdown - Admin Only */}
                {userRole === 'admin' && summary.category_totals && summary.category_totals.length > 0 && (
                    <Card className="bg-white border-0 shadow-sm">
                        <CardHeader className="pb-3 sm:pb-4">
                            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                    Expenses by Category
                                </CardTitle>
                            <CardDescription className="text-gray-600">
                                Visual breakdown of expenses by category
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
                                {/* Pie Chart Section */}
                                <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
                                    <div className="w-full h-80 flex items-center justify-center">
                                        {summary.category_totals && summary.category_totals.length > 0 ? (
                                            <Pie 
                                                data={preparePieChartData()} 
                                                options={pieChartOptions}
                                            />
                                        ) : (
                                            <div className="text-center text-gray-500">
                                                <div className="text-4xl mb-2">🥧</div>
                                                <p className="text-sm">No category data available</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Category Details Section */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Category Breakdown</h4>
                                    <div className="space-y-3">
                                        {summary.category_totals.map((item, index) => (
                                            <div key={item.category} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div 
                                                        className="w-4 h-4 rounded-full flex-shrink-0" 
                                                        style={{ backgroundColor: getPieChartColors(item.category) }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {categories[item.category] || item.category}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {((item.total / summary.total_expenses) * 100).toFixed(1)}% of total
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-2 flex-shrink-0">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        {formatCurrency(item.total)}
                                                    </p>
                                                    <Badge className={`mt-1 text-xs ${getCategoryColor(item.category)}`}>
                                                        {item.category}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {/* Summary Stats */}
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Total Categories:</span>
                                            <span className="font-semibold text-gray-900">{summary.category_totals.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm mt-1">
                                            <span className="text-gray-600">Total Expenses:</span>
                                            <span className="font-semibold text-gray-900">{formatCurrency(summary.total_expenses)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Expenses List - Dashboard Style */}
                <Card className="bg-white border-0 shadow-sm">
                    <CardHeader className="pb-3 sm:pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
                            {userRole === 'manager' ? 'My Expenses' : 'All Expenses'}
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            {userRole === 'manager' ? 'Complete list of your expenses with proof of purchase' : 'Complete list of all expenses with details'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 sm:space-y-3">
                            {expenses.data.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="text-4xl mb-2">💰</div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Expenses Found</h3>
                                    <p className="text-gray-500 text-sm max-w-sm">
                                        {search || category !== 'all' || status !== 'all'
                                            ? 'Try adjusting your filters' 
                                            : 'Start by adding your first expense'
                                        }
                                    </p>
                                </div>
                            ) : (
                                expenses.data.map((expense) => (
                                    <div key={expense.id} className="p-3 sm:p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors">
                                        {/* Mobile Layout - Stacked */}
                                        <div className="block sm:hidden">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center space-x-3 min-w-0 flex-1">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-medium text-red-600">
                                                                {expense.id}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {expense.title}
                                                        </p>
                                                        <p className="text-lg font-bold text-gray-900 mt-1">
                                                            {formatCurrency(expense.amount)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className={`text-xs px-2 py-1 ${
                                                    expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                    expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {expense.status === 'approved' ? '✓ Approved' :
                                                     expense.status === 'rejected' ? '✗ Rejected' :
                                                     '⏳ Pending'}
                                                </Badge>
                                            </div>
                                            
                                            <div className="space-y-2 mb-3">
                                                <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="truncate">{expense.added_by.name}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Badge className={`text-xs px-2 py-0.5 ${getCategoryColor(expense.category)}`}>
                                                        {categories[expense.category]}
                                                    </Badge>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                <Link href={`/expenses/${expense.id}`} className="flex-1">
                                                    <Button 
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full h-8 text-xs"
                                                    >
                                                        <Eye className="h-3 w-3 mr-1" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                                {userRole === 'admin' && expense.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            onClick={() => handleApprove(expense.id)}
                                                            size="sm"
                                                            className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleReject(expense.id)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8 px-3 text-xs border-red-300 text-red-700 hover:bg-red-50"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Desktop Layout - Horizontal */}
                                        <div className="hidden sm:flex items-center justify-between">
                                            <div className="flex items-center space-x-4 min-w-0 flex-1">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                                        <span className="text-sm font-medium text-red-600">
                                                            {expense.id}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {expense.title}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                                        <div className="flex items-center space-x-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <span className="truncate">{expense.added_by.name}</span>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <Badge className={`text-xs px-2 py-0.5 ${getCategoryColor(expense.category)}`}>
                                                                {categories[expense.category]}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4 flex-shrink-0">
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-gray-900">{formatCurrency(expense.amount)}</p>
                                                    <div className="flex items-center space-x-1 mt-1">
                                                        <Badge className={`text-xs px-2 py-0.5 ${
                                                            expense.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                            expense.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                            {expense.status === 'approved' ? '✓ Approved' :
                                                             expense.status === 'rejected' ? '✗ Rejected' :
                                                             '⏳ Pending'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <Link href={`/expenses/${expense.id}`}>
                                                        <Button 
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            <Eye className="h-3 w-3 mr-1" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>
                                                    </Link>
                                                    {userRole === 'admin' && expense.status === 'pending' && (
                                                        <>
                                                            <Button
                                                                onClick={() => handleApprove(expense.id)}
                                                                size="sm"
                                                                className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 text-white"
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                <span className="hidden sm:inline">Approve</span>
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleReject(expense.id)}
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-7 px-2 text-xs border-red-300 text-red-700 hover:bg-red-50"
                                                            >
                                                                <X className="h-3 w-3 mr-1" />
                                                                <span className="hidden sm:inline">Reject</span>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination - Dashboard Style */}
                        {expenses.links && expenses.links.length > 3 && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-center">
                                <nav className="flex items-center gap-1 sm:gap-2">
                                    {expenses.links.map((link: any, index: number) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : link.url
                                                        ? 'text-gray-700 hover:bg-gray-100'
                                                        : 'text-gray-400 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}