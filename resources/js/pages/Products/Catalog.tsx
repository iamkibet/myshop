import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Package, Search, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Product Catalog',
        href: '/products/catalog',
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
}

interface ProductCatalogProps {
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
    filters: {
        search?: string;
        category?: string;
    };
}

// Helper function to get current price
const getCurrentPrice = (product: Product): number => {
    return product.discount_price ?? product.selling_price;
};

// Helper function to check if product has discount
const hasDiscount = (product: Product): boolean => {
    return !!(product.discount_price && product.discount_price < product.selling_price);
};

// Helper function to get discount percentage
const getDiscountPercentage = (product: Product): number => {
    if (!hasDiscount(product)) return 0;
    return Math.round(((product.selling_price - product.discount_price!) / product.selling_price) * 100);
};

export default function ProductCatalog({ products, categories, filters }: ProductCatalogProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters.category || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        updateFilters({ search: value });
    };

    const handleCategoryFilter = (category: string) => {
        setCategoryFilter(category);
        updateFilters({ category: category !== 'all' ? category : '' });
    };

    const updateFilters = (newFilters: Partial<typeof filters>) => {
        const currentFilters = {
            search,
            category: categoryFilter,
            ...newFilters,
        };

        router.get('/products/catalog', currentFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (page: number) => {
        const currentFilters = {
            search,
            category: categoryFilter,
            page,
        };

        router.get('/products/catalog', currentFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Catalog" />

            <div className="flex h-full flex-1 flex-col gap-3 sm:gap-4 rounded-xl p-2 sm:p-4 pb-20 sm:pb-4">
                {/* Mobile Header */}
                <div className="sm:hidden">
                    <div className="flex items-center justify-between bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                        <div className="flex items-center space-x-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                                <ShoppingCart className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">Product Catalog</h1>
                                <p className="text-sm text-green-100">{products.total} products available</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden sm:flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Product Catalog</h1>
                        <p className="text-muted-foreground">Browse and select products for sale</p>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="hidden sm:block">Find Products</CardTitle>
                        
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
                            <Select value={categoryFilter || "all"} onValueChange={handleCategoryFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
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
                        </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                        {/* Mobile Grid Layout */}
                        <div className="sm:hidden grid grid-cols-1 gap-3">
                            {products.data.map((product) => {
                                const currentPrice = getCurrentPrice(product);
                                const hasDiscountPrice = hasDiscount(product);
                                const discountPercentage = getDiscountPercentage(product);

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
                                                            className="h-20 w-20 rounded-lg border object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src =
                                                                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                                                            <Package className="h-10 w-10 text-muted-foreground" />
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
                                                            {product.description && (
                                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                                    {product.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        {hasDiscountPrice && (
                                                            <Badge variant="secondary" className="ml-2 text-xs">
                                                                -{discountPercentage}%
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div className="mt-2 flex items-center justify-between">
                                                        <div className="flex items-center space-x-4 text-sm">
                                                            <div>
                                                                <span className="font-medium text-lg">
                                                                    {hasDiscountPrice ? (
                                                                        <>
                                                                            <span className="line-through text-muted-foreground text-sm">
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

                                                    <div className="mt-3">
                                                        <Button className="w-full" disabled={product.quantity === 0}>
                                                            <ShoppingCart className="h-4 w-4 mr-2" />
                                                            {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Desktop Grid Layout */}
                        <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products.data.map((product) => {
                                const currentPrice = getCurrentPrice(product);
                                const hasDiscountPrice = hasDiscount(product);
                                const discountPercentage = getDiscountPercentage(product);

                                return (
                                    <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <CardContent className="p-4">
                                            {/* Product Image */}
                                            <div className="relative mb-3">
                                                {product.image_url ? (
                                                    <img
                                                        src={product.image_url}
                                                        alt={product.name}
                                                        className="h-48 w-full rounded-lg border object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex h-48 w-full items-center justify-center rounded-lg bg-muted">
                                                        <Package className="h-16 w-16 text-muted-foreground" />
                                                    </div>
                                                )}
                                                
                                                {/* Discount Badge */}
                                                {hasDiscountPrice && (
                                                    <Badge variant="secondary" className="absolute top-2 right-2">
                                                        -{discountPercentage}%
                                                    </Badge>
                                                )}

                                                {/* Stock Status */}
                                                <div className="absolute top-2 left-2">
                                                    {product.quantity === 0 ? (
                                                        <Badge variant="destructive">Out of Stock</Badge>
                                                    ) : product.quantity <= product.low_stock_threshold ? (
                                                        <Badge variant="secondary">Low Stock</Badge>
                                                    ) : (
                                                        <Badge variant="default">In Stock</Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Product Info */}
                                            <div className="space-y-2">
                                                <div>
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
                                                </div>

                                                {product.description && (
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        {product.description}
                                                    </p>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm">
                                                        <span className="font-medium text-lg">
                                                            {hasDiscountPrice ? (
                                                                <>
                                                                    <span className="line-through text-muted-foreground text-sm">
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
                                                    <div className="text-xs text-muted-foreground">
                                                        SKU: {product.sku}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>Stock: {product.quantity}</span>
                                                    {product.quantity > 0 && product.quantity <= product.low_stock_threshold && (
                                                        <div className="flex items-center space-x-1 text-amber-600">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            <span>Low Stock</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Button className="w-full" disabled={product.quantity === 0}>
                                                    <ShoppingCart className="h-4 w-4 mr-2" />
                                                    {product.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>

                        {products.data.length === 0 && (
                            <div className="py-8 text-center">
                                <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                <p className="text-muted-foreground">No products found.</p>
                            </div>
                        )}

                        {/* Pagination */}
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
