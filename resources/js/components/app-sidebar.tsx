
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { 
    LayoutGrid, 
    Package, 
    Plus, 
    Receipt, 
    Users, 
    DollarSign, 
    Receipt as ReceiptIcon, 
    Percent,
    Building2,
    Warehouse,
    User as UserIcon,
    Users2,
    ClipboardList,
    Clock,
    Calendar,
    Leaf,
    Gift,
    FileText,
    BarChart3,
    ShoppingCart,
    CheckSquare,
    UserCheck,
    Box,
    TrendingUp,
    Calculator,
    ChevronDown,
    ChevronRight,
    Settings,
    History,
    Wallet,
    TrendingUp as TrendingUpIcon,
    FileText as FileTextIcon,
    UserPlus
} from 'lucide-react';
import AppLogo from './app-logo';

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

export function AppSidebar() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    const page = usePage<PageProps>();
    const isAdmin = user.role === 'admin';
    const isManager = user.role === 'manager';

    // Dashboard navigation based on role
    const dashboardHref = isAdmin ? '/admin-dashboard' : '/dashboard';
    const dashboardTitle = isAdmin ? 'Admin Dashboard' : 'Manager Dashboard';

    return (
        <Sidebar collapsible="icon" variant="inset" className="z-50">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboardHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Dashboard */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={page.url === dashboardHref} tooltip={{ children: dashboardTitle }}>
                                <Link href={dashboardHref} prefetch>
                                    <LayoutGrid />
                                    <span>{dashboardTitle}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Admin Navigation */}
                {isAdmin && (
                    <>
                        {/* Inventory Management */}
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Inventory Management</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/products') && !page.url.includes('/create')} tooltip={{ children: 'Products' }}>
                                        <Link href="/products" prefetch>
                                            <Package />
                                            <span>Products</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url === '/products/create'} tooltip={{ children: 'Add Product' }}>
                                        <Link href="/products/create" prefetch>
                                            <Plus />
                                            <span>Add Product</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/products')} tooltip={{ children: 'Stock Management' }}>
                                        <Link href="/products" prefetch>
                                            <Warehouse />
                                            <span>Stock Management</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* User Management */}
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>User Management</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/users')} tooltip={{ children: 'All Users' }}>
                                        <Link href="/users" prefetch>
                                            <Users />
                                            <span>All Users</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/users')} tooltip={{ children: 'Managers' }}>
                                        <Link href="/users" prefetch>
                                            <UserCheck />
                                            <span>Managers</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* Financial Management */}
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Financial Management</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/sales')} tooltip={{ children: 'All Sales' }}>
                                        <Link href="/sales" prefetch>
                                            <Receipt />
                                            <span>All Sales</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/expenses')} tooltip={{ children: 'Expenses' }}>
                                        <Link href="/expenses" prefetch>
                                            <ReceiptIcon />
                                            <span>Expenses</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/wallets')} tooltip={{ children: 'Wallets' }}>
                                        <Link href="/wallets" prefetch>
                                            <DollarSign />
                                            <span>Wallets</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/commission-rates')} tooltip={{ children: 'Commission Rates' }}>
                                        <Link href="/commission-rates" prefetch>
                                            <Percent />
                                            <span>Commission Rates</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* Reports & Analytics */}
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Reports & Analytics</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/sales')} tooltip={{ children: 'Sales Reports' }}>
                                        <Link href="/sales" prefetch>
                                            <BarChart3 />
                                            <span>Sales Reports</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/products')} tooltip={{ children: 'Product Reports' }}>
                                        <Link href="/products" prefetch>
                                            <Box />
                                            <span>Product Reports</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/expenses')} tooltip={{ children: 'Expense Reports' }}>
                                        <Link href="/expenses" prefetch>
                                            <FileTextIcon />
                                            <span>Expense Reports</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/users')} tooltip={{ children: 'User Reports' }}>
                                        <Link href="/users" prefetch>
                                            <Users />
                                            <span>User Reports</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    </>
                )}

                {/* Manager Navigation */}
                {isManager && (
                    <>
                        {/* Sales Operations */}
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Sales Operations</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/dashboard')} tooltip={{ children: 'Product Catalog' }}>
                                        <Link href="/dashboard" prefetch>
                                            <Package />
                                            <span>Product Catalog</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/cart')} tooltip={{ children: 'Shopping Cart' }}>
                                        <Link href="/cart" prefetch>
                                            <ShoppingCart />
                                            <span>Shopping Cart</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/sales')} tooltip={{ children: 'Sales History' }}>
                                        <Link href="/sales" prefetch>
                                            <History />
                                            <span>Sales History</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* My Expenses */}
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>My Expenses</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url === '/expenses/create'} tooltip={{ children: 'Submit Expense' }}>
                                        <Link href="/expenses/create" prefetch>
                                            <Plus />
                                            <span>Submit Expense</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/expenses') && page.url !== '/expenses/create'} tooltip={{ children: 'My Expense History' }}>
                                        <Link href="/expenses" prefetch>
                                            <ReceiptIcon />
                                            <span>My Expense History</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>

                        {/* My Wallet */}
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>My Wallet</SidebarGroupLabel>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/wallet')} tooltip={{ children: 'Wallet Balance' }}>
                                        <Link href="/wallet" prefetch>
                                            <Wallet />
                                            <span>Wallet Balance</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                                <SidebarMenuItem>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith('/wallet')} tooltip={{ children: 'Transaction History' }}>
                                        <Link href="/wallet" prefetch>
                                            <History />
                                            <span>Transaction History</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                    </>
                )}
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
