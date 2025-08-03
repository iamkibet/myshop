import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, BarChart3, Check, Package, Plus, Search, ShoppingCart, Users, X } from 'lucide-react';
import { useState } from 'react';

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

interface PageProps {
    auth: {
        user: User;
    };
    products?: {
        data: Product[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    cartCount?: number;
    flash?: {
        success?: string;
    };
    [key: string]: unknown;
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

// Helper function to get the minimum price from variants
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

// Helper function to get total quantity from variants
const getProductTotalQuantity = (product: Product): number => {
    if (!product.variants || product.variants.length === 0) {
        return 0;
    }

    return product.variants.reduce((total, variant) => total + variant.quantity, 0);
};

// Helper function to get available colors for a product
const getAvailableColors = (product: Product | null): string[] => {
    if (!product || !product.variants) return [];
    return [...new Set(product.variants.map((v) => v.color).filter((color): color is string => Boolean(color)))];
};

// Helper function to get available sizes for a product
const getAvailableSizes = (product: Product | null): string[] => {
    if (!product || !product.variants) return [];
    return [...new Set(product.variants.map((v) => v.size).filter((size): size is string => Boolean(size)))];
};

// Helper function to get available sizes for a specific color
const getAvailableSizesForColor = (product: Product | null, color: string): string[] => {
    if (!product || !product.variants || !color) return [];
    return [
        ...new Set(
            product.variants
                .filter((v) => v.color === color && v.is_active && v.quantity > 0)
                .map((v) => v.size)
                .filter((size): size is string => Boolean(size)),
        ),
    ];
};

export default function Dashboard() {
    const { auth, products, cartCount = 0, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    const [search, setSearch] = useState('');
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const [localCartCount, setLocalCartCount] = useState(cartCount);
    const [soldItems, setSoldItems] = useState<Set<number>>(new Set());

    // Variant selection state
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/dashboard',
            { search: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleOpenVariantModal = (product: Product) => {
        setSelectedProduct(product);
        setSelectedColor('');
        setSelectedSize('');
        setSelectedVariant(null);
        setQuantity(1);
        setIsModalOpen(true);
    };

    const handleColorChange = (color: string) => {
        setSelectedColor(color);
        setSelectedSize('');
        setSelectedVariant(null);
        console.log('Color changed to:', color);
    };

    const handleSizeChange = (size: string) => {
        setSelectedSize(size);
        // Find the specific variant
        if (selectedProduct) {
            const variant = selectedProduct.variants?.find((v) => v.color === selectedColor && v.size === size && v.is_active && v.quantity > 0);
            console.log('Selected variant:', variant, 'for color:', selectedColor, 'size:', size);
            setSelectedVariant(variant || null);
        }
    };

    const handleAddToCart = async () => {
        if (!selectedVariant) return;

        setAddingToCart(selectedProduct!.id);

        try {
            await router.post('/cart/items', {
                variant_id: selectedVariant.id,
                quantity: quantity,
                unit_price: selectedVariant.selling_price,
            });

            // Update local cart count
            setLocalCartCount((prev) => prev + quantity);

            // Close modal
            setIsModalOpen(false);
            setSelectedProduct(null);
            setSelectedVariant(null);

            // Show success feedback
            setSoldItems((prev) => new Set([...prev, selectedProduct!.id]));
            setTimeout(() => {
                setSoldItems((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(selectedProduct!.id);
                    return newSet;
                });
            }, 2000);
        } catch (error) {
            console.error('Failed to add to cart:', error);
        } finally {
            setAddingToCart(null);
        }
    };

    const getStockText = (variant: ProductVariant) => {
        if (variant.quantity === 0) return 'Out of Stock';
        if (variant.quantity === 1) return '1 remaining';
        if (variant.quantity <= variant.low_stock_threshold) return `${variant.quantity} remaining`;
        return `${variant.quantity} in stock`;
    };

    const getStockColor = (variant: ProductVariant) => {
        if (variant.quantity === 0) return 'destructive';
        if (variant.quantity <= variant.low_stock_threshold) return 'secondary';
        return 'default';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Success Message */}
                {flash?.success && (
                    <div className="rounded-md border border-green-200 bg-green-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800">Success!</h3>
                                <p className="text-sm text-green-700">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Welcome back, {user.name}!</h1>
                        <p className="text-muted-foreground">
                            You are logged in as a <Badge variant="outline">{user.role}</Badge>
                        </p>
                    </div>
                    {isManager && (
                        <Link href="/cart">
                            <Button variant="outline" className="relative">
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Cart
                                {localCartCount > 0 && (
                                    <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                                        {localCartCount}
                                    </Badge>
                                )}
                            </Button>
                        </Link>
                    )}
                </div>

                {isAdmin && (
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Admin Dashboard</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Analytics & Insights</div>
                                <p className="text-xs text-muted-foreground">Comprehensive business analytics</p>
                                <Link href="/admin-dashboard" className="mt-2 inline-block">
                                    <Button size="sm" variant="outline">
                                        View Dashboard
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Products</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Manage Inventory</div>
                                <p className="text-xs text-muted-foreground">Add, edit, and manage products</p>
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
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">User Management</div>
                                <p className="text-xs text-muted-foreground">Manage user accounts and roles</p>
                                <Link href="/users" className="mt-2 inline-block">
                                    <Button size="sm" variant="outline">
                                        View Users
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {isManager && products && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Product Shop</CardTitle>
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
                                        const stockStatus = getProductStockStatus(product);
                                        const minPrice = getProductMinPrice(product);
                                        const totalQuantity = getProductTotalQuantity(product);
                                        const isSold = soldItems.has(product.id);
                                        const isAdding = addingToCart === product.id;
                                        const hasStock = totalQuantity > 0;
                                        const availableColors = getAvailableColors(product);
                                        const availableSizes = getAvailableSizes(product);

                                        return (
                                            <Card
                                                key={product.id}
                                                className={`transition-all duration-300 hover:shadow-md ${
                                                    isSold ? 'bg-green-50 ring-2 ring-green-500 dark:bg-green-950' : ''
                                                }`}
                                            >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <Package className="h-5 w-5 text-muted-foreground" />
                                                            <CardTitle className="text-lg">{product.name}</CardTitle>
                                                        </div>
                                                        <Badge variant={stockStatus.color}>{stockStatus.status}</Badge>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-muted-foreground">Brand: {product.brand}</p>
                                                        <p className="text-sm text-muted-foreground">Category: {product.category}</p>
                                                        {product.description && (
                                                            <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                                                        )}
                                                        {product.features && Array.isArray(product.features) && (
                                                            <p className="line-clamp-1 text-xs text-muted-foreground">
                                                                Features: {product.features.join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3">
                                                    {/* Product Image */}
                                                    {product.image_url ? (
                                                        <div className="relative h-32 w-full overflow-hidden rounded-md">
                                                            <img
                                                                src={product.image_url}
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

                                                    {/* Variants Summary */}
                                                    {product.variants && product.variants.length > 0 && (
                                                        <div className="space-y-2">
                                                            <div>
                                                                <p className="text-xs font-medium text-muted-foreground">Available:</p>
                                                                <div className="space-y-1">
                                                                    {availableColors.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            <span className="text-xs text-muted-foreground">Colors:</span>
                                                                            {availableColors.map((color) => (
                                                                                <Badge key={color} variant="outline" className="text-xs">
                                                                                    {color}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    {availableSizes.length > 0 && (
                                                                        <div className="flex flex-wrap gap-1">
                                                                            <span className="text-xs text-muted-foreground">Sizes:</span>
                                                                            {availableSizes.map((size) => (
                                                                                <Badge key={size} variant="outline" className="text-xs">
                                                                                    {size}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                    <div className="flex flex-wrap gap-1">
                                                                        <span className="text-xs text-muted-foreground">Variants:</span>
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {product.variants.filter((v) => v.is_active && v.quantity > 0).length}{' '}
                                                                            available
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Price and Stock */}
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">Price:</span>
                                                        <span className="text-lg font-semibold">{formatCurrency(minPrice)}</span>
                                                    </div>

                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm text-muted-foreground">Stock:</span>
                                                        <div className="flex items-center space-x-1">
                                                            <span className="text-sm">{totalQuantity}</span>
                                                            {product.variants?.some((v) => v.quantity > 0 && v.quantity <= v.low_stock_threshold) && (
                                                                <AlertTriangle className="text-warning h-3 w-3" />
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Dialog open={isModalOpen && selectedProduct?.id === product.id} onOpenChange={setIsModalOpen}>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                onClick={() => handleOpenVariantModal(product)}
                                                                disabled={!hasStock || isAdding}
                                                                className={`w-full transition-all duration-300 ${
                                                                    isSold ? 'bg-green-600 hover:bg-green-700' : ''
                                                                }`}
                                                                size="sm"
                                                            >
                                                                {isAdding ? (
                                                                    <>
                                                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                                        Adding...
                                                                    </>
                                                                ) : isSold ? (
                                                                    <>
                                                                        <Check className="mr-2 h-4 w-4" />
                                                                        Added to Cart
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus className="mr-2 h-4 w-4" />
                                                                        Sell
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="sm:max-w-md">
                                                            <DialogHeader>
                                                                <DialogTitle>Select Variant - {selectedProduct?.name || 'Product'}</DialogTitle>
                                                            </DialogHeader>
                                                            {selectedProduct && (
                                                                <div className="space-y-4">
                                                                    {/* Color Selection */}
                                                                    {getAvailableColors(selectedProduct).length > 0 && (
                                                                        <div>
                                                                            <label className="text-sm font-medium">Color</label>
                                                                            <Select value={selectedColor} onValueChange={handleColorChange}>
                                                                                <SelectTrigger>
                                                                                    <SelectValue placeholder="Select color" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {getAvailableColors(selectedProduct).map((color) => (
                                                                                        <SelectItem key={color} value={color}>
                                                                                            {color}
                                                                                        </SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </div>
                                                                    )}

                                                                    {/* Size Selection */}
                                                                    {selectedColor &&
                                                                        getAvailableSizesForColor(selectedProduct, selectedColor).length > 0 && (
                                                                            <div>
                                                                                <label className="text-sm font-medium">Size</label>
                                                                                <Select value={selectedSize} onValueChange={handleSizeChange}>
                                                                                    <SelectTrigger>
                                                                                        <SelectValue placeholder="Select size" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {getAvailableSizesForColor(
                                                                                            selectedProduct,
                                                                                            selectedColor,
                                                                                        ).map((size) => (
                                                                                            <SelectItem key={size} value={size}>
                                                                                                {size}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                            </div>
                                                                        )}

                                                                    {/* Selected Variant Info */}
                                                                    {selectedVariant && (
                                                                        <div className="space-y-3 rounded-lg border p-3">
                                                                            <div className="flex justify-between">
                                                                                <span className="font-medium">Price:</span>
                                                                                <span className="font-semibold">
                                                                                    {formatCurrency(selectedVariant.selling_price || 0)}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex justify-between">
                                                                                <span className="font-medium">Stock:</span>
                                                                                <Badge
                                                                                    variant={
                                                                                        getStockColor(selectedVariant) as
                                                                                            | 'destructive'
                                                                                            | 'secondary'
                                                                                            | 'default'
                                                                                    }
                                                                                >
                                                                                    {getStockText(selectedVariant)}
                                                                                </Badge>
                                                                            </div>
                                                                            {selectedVariant.discount_price && (
                                                                                <div className="flex justify-between">
                                                                                    <span className="font-medium">Discount:</span>
                                                                                    <span className="font-semibold text-green-600">
                                                                                        {formatCurrency(selectedVariant.discount_price)}
                                                                                    </span>
                                                                                </div>
                                                                            )}

                                                                            {/* Quantity Selection */}
                                                                            <div>
                                                                                <label className="text-sm font-medium">Quantity</label>
                                                                                <Input
                                                                                    type="number"
                                                                                    min="1"
                                                                                    max={selectedVariant.quantity}
                                                                                    value={quantity}
                                                                                    onChange={(e) =>
                                                                                        setQuantity(
                                                                                            Math.min(
                                                                                                parseInt(e.target.value) || 1,
                                                                                                selectedVariant.quantity,
                                                                                            ),
                                                                                        )
                                                                                    }
                                                                                    className="mt-1"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Action Buttons */}
                                                                    <div className="flex space-x-2">
                                                                        <Button
                                                                            onClick={handleAddToCart}
                                                                            disabled={!selectedVariant || isAdding}
                                                                            className="flex-1"
                                                                        >
                                                                            {isAdding ? (
                                                                                <>
                                                                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                                                    Adding...
                                                                                </>
                                                                            ) : (
                                                                                <>
                                                                                    <Plus className="mr-2 h-4 w-4" />
                                                                                    Add to Cart
                                                                                </>
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => setIsModalOpen(false)}
                                                                            disabled={isAdding}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </DialogContent>
                                                    </Dialog>
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
                    </>
                )}

                <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
