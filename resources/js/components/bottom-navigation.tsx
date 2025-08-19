import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    DollarSign,
    LayoutGrid,
    Menu,
    Package,
    Plus,
    Receipt,
    Search,
    ShoppingCart,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/use-cart';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager';
}

interface PageProps {
    auth: {
        user: User;
    };
    cartCount?: number;
    [key: string]: unknown;
}

export function BottomNavigation() {
    const { auth, url } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';
    const { cartCount } = useCart();



    const [mobileActionDialogOpen, setMobileActionDialogOpen] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    // Listen for cart updates to ensure immediate re-render
    useEffect(() => {
        const handleCartUpdate = () => {
            // Force re-render by updating a state variable
            setMobileActionDialogOpen(prev => prev);
        };

        window.addEventListener('cartUpdated', handleCartUpdate);
        
        return () => {
            window.removeEventListener('cartUpdated', handleCartUpdate);
        };
    }, []);

    // Check if a route is active
    const isActiveRoute = (path: string) => {
        return url === path;
    };

    if (!isAdmin && !isManager) {
        return null; // Don't show for other roles
    }

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden">
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-200 dark:bg-gray-900/95 dark:border-gray-700 shadow-lg">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Left Navigation Items */}
                        <div className="flex items-center space-x-4">
                            {/* Dashboard/Home */}
                            <Link 
                                href="/dashboard" 
                                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                                    isActiveRoute('/dashboard') 
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                }`}
                            >
                                <LayoutGrid className={`h-5 w-5 ${isActiveRoute('/dashboard') ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                <span className="text-xs font-medium">Home</span>
                            </Link>

                            {/* Expenses for managers */}
                            {isManager && (
                                <Link 
                                    href="/expenses" 
                                    className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                                        isActiveRoute('/expenses') 
                                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <Receipt className={`h-5 w-5 ${isActiveRoute('/expenses') ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                    <span className="text-xs font-medium">Expenses</span>
                                </Link>
                            )}

                            {/* Products for admins */}
                            {isAdmin && (
                                <Link 
                                    href="/products" 
                                    className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                                        isActiveRoute('/products') 
                                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <Package className={`h-5 w-5 ${isActiveRoute('/products') ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                    <span className="text-xs font-medium">Products</span>
                                </Link>
                            )}
                        </div>

                        {/* Center Plus Button - Smaller and properly sized */}
                        <div className="flex-shrink-0 -mt-4">
                            <Button
                                onClick={() => setMobileActionDialogOpen(true)}
                                className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                            >
                                <Plus className="h-6 w-6 text-white" />
                            </Button>
                        </div>

                        {/* Right Navigation Items */}
                        <div className="flex items-center space-x-4">
                            {/* Role-specific right items */}
                            {isAdmin ? (
                                <>
                                    <Link 
                                        href="/sales" 
                                        className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                                            isActiveRoute('/sales') 
                                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        <Receipt className={`h-5 w-5 ${isActiveRoute('/sales') ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                        <span className="text-xs font-medium">Sales</span>
                                    </Link>
                                    <Link 
                                        href="/wallets" 
                                        className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                                            isActiveRoute('/wallets') 
                                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        <Wallet className={`h-5 w-5 ${isActiveRoute('/wallets') ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                        <span className="text-xs font-medium">Wallets</span>
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {/* Cart with indicator - only show for managers */}
                                    <Link 
                                        href="/cart" 
                                        className={`relative flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                                            isActiveRoute('/cart') 
                                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        <ShoppingCart className={`h-5 w-5 ${isActiveRoute('/cart') ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                        <span className="text-xs font-medium">Cart</span>
                                        {/* Cart Badge - only show when cartCount > 0 */}
                                        {cartCount > 0 && (
                                            <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-in zoom-in-95 duration-200">
                                                {cartCount > 99 ? '99+' : cartCount}
                                            </div>
                                        )}
                                    </Link>
                                    <Link 
                                        href="/sales" 
                                        className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all duration-200 ${
                                            isActiveRoute('/sales') 
                                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                        }`}
                                    >
                                        <TrendingUp className={`h-5 w-5 ${isActiveRoute('/sales') ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                        <span className="text-xs font-medium">Sales</span>
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Action Dialog - Role-based content */}
            <Dialog open={mobileActionDialogOpen} onOpenChange={setMobileActionDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {isAdmin ? 'Quick Actions' : 'Make Sale'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 p-4">
                        {isAdmin ? (
                            // Admin Actions
                            <>
                                <Link href="/products/create" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <Plus className="h-6 w-6" />
                                        <span className="text-sm font-medium">Add Product</span>
                                    </Button>
                                </Link>
                                <Link href="/expenses/create" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <Receipt className="h-6 w-6" />
                                        <span className="text-sm font-medium">Add Expense</span>
                                    </Button>
                                </Link>
                                <Link href="/users/create" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <Users className="h-6 w-6" />
                                        <span className="text-sm font-medium">Add User</span>
                                    </Button>
                                </Link>
                                <Link href="/wallets" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <Wallet className="h-6 w-6" />
                                        <span className="text-sm font-medium">View Wallets</span>
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            // Manager Actions
                            <>
                                <Link href="/dashboard" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <ShoppingCart className="h-6 w-6" />
                                        <span className="text-sm font-medium">Browse Products</span>
                                    </Button>
                                </Link>
                                <Link href="/cart" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <ShoppingCart className="h-6 w-6" />
                                        <span className="text-sm font-medium">View Cart</span>
                                        {/* Show cart count if items exist */}
                                        {cartCount > 0 && (
                                            <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                                {cartCount > 99 ? '99+' : cartCount}
                                            </div>
                                        )}
                                    </Button>
                                </Link>
                                <Link href="/expenses/create" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <Receipt className="h-6 w-6" />
                                        <span className="text-sm font-medium">Add Expense</span>
                                    </Button>
                                </Link>
                                <Link href="/sales" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <TrendingUp className="h-6 w-6" />
                                        <span className="text-sm font-medium">Sales History</span>
                                    </Button>
                                </Link>
                                <Link href="/wallets" onClick={() => setMobileActionDialogOpen(false)}>
                                    <Button className="w-full h-20 flex-col space-y-2" variant="outline">
                                        <DollarSign className="h-6 w-6" />
                                        <span className="text-sm font-medium">My Wallet</span>
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Mobile Sidebar Dialog - Role-based navigation */}
            <Dialog open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {isAdmin ? 'Admin Navigation' : 'Manager Menu'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 p-4">
                        {isAdmin ? (
                            // Admin Navigation Menu
                            <>
                                <Link href="/dashboard" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <LayoutGrid className="mr-3 h-4 w-4" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <Link href="/products" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Package className="mr-3 h-4 w-4" />
                                        Products
                                    </Button>
                                </Link>
                                <Link href="/users" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Users className="mr-3 h-4 w-4" />
                                        Users
                                    </Button>
                                </Link>
                                <Link href="/wallets" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <DollarSign className="mr-3 h-4 w-4" />
                                        Manager Wallets
                                    </Button>
                                </Link>
                                <Link href="/expenses" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Receipt className="mr-3 h-4 w-4" />
                                        Expenses
                                    </Button>
                                </Link>
                                <Link href="/sales" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Receipt className="mr-3 h-4 w-4" />
                                        View All Sales
                                    </Button>
                                </Link>
                                <Link href="/commission-rates" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <BarChart3 className="mr-3 h-4 w-4" />
                                        Commission Rates
                                    </Button>
                                </Link>
                            </>
                        ) : (
                            // Manager Navigation Menu
                            <>
                                <Link href="/dashboard" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <LayoutGrid className="mr-3 h-4 w-4" />
                                        Dashboard
                                    </Button>
                                </Link>
                                <Link href="/dashboard" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <ShoppingCart className="mr-3 h-4 w-4" />
                                        Product Catalog
                                    </Button>
                                </Link>
                                <Link href="/cart" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <ShoppingCart className="mr-3 h-4 w-4" />
                                        Shopping Cart
                                        {/* Show cart count if items exist */}
                                        {cartCount > 0 && (
                                            <div className="ml-auto h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                                {cartCount > 99 ? '99+' : cartCount}
                                            </div>
                                        )}
                                    </Button>
                                </Link>
                                <Link href="/sales" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <TrendingUp className="mr-3 h-4 w-4" />
                                        Sales History
                                    </Button>
                                </Link>
                                <Link href="/expenses" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Receipt className="mr-3 h-4 w-4" />
                                        My Expenses
                                    </Button>
                                </Link>
                                <Link href="/expenses/create" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <Plus className="mr-3 h-4 w-4" />
                                        Add Expense
                                    </Button>
                                </Link>
                                <Link href="/wallets" onClick={() => setMobileSidebarOpen(false)}>
                                    <Button className="w-full justify-start" variant="ghost">
                                        <DollarSign className="mr-3 h-4 w-4" />
                                        My Wallet
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
