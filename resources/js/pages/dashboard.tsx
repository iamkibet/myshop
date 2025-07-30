import { usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/icon';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager';
}

interface PageProps {
    auth: {
        user: User;
    };
}

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
                        <p className="text-muted-foreground">
                            You are logged in as a <Badge variant="outline">{user.role}</Badge>
                        </p>
                    </div>
                </div>

                {isAdmin && (
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Products</CardTitle>
                                <Icon name="package" className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Manage Inventory</div>
                                <p className="text-xs text-muted-foreground">
                                    Add, edit, and manage products
                                </p>
                                <Link href="/products" className="mt-2 inline-block">
                                    <Button size="sm" variant="outline">
                                        View Products
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Users</CardTitle>
                                <Icon name="users" className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">User Management</div>
                                <p className="text-xs text-muted-foreground">
                                    Manage user accounts and roles
                                </p>
                                <Link href="/users" className="mt-2 inline-block">
                                    <Button size="sm" variant="outline">
                                        View Users
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Analytics</CardTitle>
                                <Icon name="bar-chart" className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Sales Reports</div>
                                <p className="text-xs text-muted-foreground">
                                    View sales analytics and reports
                                </p>
                                <Button size="sm" variant="outline" className="mt-2">
                                    View Analytics
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {isManager && (
                    <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Shopping Cart</CardTitle>
                                <Icon name="shopping-cart" className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Process Sales</div>
                                <p className="text-xs text-muted-foreground">
                                    Add items to cart and complete sales
                                </p>
                                <Link href="/cart" className="mt-2 inline-block">
                                    <Button size="sm" variant="outline">
                                        Go to Cart
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">My Sales</CardTitle>
                                <Icon name="receipt" className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">View History</div>
                                <p className="text-xs text-muted-foreground">
                                    View your sales history and receipts
                                </p>
                                <Button size="sm" variant="outline" className="mt-2">
                                    View Sales
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
