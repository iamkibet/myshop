import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    category: string;
    description?: string;
    brand?: string;
    image_url?: string;
    sku: string;
    quantity: number;
    cost_price: number;
    selling_price: number;
    discount_price?: number;
    low_stock_threshold: number;
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
    categories: string[];
    brands: string[];
    filters: {
        search?: string;
        category?: string;
        brand?: string;
        stock_filter?: string;
        price_min?: string;
        price_max?: string;
        sort_by?: string;
        sort_direction?: string;
        per_page?: string;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

// Helper function to get stock status for a product
const getProductStockStatus = (product: Product) => {
    if (product.quantity === 0) {
        return { status: 'Out of Stock', color: 'destructive' as const };
    }
    if (product.quantity <= product.low_stock_threshold) {
        return { status: 'Low Stock', color: 'secondary' as const };
    }
    return { status: 'In Stock', color: 'default' as const };
};

// Helper function to get current price
const getCurrentPrice = (product: Product): number => {
    return product.discount_price ?? product.selling_price;
};

// Helper function to check if product has discount
const hasDiscount = (product: Product): boolean => {
    return !!(product.discount_price && product.discount_price < product.selling_price);
};

export default function ProductsIndex({ products, categories, brands, filters, flash }: ProductsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || '');
    const [brandFilter, setBrandFilter] = useState(filters.brand || '');
    const [stockFilter, setStockFilter] = useState(filters.stock_filter || '');
    const [priceMin, setPriceMin] = useState(filters.price_min || '');
    const [priceMax, setPriceMax] = useState(filters.price_max || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortDirection, setSortDirection] = useState(filters.sort_direction || 'desc');
    const [perPage, setPerPage] = useState(filters.per_page || '20');

    const handleSearch = (value: string) => {
        setSearch(value);
        updateFilters({ search: value });
    };

    const handleCategoryFilter = (category: string) => {
        setCategoryFilter(category);
        updateFilters({ category: category !== 'all' ? category : '' });
    };

    const handleBrandFilter = (brand: string) => {
        setBrandFilter(brand);
        updateFilters({ brand: brand !== 'all' ? brand : '' });
    };

    const handleStockFilter = (filter: string) => {
        setStockFilter(filter);
        updateFilters({ stock_filter: filter });
    };

    const handlePriceFilter = () => {
        updateFilters({ price_min: priceMin, price_max: priceMax });
    };

    const handleSort = (field: string) => {
        const newDirection = sortBy === field && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortBy(field);
        setSortDirection(newDirection);
        updateFilters({ sort_by: field, sort_direction: newDirection });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        updateFilters({ per_page: value });
    };

    const updateFilters = (newFilters: Partial<typeof filters>) => {
        const currentFilters = {
            search,
            category: categoryFilter,
            brand: brandFilter,
            stock_filter: stockFilter,
            price_min: priceMin,
            price_max: priceMax,
            sort_by: sortBy,
            sort_direction: sortDirection,
            per_page: perPage,
            ...newFilters,
        };

        router.get('/products', currentFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (productId: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            router.delete(`/products/${productId}`);
        }
    };

    const handlePageChange = (page: number) => {
        const currentFilters = {
            search,
            category: categoryFilter,
            brand: brandFilter,
            stock_filter: stockFilter,
            price_min: priceMin,
            price_max: priceMax,
            sort_by: sortBy,
            sort_direction: sortDirection,
            per_page: perPage,
            page,
        };

        router.get('/products', currentFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />

            <div className="flex h-full flex-1 flex-col gap-3 sm:gap-4 rounded-xl p-2 sm:p-4 pb-20 sm:pb-4">
                {/* Success Message */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
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
                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
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

                {/* Mobile Header */}
                <div className="sm:hidden">
                    <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Products</h1>
                                <p className="text-sm text-blue-100">{products.total} items</p>
                            </div>
                        </div>
                        <Link href="/products/create">
                            <Button variant="ghost" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                                <Plus className="h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden sm:flex items-center justify-between">
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
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="hidden sm:block">Product Inventory</CardTitle>
                        
                        {/* Mobile Search and Filter */}
                        <div className="sm:hidden space-y-3">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <Select value={stockFilter || "all"} onValueChange={(value) => handleStockFilter(value === "all" ? "" : value)}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue placeholder="Filter by stock" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Products</SelectItem>
                                        <SelectItem value="low_stock">Low Stock</SelectItem>
                                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {/* Mobile Sorting */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground flex-shrink-0">Sort:</span>
                                <Select value={sortBy} onValueChange={handleSort}>
                                    <SelectTrigger className="flex-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created_at">Newest First</SelectItem>
                                        <SelectItem value="name">Name A-Z</SelectItem>
                                        <SelectItem value="category">Category</SelectItem>
                                        <SelectItem value="price">Price</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSort(sortBy)}
                                    className="px-2"
                                >
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                </Button>
                            </div>
                        </div>

                        {/* Desktop Search and Filter */}
                        <div className="hidden sm:flex items-center space-x-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="max-w-sm pl-10"
                                />
                            </div>
                            
                            <Select value={categoryFilter || "all"} onValueChange={handleCategoryFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={brandFilter || "all"} onValueChange={handleBrandFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Brand" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Brands</SelectItem>
                                    {brands.map((brand) => (
                                        <SelectItem key={brand} value={brand}>
                                            {brand}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

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

                            {/* Sorting Controls */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Sort by:</span>
                                <Select value={sortBy} onValueChange={handleSort}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="created_at">Date Added</SelectItem>
                                        <SelectItem value="name">Name</SelectItem>
                                        <SelectItem value="category">Category</SelectItem>
                                        <SelectItem value="brand">Brand</SelectItem>
                                        <SelectItem value="price">Price</SelectItem>
                                        <SelectItem value="quantity">Stock</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleSort(sortBy)}
                                    className="px-2"
                                >
                                    {sortDirection === 'asc' ? '↑' : '↓'}
                                </Button>
                            </div>

                            {/* Per Page Selector */}
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-muted-foreground">Show:</span>
                                <Select value={perPage} onValueChange={handlePerPageChange}>
                                    <SelectTrigger className="w-20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10</SelectItem>
                                        <SelectItem value="20">20</SelectItem>
                                        <SelectItem value="50">50</SelectItem>
                                        <SelectItem value="100">100</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                        {/* Mobile Card Layout */}
                        <div className="sm:hidden space-y-3">
                            {products.data.map((product) => {
                                const stockStatus = getProductStockStatus(product);
                                const currentPrice = getCurrentPrice(product);
                                const hasDiscountPrice = hasDiscount(product);

                                return (
                                    <Card key={product.id} className="overflow-hidden">
                                        <CardContent className="p-4">
                                            <div className="flex space-x-3">
                                                {/* Product Image */}
                                                <div className="flex-shrink-0">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="h-16 w-16 rounded-lg border object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                                                            <Package className="h-8 w-8 text-muted-foreground" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                                                            <div className="flex items-center space-x-2 mt-1">
                                                                <span className="text-xs text-muted-foreground">{product.category}</span>
                                                                {product.brand && (
                                                                    <>
                                                                        <span className="text-xs text-muted-foreground">•</span>
                                                                        <span className="text-xs text-muted-foreground">{product.brand}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>
                                                        </div>
                                                        <Badge variant={stockStatus.color} className="ml-2 text-xs">
                                                            {stockStatus.status}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div className="flex items-center space-x-4 text-sm">
                                                            <div>
                                                                <span className="font-medium">
                                                                    {hasDiscountPrice ? (
                                                                        <>
                                                                            <span className="line-through text-muted-foreground">
                                                                                {formatCurrency(product.selling_price)}
                                                                            </span>
                                                                            <span className="ml-2 text-green-600">
                                                                                {formatCurrency(currentPrice)}
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        formatCurrency(currentPrice)
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center space-x-1">
                                                                <span className="text-muted-foreground">Stock:</span>
                                                                <span className="font-medium">{product.quantity}</span>
                                                                {product.quantity > 0 && product.quantity <= product.low_stock_threshold && (
                                                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-3 flex items-center space-x-2">
                                                        <Link href={`/products/${product.id}/edit`} className="flex-1">
                                                            <Button variant="outline" size="sm" className="w-full">
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
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
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Desktop Table Layout */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="p-2 text-left font-medium">Image</th>
                                        <th className="p-2 text-left font-medium">Name</th>
                                        <th className="p-2 text-left font-medium">Category</th>
                                        <th className="p-2 text-left font-medium">Brand</th>
                                        <th className="p-2 text-left font-medium">SKU</th>
                                        <th className="p-2 text-left font-medium">Price</th>
                                        <th className="p-2 text-left font-medium">Stock</th>
                                        <th className="p-2 text-left font-medium">Status</th>
                                        <th className="p-2 text-left font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((product) => {
                                        const stockStatus = getProductStockStatus(product);
                                        const currentPrice = getCurrentPrice(product);
                                        const hasDiscountPrice = hasDiscount(product);

                                        return (
                                            <tr key={product.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-2">
                                                    {product.image_url ? (
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            className="h-12 w-12 rounded-md border object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
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
                                                <td className="p-2 text-sm">{product.category}</td>
                                                <td className="p-2 text-sm">{product.brand || '-'}</td>
                                                <td className="p-2 text-sm font-mono">{product.sku}</td>
                                                <td className="p-2">
                                                    <div className="text-sm">
                                                        {hasDiscountPrice ? (
                                                            <>
                                                                <div className="line-through text-muted-foreground">
                                                                    {formatCurrency(product.selling_price)}
                                                                </div>
                                                                <div className="text-green-600 font-medium">
                                                                    {formatCurrency(currentPrice)}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            formatCurrency(currentPrice)
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-2">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-sm">{product.quantity}</span>
                                                        {product.quantity > 0 && product.quantity <= product.low_stock_threshold && (
                                                            <AlertTriangle className="h-3 w-3 text-amber-500" />
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

                        {/* Mobile Pagination */}
                        {products.last_page > 1 && (
                            <>
                                {/* Mobile Pagination */}
                                <div className="sm:hidden mt-4 space-y-3">
                                    <div className="text-xs text-center text-muted-foreground">
                                        Showing {products.from || 0} to {products.to || 0} of {products.total} results
                                    </div>
                                    <div className="flex items-center justify-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePageChange(products.current_page - 1)}
                                            disabled={products.current_page === 1}
                                            className="px-3"
                                        >
                                            ←
                                        </Button>
                                        <div className="flex items-center space-x-1">
                                            {/* Show current page and nearby pages */}
                                            {Array.from({ length: Math.min(3, products.last_page) }, (_, i) => {
                                                const startPage = Math.max(1, products.current_page - 1);
                                                const page = startPage + i;
                                                if (page > products.last_page) return null;
                                                return (
                                                    <Button
                                                        key={page}
                                                        variant={page === products.current_page ? 'default' : 'outline'}
                                                        size="sm"
                                                        onClick={() => handlePageChange(page)}
                                                        className="w-10 h-8 p-0"
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
                                            className="px-3"
                                        >
                                            →
                                        </Button>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-xs text-muted-foreground">
                                            Page {products.current_page} of {products.last_page}
                                        </span>
                                    </div>
                                </div>

                                {/* Desktop Pagination */}
                                <div className="hidden sm:flex mt-6 items-center justify-between">
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
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
