import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { DollarSign, Edit, Eye, Plus, Receipt, TrendingUp, Filter, Calendar, Search, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';

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
    total_sales: number;
    total_profit: number;
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
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [status, setStatus] = useState(filters.status || 'all');

    const handleFilter = () => {
        router.get(
            '/expenses',
            {
                search,
                category: category === 'all' ? undefined : category,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
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
        setDateFrom('');
        setDateTo('');
        setStatus('all');
        router.get('/expenses');
    };

    const handleApprove = (expenseId: number) => {
        if (confirm('Are you sure you want to approve this expense?')) {
            router.post(`/expenses/${expenseId}/approve`);
        }
    };

    const handleReject = (expenseId: number) => {
        const notes = prompt('Please provide a reason for rejection:');
        if (notes !== null) {
            router.post(`/expenses/${expenseId}/reject`, { approval_notes: notes });
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

    return (
        <AppLayout>
            <Head title="Expenses" />

            <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl pb-20 sm:pb-8">
                {/* Header Section */}
                <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                {userRole === 'manager' ? 'My Expenses' : 'Expenses Management'}
                            </h1>
                            <p className="mt-2 text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
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
                                    <Button variant="outline" size="lg" className="w-full bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
                                        <svg className="mr-2 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        {pendingExpensesCount} Pending
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Cards - Mobile Optimized */}
                {userRole === 'admin' ? (
                    // Admin sees full summary with sales and profit
                    <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Expenses
                                </CardTitle>
                                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(summary.total_expenses)}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    All time expenses
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Total Sales
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(summary.total_sales)}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    All time sales
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800 sm:col-span-2 lg:col-span-1">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Net Profit
                                </CardTitle>
                                <DollarSign className={`h-4 w-4 sm:h-5 sm:w-5 ${summary.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl sm:text-3xl font-bold ${summary.total_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatCurrency(summary.total_profit)}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Sales minus expenses
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    // Manager sees only their expense summary
                    <div className="grid gap-4 sm:gap-6 mb-6 sm:mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                    My Total Expenses
                                </CardTitle>
                                <Receipt className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(summary.total_expenses)}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Your total expenses
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Pending Expenses
                                </CardTitle>
                                <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-yellow-400 flex items-center justify-center">
                                    <span className="text-white text-xs">!</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {expenses.data.filter(e => e.status === 'pending').length}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Awaiting approval
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800 sm:col-span-2 lg:col-span-1">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                <CardTitle className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
                                    Approved Expenses
                                </CardTitle>
                                <div className="h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-green-400 flex items-center justify-center">
                                    <span className="text-white text-xs">✓</span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {expenses.data.filter(e => e.status === 'approved').length}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Successfully approved
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters Section - Mobile Optimized */}
                <Card className="mb-6 sm:mb-8 border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                            <CardTitle className="text-base sm:text-lg font-semibold">Filter Expenses</CardTitle>
                        </div>
                        <CardDescription className="text-sm">Refine your expense data by various criteria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                <Label htmlFor="search" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                                    <Search className="h-3 w-3 sm:h-4 sm:w-4" />
                                    Search
                                </Label>
                                <Input 
                                    id="search" 
                                    placeholder="Search expenses..." 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="border-gray-200 dark:border-gray-700 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-xs sm:text-sm font-medium">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="border-gray-200 dark:border-gray-700 text-sm">
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All categories</SelectItem>
                                        {Object.entries(categories).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                {value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_from" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                    From Date
                                </Label>
                                <Input 
                                    id="date_from" 
                                    type="date" 
                                    value={dateFrom} 
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="border-gray-200 dark:border-gray-700 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_to" className="text-xs sm:text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                    To Date
                                </Label>
                                <Input 
                                    id="date_to" 
                                    type="date" 
                                    value={dateTo} 
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="border-gray-200 dark:border-gray-700 text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-xs sm:text-sm font-medium">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger className="border-gray-200 dark:border-gray-700 text-sm">
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <Button onClick={handleFilter} size="sm" className="w-full sm:w-auto px-6">
                                Apply Filters
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="sm" className="w-full sm:w-auto px-6">
                                Reset Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Breakdown - Admin Only */}
                {userRole === 'admin' && (
                    <Card className="mb-6 sm:mb-8 border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                                <CardTitle className="text-base sm:text-lg font-semibold">
                                    Expenses by Category
                                </CardTitle>
                            </div>
                            <CardDescription className="text-sm">
                                Breakdown of expenses by category
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                {summary.category_totals.map((item) => (
                                    <div key={item.category} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 bg-gray-50/50 dark:bg-gray-800/50 space-y-2 sm:space-y-0">
                                        <div className="text-center sm:text-left">
                                            <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100">
                                                {categories[item.category] || item.category}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {((item.total / summary.total_expenses) * 100).toFixed(1)}% of total
                                            </p>
                                        </div>
                                        <div className="text-center sm:text-right">
                                            <p className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                {formatCurrency(item.total)}
                                            </p>
                                            <Badge className={`mt-1 text-xs ${getCategoryColor(item.category)}`}>
                                                {item.category}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Expenses List - Mobile Optimized */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-base sm:text-lg font-semibold">
                            {userRole === 'manager' ? 'My Expenses' : 'All Expenses'}
                        </CardTitle>
                        <CardDescription className="text-sm">
                            {userRole === 'manager' ? 'Complete list of your expenses with proof of purchase' : 'Complete list of all expenses with details'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 sm:space-y-4">
                            {expenses.data.length === 0 ? (
                                <div className="py-8 sm:py-12 text-center">
                                    <Receipt className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                    <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        No expenses found
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                                        {search || category !== 'all' || dateFrom || dateTo 
                                            ? 'Try adjusting your filters' 
                                            : 'Start by adding your first expense'
                                        }
                                    </p>
                                </div>
                            ) : (
                                expenses.data.map((expense) => (
                                    <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-white dark:bg-gray-900 hover:shadow-sm transition-shadow space-y-3 sm:space-y-0">
                                        <div className="flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between sm:justify-start gap-2 sm:gap-4 mb-2">
                                                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                                                            {expense.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={`${getCategoryColor(expense.category)} text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-1`}>
                                                                {categories[expense.category]}
                                                            </Badge>
                                                            <Badge className={`text-xs px-2 py-1 sm:text-sm sm:px-3 sm:py-1 ${
                                                                expense.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                                                expense.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                                            }`}>
                                                                {expense.status === 'approved' ? '✓ Approved' :
                                                                 expense.status === 'rejected' ? '✗ Rejected' :
                                                                 '⏳ Pending'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {expense.description && (
                                                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                                                            {expense.description}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            {new Date(expense.expense_date).toLocaleDateString()}
                                                        </span>
                                                        <span className="hidden sm:inline">•</span>
                                                        <span>Added by {expense.added_by.name}</span>
                                                        {expense.receipt_path && (
                                                            <>
                                                                <span className="hidden sm:inline">•</span>
                                                                <div className="flex items-center gap-2">
                                                                    <Button 
                                                                        variant="link" 
                                                                        size="sm" 
                                                                        className="h-auto p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline"
                                                                        onClick={() => window.open(`/expenses/${expense.id}/receipt`, '_blank')}
                                                                    >
                                                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                                        View
                                                                    </Button>
                                                                    <Button 
                                                                        variant="link" 
                                                                        size="sm" 
                                                                        className="h-auto p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:underline"
                                                                        onClick={() => {
                                                                            const link = document.createElement('a');
                                                                            link.href = `/expenses/${expense.id}/receipt?download=true`;
                                                                            link.download = '';
                                                                            link.click();
                                                                        }}
                                                                    >
                                                                        <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                        Download
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                            <div className="text-center sm:text-right">
                                                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(expense.amount)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Added {new Date(expense.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-center sm:justify-end gap-2">
                                                {userRole === 'admin' && expense.status === 'pending' && (
                                                    <>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 px-3 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                                            onClick={() => handleApprove(expense.id)}
                                                        >
                                                            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                            <span className="ml-1 sm:hidden">Approve</span>
                                                        </Button>
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm" 
                                                            className="h-8 px-3 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                                            onClick={() => handleReject(expense.id)}
                                                        >
                                                            <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                            <span className="ml-1 sm:hidden">Reject</span>
                                                        </Button>
                                                    </>
                                                )}
                                                
                                                {/* View Button - Primary action for managers */}
                                                <Link href={`/expenses/${expense.id}`}>
                                                    <Button size="sm" className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                                        <span className="ml-1 sm:hidden">View Details</span>
                                                    </Button>
                                                </Link>
                                                
                                                {/* Edit Button - Only for pending expenses or admins */}
                                                {(expense.status === 'pending' || userRole === 'admin') && (
                                                    <Link href={`/expenses/${expense.id}/edit`}>
                                                        <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                                                            <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                                            <span className="ml-1 sm:hidden">Edit</span>
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination - Mobile Optimized */}
                        {expenses.links && expenses.links.length > 3 && (
                            <div className="mt-6 sm:mt-8 flex items-center justify-center">
                                <nav className="flex items-center gap-1 sm:gap-2">
                                    {expenses.links.map((link: any, index: number) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                                                link.active
                                                    ? 'bg-blue-600 text-white'
                                                    : link.url
                                                    ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                    : 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </nav>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
