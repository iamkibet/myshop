import { useEffect, useState } from 'react';

interface CartItem {
    variant_id: number;
    quantity: number;
    unit_price: number;
    product_name: string;
    color?: string;
    size?: string;
}

interface Cart {
    [variantId: number]: CartItem;
}

export function useCart() {
    const [cart, setCart] = useState<Cart>({});
    const [cartCount, setCartCount] = useState(0);

    // Initialize cart from localStorage
    useEffect(() => {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
            try {
                const parsedCart = JSON.parse(storedCart);
                setCart(parsedCart);
                updateCartCount(parsedCart);
            } catch (error) {
                console.error('Error parsing cart from localStorage:', error);
            }
        }
    }, []);

    // Update cart count
    const updateCartCount = (cartData: Cart) => {
        const count = Object.values(cartData).reduce((total, item) => total + item.quantity, 0);
        setCartCount(count);
    };

    // Add item to cart
    const addToCart = (item: CartItem) => {
        const newCart = { ...cart };
        newCart[item.variant_id] = item;
        setCart(newCart);
        localStorage.setItem('cart', JSON.stringify(newCart));
        updateCartCount(newCart);
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
        getCartTotal,
    };
}
