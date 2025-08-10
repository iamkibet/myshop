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
    };
}

export default function ExpensesIndex({ expenses, categories, summary, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(
            '/expenses',
            {
                search,
                category: category === 'all' ? undefined : category,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
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
        router.get('/expenses');
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

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                                Expenses Management
                            </h1>
                            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                                Track and manage your shop expenses with detailed analytics
                            </p>
                        </div>
                        <Link href="/expenses/create">
                            <Button size="lg" className="w-full sm:w-auto">
                                <Plus className="mr-2 h-5 w-5" />
                                Add New Expense
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-6 mb-8 md:grid-cols-3">
                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Expenses
                            </CardTitle>
                            <Receipt className="h-5 w-5 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(summary.total_expenses)}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                All time expenses
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Sales
                            </CardTitle>
                            <TrendingUp className="h-5 w-5 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(summary.total_sales)}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                All time sales
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Net Profit
                            </CardTitle>
                            <DollarSign className={`h-5 w-5 ${summary.total_profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-3xl font-bold ${summary.total_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(summary.total_profit)}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Sales minus expenses
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters Section */}
                <Card className="mb-8 border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <CardTitle className="text-lg font-semibold">Filter Expenses</CardTitle>
                        </div>
                        <CardDescription>Refine your expense data by various criteria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-4">
                            <div className="space-y-2">
                                <Label htmlFor="search" className="text-sm font-medium flex items-center gap-2">
                                    <Search className="h-4 w-4" />
                                    Search
                                </Label>
                                <Input 
                                    id="search" 
                                    placeholder="Search expenses..." 
                                    value={search} 
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="border-gray-200 dark:border-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="border-gray-200 dark:border-gray-700">
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
                                <Label htmlFor="date_from" className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    From Date
                                </Label>
                                <Input 
                                    id="date_from" 
                                    type="date" 
                                    value={dateFrom} 
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="border-gray-200 dark:border-gray-700"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_to" className="text-sm font-medium flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    To Date
                                </Label>
                                <Input 
                                    id="date_to" 
                                    type="date" 
                                    value={dateTo} 
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="border-gray-200 dark:border-gray-700"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-3">
                            <Button onClick={handleFilter} size="sm" className="px-6">
                                Apply Filters
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="sm" className="px-6">
                                Reset Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card className="mb-8 border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-gray-500" />
                            <CardTitle className="text-lg font-semibold">Expenses by Category</CardTitle>
                        </div>
                        <CardDescription>Breakdown of expenses by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            {summary.category_totals.map((item) => (
                                <div key={item.category} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-gray-50/50 dark:bg-gray-800/50">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {categories[item.category] || item.category}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {((item.total / summary.total_expenses) * 100).toFixed(1)}% of total
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {formatCurrency(item.total)}
                                        </p>
                                        <Badge className={`mt-1 ${getCategoryColor(item.category)}`}>
                                            {item.category}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses List */}
                <Card className="border-0 shadow-sm bg-white dark:bg-gray-900 dark:border-gray-800">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold">All Expenses</CardTitle>
                        <CardDescription>Complete list of all expenses with details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {expenses.data.length === 0 ? (
                                <div className="py-12 text-center">
                                    <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                                        No expenses found
                                    </p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">
                                        {search || category !== 'all' || dateFrom || dateTo 
                                            ? 'Try adjusting your filters' 
                                            : 'Start by adding your first expense'
                                        }
                                    </p>
                                </div>
                            ) : (
                                expenses.data.map((expense) => (
                                    <div key={expense.id} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900 hover:shadow-sm transition-shadow">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                                        {expense.title}
                                                    </h3>
                                                    {expense.description && (
                                                        <p className="text-gray-600 dark:text-gray-400 mb-3">
                                                            {expense.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="h-4 w-4" />
                                                            {new Date(expense.expense_date).toLocaleDateString()}
                                                        </span>
                                                        <span>Added by {expense.added_by.name}</span>
                                                        {expense.receipt_path && (
                                                            <Link 
                                                                href={`/expenses/${expense.id}/receipt`} 
                                                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                View Receipt
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge className={`${getCategoryColor(expense.category)} text-sm px-3 py-1`}>
                                                    {categories[expense.category]}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(expense.amount)}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Added {new Date(expense.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/expenses/${expense.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/expenses/${expense.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination */}
                        {expenses.links && expenses.links.length > 3 && (
                            <div className="mt-8 flex items-center justify-center">
                                <nav className="flex items-center gap-2">
                                    {expenses.links.map((link: any, index: number) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
