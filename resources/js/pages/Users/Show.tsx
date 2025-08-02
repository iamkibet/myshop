import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, DollarSign, Edit, Receipt, ShoppingCart, TrendingUp } from 'lucide-react';

interface SaleItem {
    id: number;
    quantity: number;
    price: number;
    product: {
        id: number;
        name: string;
        price: number;
    };
}

interface Sale {
    id: number;
    total_amount: number;
    created_at: string;
    saleItems: SaleItem[];
}

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager';
    created_at: string;
    sales: Sale[];
}

interface SalesStats {
    total_sales: number;
    total_revenue: number;
    total_products_sold: number;
    average_sale_value: number;
}

interface UsersShowProps {
    user: User;
    salesStats: SalesStats;
    recentSales: Sale[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Users',
        href: '/users',
    },
    {
        title: 'User Profile',
        href: '#',
    },
];

export default function UsersShow({ user, salesStats, recentSales }: UsersShowProps) {
    const getRoleBadgeVariant = (role: string) => {
        return role === 'admin' ? 'default' : 'secondary';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} - Profile`} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link href="/users">
                            <Button variant="outline" size="sm">
                                <Icon iconNode={ArrowLeft} className="mr-2 h-4 w-4" />
                                Back to Users
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <Link href={`/users/${user.id}/edit`}>
                        <Button>
                            <Icon iconNode={Edit} className="mr-2 h-4 w-4" />
                            Edit User
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {/* User Information */}
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>User Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                                    <p className="text-sm">{user.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                                    <p className="text-sm">{user.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                                    <div className="mt-1">
                                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                                    <p className="text-sm">{formatDate(user.created_at)}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sales Statistics */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales Performance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    <div className="text-center">
                                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                                            <Icon iconNode={ShoppingCart} className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <p className="text-2xl font-bold">{salesStats.total_sales}</p>
                                        <p className="text-sm text-muted-foreground">Total Sales</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                                            <Icon iconNode={DollarSign} className="h-6 w-6 text-green-600 dark:text-green-400" />
                                        </div>
                                        <p className="text-2xl font-bold">{formatCurrency(salesStats.total_revenue)}</p>
                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                                            <Icon iconNode={TrendingUp} className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <p className="text-2xl font-bold">{salesStats.total_products_sold}</p>
                                        <p className="text-sm text-muted-foreground">Products Sold</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                                            <Icon iconNode={Receipt} className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <p className="text-2xl font-bold">{formatCurrency(salesStats.average_sale_value)}</p>
                                        <p className="text-sm text-muted-foreground">Avg. Sale</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Recent Sales */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentSales.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="p-2 text-left">Sale ID</th>
                                            <th className="p-2 text-left">Date</th>
                                            <th className="p-2 text-left">Items</th>
                                            <th className="p-2 text-left">Total</th>
                                            <th className="p-2 text-left">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentSales.map((sale) => (
                                            <tr key={sale.id} className="border-b hover:bg-muted/50">
                                                <td className="p-2 font-medium">#{sale.id}</td>
                                                <td className="p-2 text-sm text-muted-foreground">{formatDate(sale.created_at)}</td>
                                                <td className="p-2 text-sm text-muted-foreground">{sale.saleItems.length} items</td>
                                                <td className="p-2 font-medium">{formatCurrency(sale.total_amount)}</td>
                                                <td className="p-2">
                                                    <Link href={`/receipts/${sale.id}`}>
                                                        <Button variant="outline" size="sm">
                                                            <Icon iconNode={Receipt} className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center">
                                <p className="text-muted-foreground">No sales found for this user.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
