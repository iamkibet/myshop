import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Edit, Filter, Package, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Products',
        href: '/products',
    },
];

interface Product {
    id: number;
    name: string;
    sku: string;
    description?: string;
    brand: string;
    category: string;
    cost_price: number | string;
    msrp: number | string;
    quantity_on_hand: number;
    low_stock_threshold: number;
    images?: string[];
    sizes?: string[];
    colors?: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface ProductsIndexProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from?: number;
        to?: number;
    };
    filters: {
        search?: string;
        stock_filter?: string;
    };
}

// Helper function to safely format currency
const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'destructive' as const };
    if (quantity <= threshold) return { status: 'Low Stock', color: 'secondary' as const };
    return { status: 'In Stock', color: 'default' as const };
};

export default function ProductsIndex({ products, filters }: ProductsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [stockFilter, setStockFilter] = useState(filters.stock_filter || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/products',
            {
                search: value,
                stock_filter: stockFilter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleStockFilter = (filter: string) => {
        setStockFilter(filter);
        router.get(
            '/products',
            {
                search: search,
                stock_filter: filter,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDelete = (productId: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            router.delete(`/products/${productId}`);
        }
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/products',
            {
                search: search,
                stock_filter: stockFilter,
                page: page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Products</h1>
                        <p className="text-muted-foreground">Manage your product inventory</p>
                    </div>
                    <Link href="/products/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Inventory</CardTitle>
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="max-w-sm pl-10"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <Button variant={stockFilter === '' ? 'default' : 'outline'} size="sm" onClick={() => handleStockFilter('')}>
                                    All
                                </Button>
                                <Button
                                    variant={stockFilter === 'low_stock' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStockFilter('low_stock')}
                                >
                                    Low Stock
                                </Button>
                                <Button
                                    variant={stockFilter === 'out_of_stock' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleStockFilter('out_of_stock')}
                                >
                                    Out of Stock
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2 text-left font-medium">Image</th>
                                        <th className="p-2 text-left font-medium">Name</th>
                                        <th className="p-2 text-left font-medium">Brand</th>
                                        <th className="p-2 text-left font-medium">Category</th>
                                        <th className="p-2 text-left font-medium">SKU</th>
                                        <th className="p-2 text-left font-medium">Cost Price</th>
                                        <th className="p-2 text-left font-medium">MSRP</th>
                                        <th className="p-2 text-left font-medium">Stock</th>
                                        <th className="p-2 text-left font-medium">Status</th>
                                        <th className="p-2 text-left font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((product) => {
                                        const stockStatus = getStockStatus(product.quantity_on_hand, product.low_stock_threshold);
                                        return (
                                            <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-2">
                                                    {product.images && product.images.length > 0 ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            className="h-12 w-12 rounded-md border object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src =
                                                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
                                                            <Package className="h-6 w-6 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    <div>
                                                        <div className="font-medium">{product.name}</div>
                                                        {product.description && (
                                                            <div className="max-w-xs truncate text-xs text-muted-foreground">
                                                                {product.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2 text-sm">{product.brand}</td>
                                                <td className="p-2 text-sm">{product.category}</td>
                                                <td className="p-2 text-sm text-muted-foreground">{product.sku}</td>
                                                <td className="p-2">{formatCurrency(product.cost_price)}</td>
                                                <td className="p-2">{formatCurrency(product.msrp)}</td>
                                                <td className="p-2">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-sm">{product.quantity_on_hand}</span>
                                                        {product.quantity_on_hand <= product.low_stock_threshold && (
                                                            <AlertTriangle className="text-warning h-3 w-3" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <Badge variant={stockStatus.color}>{stockStatus.status}</Badge>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Link href={`/products/${product.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(product.id)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {products.data.length === 0 && (
                            <div className="py-8 text-center">
                                <p className="text-muted-foreground">No products found.</p>
                            </div>
                        )}

                        {/* Pagination */}
                        {products.last_page > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-muted-foreground">
                                    Showing {products.from || 0} to {products.to || 0} of {products.total} results
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(products.current_page - 1)}
                                        disabled={products.current_page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <div className="flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, products.last_page) }, (_, i) => {
                                            const page = i + 1;
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={page === products.current_page ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => handlePageChange(page)}
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handlePageChange(products.current_page + 1)}
                                        disabled={products.current_page === products.last_page}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
