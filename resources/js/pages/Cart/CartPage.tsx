// import { Icon } from '@/components/icon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, CreditCard, Edit, Loader, Plus, ShoppingCart, Trash, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';

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
    product_id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
}

interface CartPageProps {
    cartItems?: CartItem[];
    total?: number;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function CartPage({ cartItems: backendCartItems, total: backendTotal, flash }: CartPageProps) {
    const { cart: frontendCart, updateCartItem, removeFromCart, clearCart, getCartTotal } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [checkoutSuccess, setCheckoutSuccess] = useState(false);
    const [editingItem, setEditingItem] = useState<number | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(0);
    const [editPrice, setEditPrice] = useState<number>(0);
    const [updatingItem, setUpdatingItem] = useState<number | null>(null);
    const [removingItem, setRemovingItem] = useState<number | null>(null);

    // Use frontend cart data from localStorage
    const cartItems = Object.values(frontendCart).map(item => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
    }));

    const total = getCartTotal();

    const handleEditItem = (item: CartItem) => {
        setEditingItem(item.product_id);
        setEditQuantity(item.quantity);
        setEditPrice(item.unit_price);
    };

    const handleSaveEdit = async (productId: number) => {
        setUpdatingItem(productId);
        try {
            // Update frontend cart
            updateCartItem(productId, editQuantity);
            
            // Also update backend cart
            await router.put(`/cart/items/${productId}`, {
                quantity: editQuantity,
                unit_price: editPrice,
            });
            setEditingItem(null);
        } catch (error) {
            console.error('Error updating cart item:', error);
        } finally {
            setUpdatingItem(null);
        }
    };

    const handleRemoveItem = async (productId: number) => {
        if (confirm('Are you sure you want to remove this item from cart?')) {
            setRemovingItem(productId);
            try {
                // Remove from frontend cart
                removeFromCart(productId);
                
                // Also remove from backend cart
                await router.delete(`/cart/items/${productId}`);
            } catch (error) {
                console.error('Error removing cart item:', error);
            } finally {
                setRemovingItem(null);
            }
        }
    };

    const handleCheckout = async (retryCount = 0) => {
        if (cartItems.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        setIsCheckingOut(true);
        let saleId: number | null = null;
        const maxRetries = 2;
        
        try {
            // Prepare cart data for backend sync
            const cartDataForSync = cartItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
            }));

            console.log('Starting checkout process...', { cartItems: cartDataForSync });

            // Step 1: Sync the cart with the backend
            console.log('Step 1: Syncing cart data...');
            await router.post('/cart/sync', { cart: cartDataForSync });
            console.log('✅ Cart synced successfully');
            
            // Step 2: Proceed with checkout
            console.log('Step 2: Processing checkout...');
            await router.post('/cart/checkout');
            console.log('✅ Checkout completed');
            
            // Step 3: Since Inertia redirects, we'll skip sale ID extraction for now
            // The backend will handle the redirect to the receipt page
            console.log('✅ Checkout process completed, backend will redirect to receipt');
            
            // Since Inertia handles the redirect, show success and clear cart
            setCheckoutSuccess(true);
            clearCart();
            console.log('✅ Frontend cart cleared after successful checkout');
            
        } catch (error: any) {
            console.error('❌ Checkout failed:', error);
            
            // Handle specific error types and retry logic
            if (error.response?.status === 422) {
                const errorMessage = error.response.data?.message || 'Validation error occurred';
                alert(`Validation Error: ${errorMessage}`);
            } else if (error.response?.status === 500) {
                // Retry for server errors
                if (retryCount < maxRetries) {
                    console.log(`🔄 Retrying checkout (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                    setTimeout(() => {
                        handleCheckout(retryCount + 1);
                    }, 1000 * (retryCount + 1)); // Exponential backoff
                    return;
                } else {
                    alert('Server Error: Multiple attempts failed. Please try again later or contact support.');
                }
            } else if (error.response?.status === 403) {
                alert('Access Denied: You are not authorized to complete this sale.');
            } else if (error.message?.includes('verification')) {
                // Retry for verification errors
                if (retryCount < maxRetries) {
                    console.log(`🔄 Retrying verification (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                    setTimeout(() => {
                        handleCheckout(retryCount + 1);
                    }, 1000 * (retryCount + 1));
                    return;
                } else {
                    alert(`Sale Verification Failed: ${error.message}`);
                }
            } else {
                // Retry for network errors
                if (retryCount < maxRetries && (!error.response || error.code === 'NETWORK_ERROR')) {
                    console.log(`🔄 Retrying due to network error (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                    setTimeout(() => {
                        handleCheckout(retryCount + 1);
                    }, 1000 * (retryCount + 1));
                    return;
                } else {
                    alert('Checkout Failed: Please try again. If the problem persists, contact support.');
                }
            }
            
            // Don't clear cart on error
            console.log('❌ Cart preserved due to error');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Shopping Cart" />

            {/* Success Overlay Animation */}
            {checkoutSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="relative bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-2xl transform transition-all duration-500 scale-100 animate-in fade-in-0 zoom-in-95">
                        {/* Success Icon with Animation */}
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center animate-pulse">
                                    <Check className="w-10 h-10 text-green-600 dark:text-green-400 animate-bounce" />
                                </div>
                                {/* Ripple Effect */}
                                <div className="absolute inset-0 w-20 h-20 bg-green-200 dark:bg-green-800/40 rounded-full animate-ping"></div>
                            </div>
                        </div>
                        
                        {/* Success Message */}
                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Sale Completed!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Redirecting to your receipt...
                            </p>
                        </div>
                        
                        {/* Loading Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-green-500 rounded-full animate-pulse transition-all duration-1000 ease-out"></div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 md:p-6 pb-20 sm:pb-6">
                {/* Success Message */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                        <div className="flex items-start gap-3">
                            <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
                            <div>
                                <h3 className="font-medium">Success!</h3>
                                <p className="text-sm">{flash.success}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                        <div className="flex items-start gap-3">
                            <X className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                            <div>
                                <h3 className="font-medium">Error!</h3>
                                <p className="text-sm">{flash.error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Shopping Cart</h1>
                        <p className="mt-1 text-muted-foreground">Review and checkout your items</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline" className="hidden md:inline-flex">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                        <Button variant="outline" size="icon" className="md:hidden">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>

                {cartItems.length === 0 ? (
                    <Card className="border-0 shadow-none">
                        <CardContent className="py-12 text-center">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                                <ShoppingCart className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="mb-3 text-xl font-semibold">Your cart is empty</h3>
                            <p className="mx-auto mb-6 max-w-md text-muted-foreground">Add some products to your cart to get started.</p>
                            <Link href="/dashboard">
                                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Browse Products
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className={`transition-all duration-500 ${checkoutSuccess ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Cart Items */}
                        <div className="space-y-4 lg:col-span-2 order-last lg:order-first">
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="px-4 py-4 md:px-6">
                                    <CardTitle className="text-lg">
                                        Cart Items <span className="text-muted-foreground">({cartItems.length})</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-0 pb-0">
                                    <div className="divide-y">
                                        {cartItems.map((item) => {
                                            const isEditing = editingItem === item.product_id;
                                            const isUpdating = updatingItem === item.product_id;
                                            const isRemoving = removingItem === item.product_id;

                                            // Get max quantity for validation
                                            const maxQuantity = 999; // Reasonable limit

                                            return (
                                                <div
                                                    key={item.product_id}
                                                    className={`relative px-4 py-5 transition-all duration-300 md:px-6 ${isRemoving ? 'opacity-50' : ''}`}
                                                >
                                                    <div className="flex gap-4">
                                                        {/* Product Image - Placeholder */}
                                                        <div className="flex-shrink-0">
                                                            <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                                                                <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                        </div>

                                                        {/* Product Details */}
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                                                                <div className="min-w-0">
                                                                    <h3 className="truncate font-medium">{item.product_name}</h3>
                                                                    <p className="truncate text-sm text-muted-foreground">
                                                                        Product
                                                                    </p>
                                                                </div>

                                                                <div className="mt-1 text-lg font-semibold md:mt-0">
                                                                    {formatCurrency(item.total_price)}
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 flex flex-wrap items-center gap-4">
                                                                {/* Quantity */}
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-muted-foreground">Qty:</span>
                                                                    {isEditing ? (
                                                                        <div className="flex items-center space-x-1">
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                                                                disabled={editQuantity <= 1}
                                                                                className="h-8 w-8 p-0 flex-shrink-0"
                                                                            >
                                                                                <span className="text-sm font-bold">-</span>
                                                                            </Button>
                                                                            <div className="flex-1 text-center">
                                                                                <span className="text-sm font-medium px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md min-w-[40px] inline-block">
                                                                                    {editQuantity}
                                                                                </span>
                                                                            </div>
                                                                            <Button
                                                                                type="button"
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => setEditQuantity(Math.min(maxQuantity, editQuantity + 1))}
                                                                                disabled={editQuantity >= maxQuantity}
                                                                                className="h-8 w-8 p-0 flex-shrink-0"
                                                                            >
                                                                                <span className="text-sm font-bold">+</span>
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="font-medium">{item.quantity}</span>
                                                                    )}
                                                                </div>

                                                                {/* Unit Price */}
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm text-muted-foreground">Price:</span>
                                                                    {isEditing ? (
                                                                        <Input
                                                                            type="number"
                                                                            step="0.01"
                                                                            min="0"
                                                                            value={editPrice}
                                                                            onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                                                                            className="h-10 w-28 sm:h-8 sm:w-24"
                                                                            disabled={isUpdating}
                                                                        />
                                                                    ) : (
                                                                        <span className="font-medium">{formatCurrency(item.unit_price)}</span>
                                                                    )}
                                                                </div>

                                                                {/* Actions */}
                                                                <div className="ml-auto flex items-center gap-2">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <Button
                                                                                size="sm"
                                                                                onClick={() => handleSaveEdit(item.product_id)}
                                                                                disabled={isUpdating}
                                                                                className="h-10 w-10 sm:h-8 sm:w-8 p-0"
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
                                                                                className="h-10 w-10 sm:h-8 sm:w-8 p-0"
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
                                                                                className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-blue-600 hover:bg-blue-50"
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="outline"
                                                                                size="sm"
                                                                                onClick={() => handleRemoveItem(item.product_id)}
                                                                                disabled={isRemoving}
                                                                                className="h-10 w-10 sm:h-8 sm:w-8 p-0 text-red-600 hover:bg-red-50"
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
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Order Summary */}
                        <div className={`order-first lg:order-last transition-all duration-500 ${checkoutSuccess ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
                            <Card className="border-0 shadow-sm lg:sticky lg:top-6">
                                <CardHeader className="px-4 py-4 md:px-6">
                                    <CardTitle className="text-lg">Order Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-medium">{formatCurrency(total)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tax</span>
                                            <span className="font-medium">-</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Shipping</span>
                                            <span className="font-medium">-</span>
                                        </div>
                                        <div className="mt-2 border-t pt-4">
                                            <div className="flex justify-between text-base font-semibold">
                                                <span>Total</span>
                                                <span>{formatCurrency(total)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        size="lg"
                                        onClick={() => handleCheckout()}
                                        disabled={isCheckingOut || checkoutSuccess || cartItems.length === 0}
                                        className="mt-6 w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCheckingOut ? (
                                            <>
                                                <Loader className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : checkoutSuccess ? (
                                            <>
                                                <Check className="mr-2 h-4 w-4" />
                                                Sale Completed!
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Complete Sale
                                            </>
                                        )}
                                    </Button>

                                    <div className="mt-4 text-center">
                                        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
                                            Continue Shopping
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
