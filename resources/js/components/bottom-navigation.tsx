import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import {
    BarChart3,
    DollarSign,
    LayoutGrid,
    Menu,
    Package,
    Plus,
    Receipt,
    ShoppingCart,
    TrendingUp,
    Users,
    Wallet,
} from 'lucide-react';
import { useState } from 'react';

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
    [key: string]: unknown;
}

export function BottomNavigation() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    const [mobileActionDialogOpen, setMobileActionDialogOpen] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

    if (!isAdmin && !isManager) {
        return null; // Don't show for other roles
    }

    return (
        <>
            {/* Mobile Bottom Navigation */}
            <div className="sm:hidden">
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
                    <div className="flex items-center justify-around px-4 py-2">
                        {/* Dashboard */}
                        <Link href="/dashboard" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <LayoutGrid className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Dashboard</span>
                        </Link>

                        {/* Role-specific navigation items */}
                        {isAdmin ? (
                            // Admin Navigation
                            <>
                                <Link href="/products" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Products</span>
                                </Link>
                                <Link href="/sales" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <Receipt className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Sales</span>
                                </Link>
                                <Link href="/wallets" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <Wallet className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Wallets</span>
                                </Link>
                            </>
                        ) : (
                            // Manager Navigation
                            <>
                                <Link href="/dashboard" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Catalog</span>
                                </Link>
                                <Link href="/cart" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Cart</span>
                                </Link>
                                <Link href="/sales" className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                    <TrendingUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">My Sales</span>
                                </Link>
                            </>
                        )}

                        {/* Menu Button */}
                        <button 
                            onClick={() => setMobileSidebarOpen(true)}
                            className="flex flex-col items-center space-y-1 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Menu</span>
                        </button>
                    </div>
                </div>

                {/* Floating Action Button */}
                <div className="fixed bottom-20 right-4 z-50">
                    <Button
                        onClick={() => setMobileActionDialogOpen(true)}
                        className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 p-0 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <Plus className="h-6 w-6 text-white" />
                    </Button>
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
                                        <Wallet className="mr-3 h-4 w-4" />
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
