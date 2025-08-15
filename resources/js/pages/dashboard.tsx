import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, BarChart3, Check, DollarSign, Package, Search, ShoppingCart, Users } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';

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

// Helper function to convert color name to hex
const getColorHex = (colorName: string): string => {
    const colorMap: { [key: string]: string } = {
        red: '#ef4444',
        blue: '#3b82f6',
        green: '#22c55e',
        yellow: '#eab308',
        purple: '#a855f7',
        pink: '#ec4899',
        orange: '#f97316',
        brown: '#a16207',
        black: '#000000',
        white: '#ffffff',
        gray: '#6b7280',
        grey: '#6b7280',
        navy: '#1e3a8a',
        maroon: '#991b1b',
        olive: '#65a30d',
        lime: '#84cc16',
        teal: '#14b8a6',
        cyan: '#06b6d4',
        indigo: '#6366f1',
        violet: '#8b5cf6',
        fuchsia: '#d946ef',
        rose: '#f43f5e',
        amber: '#f59e0b',
        emerald: '#10b981',
        sky: '#0ea5e9',
        slate: '#64748b',
        zinc: '#71717a',
        neutral: '#737373',
        stone: '#78716c',
        'red-500': '#ef4444',
        'blue-500': '#3b82f6',
        'green-500': '#22c55e',
        'yellow-500': '#eab308',
        'purple-500': '#a855f7',
        'pink-500': '#ec4899',
        'orange-500': '#f97316',
        'brown-500': '#a16207',
        'black-500': '#000000',
        'white-500': '#ffffff',
        'gray-500': '#6b7280',
        'grey-500': '#6b7280',
    };

    const normalizedColor = colorName.toLowerCase().trim();
    return colorMap[normalizedColor] || '#6b7280'; // Default to gray if color not found
};

