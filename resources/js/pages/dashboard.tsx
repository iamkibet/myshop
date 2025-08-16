import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
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
    
    const colors = product.variants
        .filter((v) => v.is_active && v.quantity > 0)
        .map((v) => v.color)
        .filter((color): color is string => Boolean(color));
    
    console.log('Available colors for product:', product.name, ':', colors);
    return [...new Set(colors)];
};

// Helper function to get available sizes for a specific color
const getAvailableSizesForColor = (product: Product | null, color: string): string[] => {
    if (!product || !product.variants || !color) return [];
    
    const sizes = product.variants
        .filter((v) => v.color === color && v.is_active && v.quantity > 0)
        .map((v) => v.size)
        .filter((size): size is string => Boolean(size));
    
    console.log('Available sizes for color', color, ':', sizes);
    return [...new Set(sizes)];
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



    const handleColorChange = (color: string) => {
        console.log('Color changed to:', color);
        setSelectedColor(color);
        setSelectedSize('');
        setSelectedVariant(null);
        setQuantity(1);
    };

    const handleSizeChange = (size: string) => {
        console.log('Size changed to:', size, 'for color:', selectedColor);
        setSelectedSize(size);
        
        // Find the specific variant
        if (selectedProduct && selectedColor) {
            const variant = selectedProduct.variants?.find((v) => 
                v.color === selectedColor && 
                v.size === size && 
                v.is_active && 
                v.quantity > 0
            );
            console.log('Found variant:', variant);
            setSelectedVariant(variant || null);
        }
    };

    const handleAddToCart = async () => {
        if (!selectedVariant || !selectedProduct) return;

        console.log('Adding to cart - selectedVariant:', selectedVariant);
        console.log('Adding to cart - selectedProduct:', selectedProduct);
        console.log('Adding to cart - quantity:', quantity);

        setAddingToCart(selectedProduct.id);

        try {
            // Add to cart using the hook first for immediate UI feedback
            const cartItem = {
                variant_id: selectedVariant.id,
                quantity: quantity,
                unit_price: selectedVariant.selling_price,
                product_name: selectedProduct.name,
                color: selectedVariant.color,
                size: selectedVariant.size,
                image_url: selectedVariant.image_url || selectedProduct.image_url,
            };
            
            console.log('Adding cart item:', cartItem);
            addToCart(cartItem);
            console.log('Cart item added, current cart count:', localCartCount);

            // Close modal after successful add
            setIsModalOpen(false);
            setSelectedProduct(null);
            setSelectedColor('');
            setSelectedSize('');
            setSelectedVariant(null);
            setQuantity(1);

            // Show success feedback
            setSoldItems((prev) => new Set([...prev, selectedProduct.id]));
            setTimeout(() => {
                setSoldItems((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(selectedProduct.id);
                    return newSet;
                });
            }, 2000);
        } catch (error) {
            console.error('Failed to add to cart:', error);
            alert('Failed to add item to cart. Please try again.');
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
                                            <div key={product.id}>
                                                <Card
                                                    className={`overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${
                                                        isSold ? 'bg-green-50/70 ring-1 ring-green-400 dark:bg-green-900/30' : ''
                                                    }`}
                                                    onClick={() => {
                                                        console.log('Product card clicked:', product.name);
                                                        // Reset all selection state
                                                        setSelectedColor('');
                                                        setSelectedSize('');
                                                        setSelectedVariant(null);
                                                        setQuantity(1);
                                                        // Set product and open modal
                                                        setSelectedProduct(product);
                                                        setIsModalOpen(true);
                                                    }}
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
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent card click
                                                            console.log('Sell button clicked for:', product.name);
                                                            // Reset all selection state
                                                            setSelectedColor('');
                                                            setSelectedSize('');
                                                            setSelectedVariant(null);
                                                            setQuantity(1);
                                                            // Set product and open modal
                                                            setSelectedProduct(product);
                                                            setIsModalOpen(true);
                                                        }}
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






                                                                
                                                                





                                                                



                                                </CardContent>
                                            </Card>
                                        </div>
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

            {/* Variant Selection Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="w-[95vw] max-w-lg p-4 sm:p-6 max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
                    <DialogTitle className="text-lg sm:text-xl font-bold text-center mb-2">
                        {selectedProduct?.name}
                    </DialogTitle>
                    
                    <DialogDescription className="text-center text-xs sm:text-sm text-muted-foreground mb-4">
                        Select your preferred color, size, and quantity to add this item to your cart
                    </DialogDescription>
                    
                    <div className="space-y-4 sm:space-y-6">
                        {selectedProduct?.description && (
                            <div className="text-center px-2">
                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">{selectedProduct.description}</p>
                            </div>
                        )}
                        
                        {/* Instructions */}
                        <div className="text-center space-y-3 px-2">
                            <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {!selectedColor ? 'First, select a color' : 
                                 !selectedSize ? 'Now select a size' : 
                                 'Choose quantity and add to cart'}
                            </p>
                            
                            {/* Progress indicator */}
                            <div className="flex justify-center items-center gap-2">
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${selectedColor ? 'bg-blue-500 scale-110' : 'bg-gray-300'}`}></div>
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${selectedSize ? 'bg-blue-500 scale-110' : 'bg-gray-300'}`}></div>
                                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${selectedVariant ? 'bg-blue-500 scale-110' : 'bg-gray-300'}`}></div>
                            </div>
                        </div>

                        {/* Color Selection */}
                        {getAvailableColors(selectedProduct).length > 0 && (
                            <div>
                                <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-3">
                                    <span>Select Color</span>
                                    {selectedColor && (
                                        <Badge variant="secondary" className="text-xs px-2 py-1">
                                            {selectedColor}
                                        </Badge>
                                    )}
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2 sm:gap-3">
                                    {getAvailableColors(selectedProduct).map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                console.log('Color clicked:', color);
                                                handleColorChange(color);
                                            }}
                                            className={`flex items-center gap-2 rounded-lg border p-2 sm:p-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 ${
                                                selectedColor === color
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md scale-105'
                                                    : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                            }`}
                                        >
                                            <div
                                                className="h-4 w-4 sm:h-5 sm:w-5 rounded-full border-2 border-white shadow-sm"
                                                style={{ backgroundColor: getColorHex(color) }}
                                            />
                                            <span className="capitalize truncate">{color}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        {selectedColor &&
                            getAvailableSizesForColor(selectedProduct, selectedColor).length > 0 && (
                                <div>
                                    <label className="text-xs sm:text-sm font-medium flex items-center gap-2 mb-3">
                                        <span>Select Size</span>
                                        {selectedSize && (
                                            <Badge variant="secondary" className="text-xs px-2 py-1">
                                                {selectedSize}
                                            </Badge>
                                        )}
                                    </label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:flex lg:flex-wrap gap-2 sm:gap-3">
                                        {getAvailableSizesForColor(selectedProduct, selectedColor).map(
                                            (size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => {
                                                        console.log('Size clicked:', size);
                                                        handleSizeChange(size);
                                                    }}
                                                    className={`rounded-lg border px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 hover:scale-105 ${
                                                        selectedSize === size
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 shadow-md scale-105'
                                                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
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
                        {!selectedVariant && selectedColor && selectedSize && (
                            <div className="text-center py-4">
                                <div className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                                    <div className="animate-pulse flex items-center justify-center gap-2">
                                        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"></div>
                                        <span>Checking availability...</span>
                                        <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {selectedVariant && (
                            <div className="space-y-4 rounded-lg border-2 border-green-200 bg-green-50 dark:bg-green-900/20 p-3 sm:p-4 mx-2 sm:mx-0">
                                <div className="text-center">
                                    <div className="inline-flex items-center gap-2 px-2 py-1 sm:px-3 sm:py-1 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full text-xs sm:text-sm font-medium">
                                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                        Variant Selected
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm font-medium">Price:</span>
                                        <span className="text-sm sm:text-base font-semibold">
                                            {formatCurrency(selectedVariant.selling_price)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs sm:text-sm font-medium">Stock:</span>
                                        <Badge
                                            variant={
                                                getStockColor(selectedVariant) as
                                                    | 'destructive'
                                                    | 'secondary'
                                                    | 'default'
                                            }
                                            className="text-xs px-2 py-1"
                                        >
                                            {getStockText(selectedVariant)}
                                        </Badge>
                                    </div>
                                    {selectedVariant.discount_price && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs sm:text-sm font-medium">Discount:</span>
                                            <span className="text-sm sm:text-base font-semibold text-green-600">
                                                {formatCurrency(selectedVariant.discount_price)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Quantity Selection */}
                                    <div>
                                        <label className="text-xs sm:text-sm font-medium mb-2 block">Quantity</label>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                disabled={quantity <= 1}
                                                className="h-8 w-8 p-0 flex-shrink-0"
                                            >
                                                <span className="text-lg font-bold">-</span>
                                            </Button>
                                            <div className="flex-1 text-center">
                                                <span className="text-sm font-medium px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-md min-w-[60px] inline-block">
                                                    {quantity}
                                                </span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setQuantity(Math.min(selectedVariant.quantity, quantity + 1))}
                                                disabled={quantity >= selectedVariant.quantity}
                                                className="h-8 w-8 p-0 flex-shrink-0"
                                            >
                                                <span className="text-lg font-bold">+</span>
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1 text-center">
                                            Max: {selectedVariant.quantity} available
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-3 pt-4 sm:pt-6 px-2 sm:px-0">
                            <Button
                                onClick={handleAddToCart}
                                disabled={!selectedVariant || addingToCart === selectedProduct?.id}
                                size="lg"
                                className="w-full h-14 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg text-sm sm:text-base font-medium rounded-xl sm:rounded-lg"
                            >
                                {addingToCart === selectedProduct?.id ? (
                                    <>
                                        <div className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                        <span className="text-xs sm:text-sm">Adding to Cart...</span>
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                        <span className="text-xs sm:text-sm">Add to Cart</span>
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsModalOpen(false)}
                                disabled={addingToCart === selectedProduct?.id}
                                size="lg"
                                className="w-full h-14 sm:h-10 text-sm sm:text-base font-medium rounded-xl sm:rounded-lg"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
