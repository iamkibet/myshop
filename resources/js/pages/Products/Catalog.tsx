import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
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

interface ProductsCatalogProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
}

// Helper function to safely format currency
const getNumericValue = (value: number | string): number => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(numValue) ? 0 : numValue;
};

// Helper function to get stock status
const getStockStatus = (quantity: number, threshold: number) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'destructive' as const };
    if (quantity <= threshold) return { status: 'Low Stock', color: 'warning' as const };
    return { status: 'In Stock', color: 'default' as const };
};

export default function ProductsCatalog({ products, filters }: ProductsCatalogProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [addingToCart, setAddingToCart] = useState<number | null>(null);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/products/catalog',
            { search: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleAddToCart = async (product: Product) => {
        setAddingToCart(product.id);

        try {
            await router.post('/cart/items', {
                product_id: product.id,
                quantity: 1,
                sale_price: getNumericValue(product.msrp),
            });
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setAddingToCart(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Product Catalog" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Product Catalog</h1>
                        <p className="text-muted-foreground">Browse products and add them to your cart</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Available Products</CardTitle>
                        <div className="flex items-center space-x-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="max-w-sm pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {products.data.map((product) => {
                                const stockStatus = getStockStatus(product.quantity_on_hand, product.low_stock_threshold);
                                return (
                                    <Card key={product.id} className="transition-shadow hover:shadow-md">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                    <CardTitle className="text-lg">{product.name}</CardTitle>
                                                </div>
                                                <Badge variant={stockStatus.color}>{stockStatus.status}</Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                                                <p className="text-sm text-muted-foreground">Brand: {product.brand}</p>
                                                <p className="text-sm text-muted-foreground">Category: {product.category}</p>
                                                {product.description && (
                                                    <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {/* Product Image */}
                                            {product.images && product.images.length > 0 ? (
                                                <div className="relative h-32 w-full overflow-hidden rounded-md">
                                                    <img
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.src =
                                                                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
                                                        }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex h-32 w-full items-center justify-center rounded-md bg-muted">
                                                    <Package className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                            )}

                                            {/* Sizes and Colors */}
                                            <div className="space-y-2">
                                                {product.sizes && product.sizes.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground">Sizes:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {product.sizes.slice(0, 3).map((size, index) => (
                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                    {size}
                                                                </Badge>
                                                            ))}
                                                            {product.sizes.length > 3 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{product.sizes.length - 3} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {product.colors && product.colors.length > 0 && (
                                                    <div>
                                                        <p className="text-xs font-medium text-muted-foreground">Colors:</p>
                                                        <div className="flex flex-wrap gap-1">
                                                            {product.colors.slice(0, 3).map((color, index) => (
                                                                <Badge key={index} variant="outline" className="text-xs">
                                                                    {color}
                                                                </Badge>
                                                            ))}
                                                            {product.colors.length > 3 && (
                                                                <Badge variant="outline" className="text-xs">
                                                                    +{product.colors.length - 3} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Price and Stock */}
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">MSRP:</span>
                                                <span className="text-lg font-semibold">{formatCurrency(product.msrp)}</span>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Stock:</span>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-sm">{product.quantity_on_hand}</span>
                                                    {product.quantity_on_hand <= product.low_stock_threshold && (
                                                        <AlertTriangle className="text-warning h-3 w-3" />
                                                    )}
                                                </div>
                                            </div>

                                            <Button
                                                onClick={() => handleAddToCart(product)}
                                                disabled={product.quantity_on_hand === 0 || addingToCart === product.id}
                                                className="w-full"
                                                size="sm"
                                            >
                                                {addingToCart === product.id ? (
                                                    <>
                                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                        Adding...
                                                    </>
                                                ) : (
                                                    <>
                                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                                        Add to Cart
                                                    </>
                                                )}
                                            </Button>
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
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