export default function Dashboard() {
    const { auth, products, cartCount = 0, flash } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    // Get initial values from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const initialSearch = urlParams.get('search') || '';
    const initialCategory = urlParams.get('category') || 'all';

    const [search, setSearch] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);
    const { cartCount: localCartCount, addToCart } = useCart();
    const [soldItems, setSoldItems] = useState<Set<number>>(new Set());

    // Variant selection state
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Get unique categories from products
    const categories = products?.data ? [...new Set(products.data.map((product) => product.category))].sort() : [];

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/dashboard',
            { search: value, category: selectedCategory !== 'all' ? selectedCategory : '' },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleCategoryFilter = (category: string) => {
        setSelectedCategory(category);
        router.get(
            '/dashboard',
            {
                search: search,
                category: category !== 'all' ? category : '',
            },
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

            // Add to cart using the hook
            addToCart({
                variant_id: selectedVariant.id,
                quantity: quantity,
                unit_price: selectedVariant.selling_price,
                product_name: selectedProduct!.name,
                color: selectedVariant.color,
                size: selectedVariant.size,
            });

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

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-lg font-bold sm:text-xl md:text-2xl">
                            Welcome back, {user.role} {user.name}!
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                            You are logged in as a{' '}
                            <Badge variant="outline" className="text-xs sm:text-sm">
                                {user.role}
                            </Badge>
                        </p>
                    </div>
                    {isManager && (
                        <div className="flex items-center space-x-2">
                            <Link href="/wallet">
                                <Button variant="outline" className="relative w-full sm:w-auto">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    <span className="hidden sm:inline">My Wallet</span>
                                </Button>
                            </Link>
                            {/* Cart button - hidden on mobile, shows badge on large screens */}
                            <Link href="/cart" className="hidden sm:block">
                                <Button variant="outline" className="relative">
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    <span>Cart</span>
                                    {/* Cart Badge - only show when items exist */}
                                    {localCartCount > 0 && (
                                        <div className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                            {localCartCount > 99 ? '99+' : localCartCount}
                                        </div>
                                    )}
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {isAdmin && (
                    <div className="grid auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                                <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                                    {/* Search Input */}
                                    <div className="relative w-full sm:max-w-sm">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            placeholder="Search products..."
                                            value={search}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            className="w-full pl-10"
                                        />
                                    </div>

                                    {/* Category Filter Buttons */}
                                    <div className="flex flex-wrap gap-1 sm:gap-2">
                                        <Button
                                            variant={selectedCategory === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => handleCategoryFilter('all')}
                                            className="px-2 py-1 text-xs sm:px-3 sm:py-2"
                                        >
                                            All Categories
                                        </Button>
                                        {categories.map((category) => (
                                            <Button
                                                key={category}
                                                variant={selectedCategory === category ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => handleCategoryFilter(category)}
                                                className="px-2 py-1 text-xs sm:px-3 sm:py-2"
                                            >
                                                {category}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {products.data.map((product) => {
                                        const stockStatus = getProductStockStatus(product);
                                        const minPrice = getProductMinPrice(product);
                                        const totalQuantity = getProductTotalQuantity(product);
                                        const isSold = soldItems.has(product.id);
                                        const isAdding = addingToCart === product.id;
                                        const hasStock = totalQuantity > 0;
                                        const availableColors = getAvailableColors(product);

                                        return (
                                            <Link 
                                                key={product.id}
                                                href={`/products/${product.id}`}
                                                className="block"
                                            >
                                                <Card
                                                    className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${
                                                        isSold ? 'bg-green-50/70 ring-1 ring-green-400 dark:bg-green-900/30' : ''
                                                    }`}
                                                >
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0 flex-1">
                                                            <div className="mb-1 flex items-center gap-2">
                                                                <Package className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                                <CardTitle className="truncate text-base font-bold">{product.name}</CardTitle>
                                                            </div>

                                                            <div className="mb-2 flex flex-wrap gap-1">
                                                                <Badge variant="secondary" className="px-1.5 py-0.5 text-xs font-medium">
                                                                    {product.brand}
                                                                </Badge>
                                                                <Badge variant="secondary" className="px-1.5 py-0.5 text-xs font-medium">
                                                                    {product.category}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        <Badge variant={stockStatus.color} className="flex-shrink-0 px-2 py-1 text-xs font-medium">
                                                            {stockStatus.status}
                                                        </Badge>
                                                    </div>
                                                </CardHeader>

                                                <CardContent className="space-y-4">
                                                    {/* Product Image */}
                                                    <div className="relative h-32 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
                                                        {product.image_url ? (
                                                            <img
                                                                src={product.image_url}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                                onError={(e) => {
                                                                    e.currentTarget.src =
                                                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="flex h-full flex-col items-center justify-center p-4 text-muted-foreground">
                                                                <Package className="h-8 w-8" />
                                                                <span className="mt-1 text-center text-xs">No image available</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Product Info */}
                                                    <div className="space-y-3">
                                                        {product.description && (
                                                            <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                                                        )}

                                                        {product.features && Array.isArray(product.features) && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {product.features.slice(0, 3).map((feature, index) => (
                                                                    <Badge
                                                                        key={index}
                                                                        variant="outline"
                                                                        className="px-1.5 py-0.5 text-xs font-normal text-muted-foreground"
                                                                    >
                                                                        {feature}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Variants Summary */}
                                                    {product.variants && product.variants.length > 0 && (
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-medium text-muted-foreground">Available Variants</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {product.variants.filter((v) => v.is_active && v.quantity > 0).length} options
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-wrap gap-2">
                                                                {availableColors.slice(0, 4).map((color) => (
                                                                    <div
                                                                        key={color}
                                                                        className="h-5 w-5 rounded-full border shadow-sm"
                                                                        style={{ backgroundColor: getColorHex(color) }}
                                                                        title={color}
                                                                    />
                                                                ))}
                                                                {availableColors.length > 4 && (
                                                                    <div className="flex items-center text-xs text-muted-foreground">
                                                                        +{availableColors.length - 4} more
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Price and Stock */}
                                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                                        <div>
                                                            <div className="mb-1 text-xs text-muted-foreground">Price</div>
                                                            <div className="text-base font-bold">{formatCurrency(minPrice)}</div>
                                                        </div>

                                                        <div>
                                                            <div className="mb-1 text-xs text-muted-foreground">Stock</div>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-base font-semibold">{totalQuantity}</span>
                                                                {product.variants?.some(
                                                                    (v) => v.quantity > 0 && v.quantity <= v.low_stock_threshold,
                                                                ) && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Sell Button */}
                                                    <Button
                                                        onClick={() => handleOpenVariantModal(product)}
                                                        disabled={!hasStock || isAdding}
                                                        className={`w-full transition-all duration-200 ${
                                                            isSold
                                                                ? 'bg-green-600 hover:bg-green-700'
                                                                : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800'
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
                                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                                Sell Product
                                                            </>
                                                        )}
                                                    </Button>

                                                    {/* Variant selection modal */}
                                                    <Dialog open={isModalOpen && selectedProduct?.id === product.id} onOpenChange={setIsModalOpen}>
                                                        <DialogContent className="sm:max-w-md">
                                                            <DialogTitle className="text-lg font-semibold">
                                                                {selectedProduct?.name}
                                                            </DialogTitle>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <p className="text-sm text-muted-foreground">{selectedProduct?.description}</p>
                                                                </div>

                                                                {/* Color Selection */}
                                                                {getAvailableColors(selectedProduct).length > 0 && (
                                                                    <div>
                                                                        <label className="text-sm font-medium">Color</label>
                                                                        <div className="mt-2 flex flex-wrap gap-2">
                                                                            {getAvailableColors(selectedProduct).map((color) => (
                                                                                <button
                                                                                    key={color}
                                                                                    onClick={() => handleColorChange(color)}
                                                                                    className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                                                                                        selectedColor === color
                                                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                                                            : 'border-gray-200 hover:border-gray-300'
                                                                                    }`}
                                                                                >
                                                                                    <div
                                                                                        className="h-4 w-4 rounded-full border shadow-sm"
                                                                                        style={{ backgroundColor: getColorHex(color) }}
                                                                                    />
                                                                                    {color}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* Size Selection */}
                                                                {selectedColor &&
                                                                    getAvailableSizesForColor(selectedProduct, selectedColor).length > 0 && (
                                                                        <div>
                                                                            <label className="text-sm font-medium">Size</label>
                                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                                {getAvailableSizesForColor(selectedProduct, selectedColor).map(
                                                                                    (size) => (
                                                                                        <button
                                                                                            key={size}
                                                                                            onClick={() => handleSizeChange(size)}
                                                                                            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                                                                                                selectedSize === size
                                                                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                                                                                                    : 'border-gray-200 hover:border-gray-300'
                                                                                            }`}
                                                                                        >
                                                                                            {size}
                                                                                        </button>
                                                                                    ),
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                {/* Selected Variant Info */}
                                                                {selectedVariant && (
                                                                    <div className="space-y-3 rounded-lg border p-3">
                                                                        <div className="flex justify-between">
                                                                            <span className="font-medium">Price:</span>
                                                                            <span className="font-semibold">
                                                                                {formatCurrency(selectedVariant.selling_price)}
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
                                                                                <ShoppingCart className="mr-2 h-4 w-4" />
                                                                                Add to Cart
                                                                            </>
                                                                        )}
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => setIsModalOpen(false)}
                                                                        disabled={isAdding}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </CardContent>
                                            </Card>
                                        </Link>
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
                                {products.data.length > 0 && (
                                    <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="text-xs text-muted-foreground sm:text-sm">
                                            Showing {(products.current_page - 1) * products.per_page + 1} to{' '}
                                            {Math.min(products.current_page * products.per_page, products.total)} of {products.total} products
                                        </div>
                                        <div className="flex items-center justify-center space-x-2 sm:justify-end">
                                            {products.current_page > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const params = new URLSearchParams(window.location.search);
                                                        params.set('page', String(products.current_page - 1));
                                                        router.get('/dashboard', Object.fromEntries(params));
                                                    }}
                                                    className="px-2 py-1 text-xs sm:px-3 sm:py-2"
                                                >
                                                    Previous
                                                </Button>
                                            )}
                                            <span className="text-xs text-muted-foreground sm:text-sm">
                                                Page {products.current_page} of {products.last_page}
                                            </span>
                                            {products.current_page < products.last_page && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        const params = new URLSearchParams(window.location.search);
                                                        params.set('page', String(products.current_page + 1));
                                                        router.get('/dashboard', Object.fromEntries(params));
                                                    }}
                                                    className="px-2 py-1 text-xs sm:px-3 sm:py-2"
                                                >
                                                    Next
                                                </Button>
                                            )}
                                        </div>
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
