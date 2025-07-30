import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/icon';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

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
    product: {
        id: number;
        name: string;
        sku: string;
        msrp: number;
        quantity_on_hand: number;
    };
    quantity: number;
    sale_price: number;
    line_total: number;
}

interface CartPageProps {
    cartItems: CartItem[];
    total: number;
}

export default function CartPage({ cartItems, total }: CartPageProps) {
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [editingItem, setEditingItem] = useState<number | null>(null);
    const [editQuantity, setEditQuantity] = useState<number>(0);
    const [editPrice, setEditPrice] = useState<number>(0);

    const handleEditItem = (item: CartItem) => {
        setEditingItem(item.product_id);
        setEditQuantity(item.quantity);
        setEditPrice(item.sale_price);
    };

    const handleSaveEdit = async (productId: number) => {
        try {
            await fetch(`/api/cart/items/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    quantity: editQuantity,
                    sale_price: editPrice,
                }),
            });
            
            // Reload the page to get updated cart
            window.location.reload();
        } catch (error) {
            console.error('Error updating cart item:', error);
        }
    };

    const handleRemoveItem = async (productId: number) => {
        if (confirm('Are you sure you want to remove this item from cart?')) {
            try {
                await fetch(`/api/cart/items/${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });
                
                // Reload the page to get updated cart
                window.location.reload();
            } catch (error) {
                console.error('Error removing cart item:', error);
            }
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            alert('Your cart is empty.');
            return;
        }

        setIsCheckingOut(true);
        try {
            const response = await fetch('/api/cart/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    items: cartItems.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        sale_price: item.sale_price,
                    })),
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                // Download receipt
                const link = document.createElement('a');
                link.href = result.receipt_url;
                link.download = `receipt-${result.sale_id}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                alert('Sale completed successfully! Receipt downloaded.');
                window.location.href = '/dashboard';
            } else {
                alert(result.message || 'Checkout failed.');
            }
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
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Shopping Cart</h1>
                        <p className="text-muted-foreground">Review and checkout your items</p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline">
                            <Icon name="arrow-left" className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {cartItems.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-8">
                            <Icon name="shopping-cart" className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                            <p className="text-muted-foreground mb-4">
                                Add some products to your cart to get started.
                            </p>
                            <Link href="/dashboard">
                                <Button>
                                    <Icon name="plus" className="mr-2 h-4 w-4" />
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
                                                <th className="text-left p-2">Product</th>
                                                <th className="text-left p-2">SKU</th>
                                                <th className="text-left p-2">MSRP</th>
                                                <th className="text-left p-2">Quantity</th>
                                                <th className="text-left p-2">Sale Price</th>
                                                <th className="text-left p-2">Line Total</th>
                                                <th className="text-left p-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cartItems.map((item) => (
                                                <tr key={item.product_id} className="border-b">
                                                    <td className="p-2 font-medium">{item.product.name}</td>
                                                    <td className="p-2 text-sm text-muted-foreground">{item.product.sku}</td>
                                                    <td className="p-2">${item.product.msrp.toFixed(2)}</td>
                                                    <td className="p-2">
                                                        {editingItem === item.product_id ? (
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                max={item.product.quantity_on_hand}
                                                                value={editQuantity}
                                                                onChange={(e) => setEditQuantity(parseInt(e.target.value) || 0)}
                                                                className="w-20"
                                                            />
                                                        ) : (
                                                            item.quantity
                                                        )}
                                                    </td>
                                                    <td className="p-2">
                                                        {editingItem === item.product_id ? (
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min={item.product.msrp}
                                                                value={editPrice}
                                                                onChange={(e) => setEditPrice(parseFloat(e.target.value) || 0)}
                                                                className="w-24"
                                                            />
                                                        ) : (
                                                            `$${item.sale_price.toFixed(2)}`
                                                        )}
                                                    </td>
                                                    <td className="p-2 font-medium">
                                                        ${item.line_total.toFixed(2)}
                                                    </td>
                                                    <td className="p-2">
                                                        <div className="flex items-center space-x-2">
                                                            {editingItem === item.product_id ? (
                                                                <>
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={() => handleSaveEdit(item.product_id)}
                                                                    >
                                                                        <Icon name="check" className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => setEditingItem(null)}
                                                                    >
                                                                        <Icon name="x" className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleEditItem(item)}
                                                                    >
                                                                        <Icon name="edit" className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => handleRemoveItem(item.product_id)}
                                                                    >
                                                                        <Icon name="trash" className="h-4 w-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="flex justify-between items-center p-6">
                                <div>
                                    <p className="text-lg font-semibold">
                                        Total: ${total.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
                                    </p>
                                </div>
                                <Button
                                    size="lg"
                                    onClick={handleCheckout}
                                    disabled={isCheckingOut || cartItems.length === 0}
                                >
                                    {isCheckingOut ? (
                                        <>
                                            <Icon name="loader" className="mr-2 h-4 w-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="credit-card" className="mr-2 h-4 w-4" />
                                            Checkout
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