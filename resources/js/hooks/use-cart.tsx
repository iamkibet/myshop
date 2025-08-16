import { useEffect, useState } from 'react';

interface CartItem {
    variant_id: number;
    quantity: number;
    unit_price: number;
    product_name: string;
    color?: string;
    size?: string;
    image_url?: string;
}

interface Cart {
    [variantId: number]: CartItem;
}

export function useCart() {
    const [cart, setCart] = useState<Cart>({});
    const [cartCount, setCartCount] = useState(0);

    // Initialize cart from localStorage
    useEffect(() => {
        console.log('useCart useEffect - initializing cart');
        const storedCart = localStorage.getItem('cart');
        console.log('useCart useEffect - storedCart from localStorage:', storedCart);
        if (storedCart) {
            try {
                const parsedCart = JSON.parse(storedCart);
                console.log('useCart useEffect - parsedCart:', parsedCart);
                setCart(parsedCart);
                updateCartCount(parsedCart);
            } catch (error) {
                console.error('Error parsing cart from localStorage:', error);
            }
        } else {
            console.log('useCart useEffect - no stored cart found');
        }
    }, []);

    // Update cart count
    const updateCartCount = (cartData: Cart) => {
        const count = Object.values(cartData).reduce((total, item) => total + item.quantity, 0);
        console.log('updateCartCount - cartData:', cartData);
        console.log('updateCartCount - calculated count:', count);
        setCartCount(count);
        console.log('updateCartCount - cartCount state set to:', count);
    };

    // Add item to cart
    const addToCart = (item: CartItem) => {
        console.log('Adding to cart:', item);
        const newCart = { ...cart };
        newCart[item.variant_id] = item;
        console.log('New cart state:', newCart);
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        updateCartCount(newCart);
        console.log('Cart count updated:', Object.values(newCart).reduce((total, item) => total + item.quantity, 0));
    };

    // Update cart item
    const updateCartItem = (variantId: number, quantity: number) => {
        const newCart = { ...cart };
        if (newCart[variantId]) {
            newCart[variantId].quantity = quantity;
            setCart(newCart);
            localStorage.setItem('cart', JSON.stringify(newCart));
            updateCartCount(newCart);
        }
    };

    // Remove item from cart
    const removeFromCart = (variantId: number) => {
        const newCart = { ...cart };
        delete newCart[variantId];
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        updateCartCount(newCart);
    };

    // Clear cart
    const clearCart = () => {
        setCart({});
        setCartCount(0);
        localStorage.removeItem('cart');
    };

    // Sync cart with backend (for checkout)
    const syncCartWithBackend = async (cartData: CartItem[]) => {
        try {
            const response = await fetch('/cart/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ cart: cartData }),
            });

            if (!response.ok) {
                throw new Error('Failed to sync cart');
            }

            return await response.json();
        } catch (error) {
            console.error('Error syncing cart:', error);
            throw error;
        }
    };

    // Get cart total
    const getCartTotal = () => {
        return Object.values(cart).reduce((total, item) => total + (item.quantity * item.unit_price), 0);
    };

    return {
        cart,
        cartCount,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        syncCartWithBackend,
        getCartTotal,
    };
}
