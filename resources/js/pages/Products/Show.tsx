import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Package, ShoppingCart, Star, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/hooks/use-cart';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Products',
        href: '/products',
    },
    {
        title: 'Product Details',
        href: '#',
    },
];

interface ProductVariant {
    id: number;
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
    brand?: string;
    category?: string;
    image_url?: string;
    features?: string[];
    meta_title?: string;
    meta_description?: string;
    is_active: boolean;
    variants: ProductVariant[];
}

interface ProductShowProps {
    product: Product;
}

export default function ProductShow({ product }: ProductShowProps) {
    const { addToCart } = useCart();
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [addingToCart, setAddingToCart] = useState(false);

    const handleAddToCart = async (variant: ProductVariant) => {
        if (!variant.is_active || variant.quantity <= 0) {
            alert('This variant is not available for purchase.');
            return;
        }

        setAddingToCart(true);
        try {
            addToCart({
                variant_id: variant.id,
                product_name: product.name,
                color: variant.color,
                size: variant.size,
                quantity: quantity,
                unit_price: variant.discount_price || variant.selling_price,
            });

            // Show success feedback
            alert('Product added to cart successfully!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            alert('Failed to add product to cart. Please try again.');
        } finally {
            setAddingToCart(false);
        }
    };

    const getStockStatus = (quantity: number, threshold: number) => {
        if (quantity === 0) return { status: 'Out of Stock', color: 'destructive' as const };
        if (quantity <= threshold) return { status: 'Low Stock', color: 'secondary' as const };
        return { status: 'In Stock', color: 'default' as const };
    };

    const getAvailableColors = (variants: ProductVariant[]) => {
        return [...new Set(variants.filter(v => v.is_active && v.quantity > 0).map(v => v.color).filter(Boolean))];
    };

    const getColorHex = (color: string) => {
        const colorMap: { [key: string]: string } = {
            'red': '#ef4444',
            'blue': '#3b82f6',
            'green': '#10b981',
            'yellow': '#f59e0b',
            'purple': '#8b5cf6',
            'pink': '#ec4899',
            'orange': '#f97316',
            'brown': '#a16207',
            'black': '#000000',
            'white': '#ffffff',
            'gray': '#6b7280',
        };
        return colorMap[color.toLowerCase()] || '#6b7280';
    };

    const availableColors = getAvailableColors(product.variants);
    const activeVariants = product.variants.filter(v => v.is_active);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 pb-20 sm:pb-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="outline" size="icon" className="h-10 w-10">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{product.name}</h1>
                            <p className="text-muted-foreground">Product Details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/products/${product.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Product
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Product Image and Basic Info */}
                    <div className="lg:col-span-1">
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                {/* Product Image */}
                                <div className="mb-6">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="h-64 w-full rounded-lg border object-cover md:h-96"
                                            onError={(e) => {
                                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex h-64 w-full items-center justify-center rounded-lg bg-muted md:h-96">
                                            <Package className="h-24 w-24 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>

                                {/* Product Status */}
                                <div className="mb-4 flex items-center justify-between">
                                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                        {product.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {activeVariants.length} variants
                                        </span>
                                    </div>
                                </div>

                                {/* Product Meta */}
                                <div className="space-y-3">
                                    {product.brand && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Brand</span>
                                            <span className="text-sm">{product.brand}</span>
                                        </div>
                                    )}
                                    {product.category && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-muted-foreground">Category</span>
                                            <span className="text-sm">{product.category}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Product Details and Variants */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Description */}
                        {product.description && (
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{product.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Product Features */}
                        {product.features && product.features.length > 0 && (
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Features</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {product.features.map((feature, index) => (
                                            <Badge key={index} variant="outline" className="px-3 py-1">
                                                {feature}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Product Variants */}
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Available Variants</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Select a variant to add to cart
                                </p>
                            </CardHeader>
                            <CardContent>
                                {activeVariants.length > 0 ? (
                                    <div className="space-y-4">
                                        {activeVariants.map((variant) => {
                                            const stockStatus = getStockStatus(variant.quantity, variant.low_stock_threshold);
                                            const isSelected = selectedVariant?.id === variant.id;
                                            const hasStock = variant.quantity > 0;

                                            return (
                                                <div
                                                    key={variant.id}
                                                    className={`rounded-lg border p-4 transition-all duration-200 ${
                                                        isSelected
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                    } ${!hasStock ? 'opacity-50' : 'cursor-pointer'}`}
                                                    onClick={() => hasStock && setSelectedVariant(variant)}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="mb-2 flex items-center gap-2">
                                                                {variant.color && (
                                                                    <div
                                                                        className="h-4 w-4 rounded-full border shadow-sm"
                                                                        style={{ backgroundColor: getColorHex(variant.color) }}
                                                                        title={variant.color}
                                                                    />
                                                                )}
                                                                <span className="font-medium">
                                                                    {variant.color && `${variant.color}`}
                                                                    {variant.size && ` - ${variant.size}`}
                                                                </span>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {variant.sku}
                                                                </Badge>
                                                            </div>

                                                            <div className="mb-3 flex items-center gap-4 text-sm">
                                                                <span className="text-muted-foreground">
                                                                    Stock: {variant.quantity}
                                                                </span>
                                                                <Badge variant={stockStatus.color}>
                                                                    {stockStatus.status}
                                                                </Badge>
                                                            </div>

                                                            <div className="flex items-center gap-4">
                                                                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                                                                    {variant.discount_price ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="line-through text-muted-foreground">
                                                                                {formatCurrency(variant.selling_price)}
                                                                            </span>
                                                                            <span>{formatCurrency(variant.discount_price)}</span>
                                                                        </div>
                                                                    ) : (
                                                                        formatCurrency(variant.selling_price)
                                                                    )}
                                                                </div>
                                                                {variant.discount_price && (
                                                                    <Badge variant="destructive" className="text-xs">
                                                                        {Math.round(((variant.selling_price - variant.discount_price) / variant.selling_price) * 100)}% OFF
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-col items-end gap-2">
                                                            {variant.image_url && (
                                                                <img
                                                                    src={variant.image_url}
                                                                    alt={`${product.name} - ${variant.color} ${variant.size}`}
                                                                    className="h-16 w-16 rounded-lg object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Add to Cart Section */}
                                                    {isSelected && hasStock && (
                                                        <div className="mt-4 border-t pt-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-2">
                                                                    <label htmlFor={`quantity-${variant.id}`} className="text-sm font-medium">
                                                                        Quantity:
                                                                    </label>
                                                                    <input
                                                                        id={`quantity-${variant.id}`}
                                                                        type="number"
                                                                        min="1"
                                                                        max={variant.quantity}
                                                                        value={quantity}
                                                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                                                        className="h-8 w-16 rounded border px-2 text-sm"
                                                                    />
                                                                </div>
                                                                <Button
                                                                    onClick={() => handleAddToCart(variant)}
                                                                    disabled={addingToCart}
                                                                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                                                                >
                                                                    {addingToCart ? (
                                                                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                                    ) : (
                                                                        <ShoppingCart className="mr-2 h-4 w-4" />
                                                                    )}
                                                                    Add to Cart
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                                        <p>No active variants available</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Available Colors */}
                        {availableColors.length > 0 && (
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Available Colors</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-3">
                                        {availableColors.map((color) => (
                                            <div key={color} className="flex items-center gap-2">
                                                <div
                                                    className="h-6 w-6 rounded-full border shadow-sm"
                                                    style={{ backgroundColor: getColorHex(color) }}
                                                />
                                                <span className="text-sm capitalize">{color}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
