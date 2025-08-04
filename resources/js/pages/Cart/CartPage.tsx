// import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, CreditCard, Edit, Loader, Plus, ShoppingCart, Trash, X } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Cart',
        href: '/cart',
    },
];

interface CartItem {
    variant_id: number;
    product_variant: {
        id: number;
        product: {
            id: number;
            name: string;
            sku: string;
        };
        color?: string;
        size?: string;
        quantity: number;
        selling_price: number;
        discount_price?: number;
    };
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface CartPageProps {
    cartItems: CartItem[];
    total: number;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CartPage({ cartItems, total, flash }: CartPageProps) {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [editingItem, setEditingItem] = useState<number | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(0);
    const [editPrice, setEditPrice] = useState<number>(0);
    const [updatingItem, setUpdatingItem] = useState<number | null>(null);
    const [removingItem, setRemovingItem] = useState<number | null>(null);

    // Ensure cartItems is always an array
    const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
    const safeTotal = total || 0;

    const handleEditItem = (item: CartItem) => {
        setEditingItem(item.variant_id);
        setEditQuantity(item.quantity);
        setEditPrice(item.unit_price);
    };

    const handleSaveEdit = async (variantId: number) => {
        setUpdatingItem(variantId);
        try {
            await router.put(`/cart/items/${variantId}`, {
                quantity: editQuantity,
                sale_price: editPrice,
            });
            setEditingItem(null);
        } catch (error) {
            console.error('Error updating cart item:', error);
        } finally {
            setUpdatingItem(null);
        }
    };

    const handleRemoveItem = async (variantId: number) => {
        if (confirm('Are you sure you want to remove this item from cart?')) {
            setRemovingItem(variantId);
            try {
                await router.delete(`/cart/items/${variantId}`);
            } catch (error) {
                console.error('Error removing cart item:', error);
            } finally {
                setRemovingItem(null);
            }
        }
    };

    const handleCheckout = async () => {
        if (safeCartItems.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        setIsCheckingOut(true);
        try {
            await router.post('/cart/checkout');

            // The controller will redirect to dashboard with success message
        } catch (error) {
            console.error('Error during checkout:', error);
            alert('Checkout failed. Please try again.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shopping Cart" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
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

                {/* Error Message */}
                {flash?.error && (
                    <div className="rounded-md border border-red-200 bg-red-50 p-4">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error!</h3>
                                <p className="text-sm text-red-700">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Shopping Cart</h1>
                        <p className="text-muted-foreground">Review and checkout your items</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {safeCartItems.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-lg font-semibold">Your cart is empty</h3>
                            <p className="mb-4 text-muted-foreground">Add some products to your cart to get started.</p>
                            <Link href="/dashboard">
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Browse Products
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle>Cart Items</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="p-2 text-left">Product</th>
                                                <th className="p-2 text-left">Variant</th>
                                                <th className="p-2 text-left">SKU</th>
                                                <th className="p-2 text-left">Price</th>
                                                <th className="p-2 text-left">Quantity</th>
                                                <th className="p-2 text-left">Unit Price</th>
                                                <th className="p-2 text-left">Line Total</th>
                                                <th className="p-2 text-left">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {safeCartItems.map((item) => {
                                                const isEditing = editingItem === item.variant_id;
                                                const isUpdating = updatingItem === item.variant_id;
                                                const isRemoving = removingItem === item.variant_id;

                                                // Ensure msrp is a number
                                                const msrp =
                                                    typeof item.product_variant.selling_price === 'string'
                                                        ? parseFloat(item.product_variant.selling_price)
                                                        : item.product_variant.selling_price || 0;

                                                return (
                                                    <tr
                                                        key={item.variant_id}
                                                        className={`border-b transition-all duration-300 ${isRemoving ? 'opacity-50' : ''}`}
                                                    >
                                                        <td className="p-2 font-medium">{item.product_variant.product.name}</td>
                                                        <td className="p-2 text-sm text-muted-foreground">
                                                            {item.product_variant.color && item.product_variant.size
                                                                ? `${item.product_variant.color} ${item.product_variant.size}`
                                                                : item.product_variant.color || item.product_variant.size || 'Default'}
                                                        </td>
                                                        <td className="p-2 text-sm text-muted-foreground">{item.product_variant.product.sku}</td>
                                                        <td className="p-2">${msrp.toFixed(2)}</td>
                                                        <td className="p-2">
                                                            {isEditing ? (
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    max={item.product_variant.quantity}
                                                                    value={editQuantity}
                                                                    onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                                                    className="w-20"
                                                                    disabled={isUpdating}
                                                                />
                                                            ) : (
                                                                item.quantity
                                                            )}
                                                        </td>
                                                        <td className="p-2">
                                                            {isEditing ? (
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min={msrp}
                                                                    value={editPrice}
                                                                    onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                                                                    className="w-24"
                                                                    disabled={isUpdating}
                                                                />
                                                            ) : (
                                                                formatCurrency(item.unit_price)
                                                            )}
                                                        </td>
                                                        <td className="p-2 font-medium">{formatCurrency(item.total_price)}</td>
                                                        <td className="p-2">
                                                            <div className="flex items-center space-x-2">
                                                                {isEditing ? (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleSaveEdit(item.variant_id)}
                                                                            disabled={isUpdating}
                                                                            className="transition-all duration-200"
                                                                        >
                                                                            {isUpdating ? (
                                                                                <Loader className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Check className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => setEditingItem(null)}
                                                                            disabled={isUpdating}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleEditItem(item)}
                                                                            disabled={isRemoving}
                                                                            className="transition-all duration-200 hover:bg-blue-50"
                                                                        >
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            onClick={() => handleRemoveItem(item.variant_id)}
                                                                            disabled={isRemoving}
                                                                            className="transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                                                                        >
                                                                            {isRemoving ? (
                                                                                <Loader className="h-4 w-4 animate-spin" />
                                                                            ) : (
                                                                                <Trash className="h-4 w-4" />
                                                                            )}
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <p className="text-lg font-semibold">Total: {formatCurrency(safeTotal)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {safeCartItems.length} item{safeCartItems.length !== 1 ? 's' : ''} in cart
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut || safeCartItems.length === 0}
                                    className="transition-all duration-300 hover:scale-105"
                                >
                                    {isCheckingOut ? (
                                        <>
                                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            Complete Sale
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
