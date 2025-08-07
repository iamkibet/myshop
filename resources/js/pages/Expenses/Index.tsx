import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { DollarSign, Edit, Eye, Plus, Receipt, TrendingUp } from 'lucide-react';
import { useState } from 'react';

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
    const [category, setCategory] = useState(filters.category || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(
            '/expenses',
            {
                search,
                category: category || undefined,
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
        setCategory('');
        setDateFrom('');
        setDateTo('');
        router.get('/expenses');
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            rent: 'bg-red-100 text-red-800',
            utilities: 'bg-blue-100 text-blue-800',
            inventory: 'bg-green-100 text-green-800',
            maintenance: 'bg-yellow-100 text-yellow-800',
            marketing: 'bg-purple-100 text-purple-800',
            other: 'bg-gray-100 text-gray-800',
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    return (
        <>
            <Head title="Expenses" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                        <p className="text-muted-foreground">Track and manage shop expenses</p>
                    </div>
                    <Link href="/expenses/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Expense
                        </Button>
                    </Link>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                            <Receipt className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_expenses)}</div>
                            <p className="text-xs text-muted-foreground">All time expenses</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_sales)}</div>
                            <p className="text-xs text-muted-foreground">All time sales</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${summary.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(summary.total_profit)}
                            </div>
                            <p className="text-xs text-muted-foreground">Sales minus expenses</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                        <CardDescription>Filter expenses by various criteria</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <Label htmlFor="search">Search</Label>
                                <Input id="search" placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            </div>

                            <div>
                                <Label htmlFor="category">Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All categories</SelectItem>
                                        {Object.entries(categories).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                {value}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="date_from">From Date</Label>
                                <Input id="date_from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                            </div>

                            <div>
                                <Label htmlFor="date_to">To Date</Label>
                                <Input id="date_to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center space-x-2">
                            <Button onClick={handleFilter} size="sm">
                                Apply Filters
                            </Button>
                            <Button onClick={handleReset} variant="outline" size="sm">
                                Reset
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Category Totals */}
                <Card>
                    <CardHeader>
                        <CardTitle>Expenses by Category</CardTitle>
                        <CardDescription>Breakdown of expenses by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            {summary.category_totals.map((item) => (
                                <div key={item.category} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-medium">{categories[item.category] || item.category}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {((item.total / summary.total_expenses) * 100).toFixed(1)}% of total
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatCurrency(item.total)}</p>
                                        <Badge className={getCategoryColor(item.category)}>{item.category}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Expenses List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Expenses</CardTitle>
                        <CardDescription>Complete list of all expenses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {expenses.data.length === 0 ? (
                                <p className="py-8 text-center text-sm text-muted-foreground">No expenses found</p>
                            ) : (
                                expenses.data.map((expense) => (
                                    <div key={expense.id} className="flex items-center justify-between rounded-lg border p-4">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <div>
                                                    <h3 className="font-medium">{expense.title}</h3>
                                                    <p className="text-sm text-muted-foreground">{expense.description}</p>
                                                </div>
                                                <Badge className={getCategoryColor(expense.category)}>{categories[expense.category]}</Badge>
                                            </div>

                                            <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
                                                <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                                                <span>Added by {expense.added_by.name}</span>
                                                {expense.receipt_path && (
                                                    <Link href={`/expenses/${expense.id}/receipt`} className="text-blue-600 hover:underline">
                                                        View Receipt
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <div className="text-right">
                                                <p className="font-medium">{formatCurrency(expense.amount)}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(expense.created_at).toLocaleDateString()}</p>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                                <Link href={`/expenses/${expense.id}/edit`}>
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                                <Link href={`/expenses/${expense.id}`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-3 w-3" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
