import { useEffect, useState } from 'react';

interface CartItem {
    product_id: number;
    quantity: number;
    unit_price: number;
    product_name: string;
    image_url?: string;
}

interface Cart {
    [productId: number]: CartItem;
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

    // Listen for localStorage changes to sync cart across components
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'cart') {
                console.log('useCart - localStorage changed, updating cart');
                if (e.newValue) {
                    try {
                        const newCart = JSON.parse(e.newValue);
                        setCart(newCart);
                        updateCartCount(newCart);
                    } catch (error) {
                        console.error('Error parsing updated cart:', error);
                    }
                } else {
                    // Cart was cleared
                    setCart({});
                    setCartCount(0);
                }
            }
        };

        // Listen for storage events from other tabs/windows
        window.addEventListener('storage', handleStorageChange);

        // Custom event listener for same-tab updates
        const handleCartUpdate = () => {
            console.log('useCart - custom cart update event received');
            const storedCart = localStorage.getItem('cart');
            if (storedCart) {
                try {
                    const parsedCart = JSON.parse(storedCart);
                    setCart(parsedCart);
                    updateCartCount(parsedCart);
                } catch (error) {
                    console.error('Error parsing cart from custom event:', error);
                }
            } else {
                setCart({});
                setCartCount(0);
            }
        };

        window.addEventListener('cartUpdated', handleCartUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
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
        console.log('Current cart state before update:', cart);
        console.log('Current cartCount before update:', cartCount);
        
        const newCart = { ...cart };
        newCart[item.product_id] = item;
        console.log('New cart state:', newCart);
        
        // Update cart state first
        setCart(newCart);
        
        // Update localStorage
        localStorage.setItem('cart', JSON.stringify(newCart));
        
        // Calculate and update cart count immediately
        const newCount = Object.values(newCart).reduce((total, item) => total + item.quantity, 0);
        console.log('New cart count calculated:', newCount);
        setCartCount(newCount);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        
        console.log('Cart count updated to:', newCount);
        console.log('Final cart state:', newCart);
    };

    // Update cart item
    const updateCartItem = (productId: number, quantity: number) => {
        console.log('Updating cart item:', productId, 'quantity:', quantity);
        const newCart = { ...cart };
        if (newCart[productId]) {
            newCart[productId].quantity = quantity;
            
            // Update cart state first
            setCart(newCart);
            
            // Update localStorage
            localStorage.setItem('cart', JSON.stringify(newCart));
            
            // Calculate and update cart count immediately
            const newCount = Object.values(newCart).reduce((total, item) => total + item.quantity, 0);
            setCartCount(newCount);
            
            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('cartUpdated'));
        }
    };

    // Remove item from cart
    const removeFromCart = (productId: number) => {
        console.log('Removing cart item:', productId);
        const newCart = { ...cart };
        delete newCart[productId];
        
        // Update cart state first
        setCart(newCart);
        
        // Update localStorage
        localStorage.setItem('cart', JSON.stringify(newCart));
        
        // Calculate and update cart count immediately
        const newCount = Object.values(newCart).reduce((total, item) => total + item.quantity, 0);
        setCartCount(newCount);
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    };

    // Clear cart
    const clearCart = () => {
        console.log('Clearing cart');
        
        // Update cart state first
        setCart({});
        setCartCount(0);
        
        // Update localStorage
        localStorage.removeItem('cart');
        
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('cartUpdated'));
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
