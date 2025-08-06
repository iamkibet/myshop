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

interface ProductVariant {
    id: number;
    product_id: number;
    color?: string;
    size?: string;
    sku: string;
    quantity: number;
    cost_price: number;
    selling_price: number;
    discount_price?: number;
    image_url?: string;
    is_active: boolean;
    low_stock_threshold: number;
}

interface Product {
    id: number;
    name: string;
    description?: string;
    brand: string;
    category: string;
    image_url?: string;
    features?: string[];
    meta_title?: string;
    meta_description?: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    variants?: ProductVariant[];
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
    flash?: {
        success?: string;
        error?: string;
    };
}

// Helper function to get stock status for a product based on its variants
const getProductStockStatus = (product: Product) => {
    if (!product.variants || product.variants.length === 0) {
        return { status: 'No Variants', color: 'destructive' as const };
    }

    const inStockVariants = product.variants.filter((v) => v.quantity > 0);
    const lowStockVariants = product.variants.filter((v) => v.quantity > 0 && v.quantity <= v.low_stock_threshold);

    if (inStockVariants.length === 0) {
        return { status: 'Out of Stock', color: 'destructive' as const };
    }

    if (lowStockVariants.length > 0) {
        return { status: 'Low Stock', color: 'secondary' as const };
    }

    return { status: 'In Stock', color: 'default' as const };
};

// Helper function to get total quantity from variants
const getProductTotalQuantity = (product: Product): number => {
    if (!product.variants || product.variants.length === 0) {
        return 0;
    }

    return product.variants.reduce((total, variant) => total + variant.quantity, 0);
};

// Helper function to get minimum price from variants
const getProductMinPrice = (product: Product): number => {
    if (!product.variants || product.variants.length === 0) {
        return 0;
    }

    const activeVariants = product.variants.filter((v) => v.is_active);
    if (activeVariants.length === 0) {
        return 0;
    }

    return Math.min(...activeVariants.map((v) => v.selling_price));
};

// Helper function to get maximum price from variants
const getProductMaxPrice = (product: Product): number => {
    if (!product.variants || product.variants.length === 0) {
        return 0;
    }

    const activeVariants = product.variants.filter((v) => v.is_active);
    if (activeVariants.length === 0) {
        return 0;
    }

    return Math.max(...activeVariants.map((v) => v.selling_price));
};

// Helper function to get variant count
const getVariantCount = (product: Product): number => {
    return product.variants?.length || 0;
};

export default function ProductsIndex({ products, filters, flash }: ProductsIndexProps) {
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
                {/* Success Message */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-green-800">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

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
                                        <th className="p-2 text-left font-medium">Variants</th>
                                        <th className="p-2 text-left font-medium">Price Range</th>
                                        <th className="p-2 text-left font-medium">Stock</th>
                                        <th className="p-2 text-left font-medium">Status</th>
                                        <th className="p-2 text-left font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((product) => {
                                        const stockStatus = getProductStockStatus(product);
                                        const totalQuantity = getProductTotalQuantity(product);
                                        const minPrice = getProductMinPrice(product);
                                        const maxPrice = getProductMaxPrice(product);
                                        const variantCount = getVariantCount(product);
                                        const hasStock = totalQuantity > 0;

                                        return (
                                            <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-2">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
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
                                                <td className="p-2">
                                                    <div className="text-sm">
                                                        <span className="font-medium">{variantCount}</span>
                                                        <span className="text-muted-foreground"> variants</span>
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="text-sm">
                                                        {minPrice === maxPrice ? (
                                                            formatCurrency(minPrice)
                                                        ) : (
                                                            <>
                                                                {formatCurrency(minPrice)} - {formatCurrency(maxPrice)}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-sm">{totalQuantity}</span>
                                                        {hasStock &&
                                                            product.variants?.some((v) => v.quantity > 0 && v.quantity <= v.low_stock_threshold) && (
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
                                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
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
