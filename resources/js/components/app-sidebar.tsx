
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
    Calculator
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

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
        },
    ];

    // Stores section - using existing routes
    const storesNavItems: NavItem[] = [
        {
            title: 'Products',
            href: '/products',
            icon: Package,
        },
        {
            title: 'Inventory',
            href: '/products',
            icon: Warehouse,
        },
    ];

    // HRM section - using existing routes
    const hrmNavItems: NavItem[] = [
        {
            title: 'Users',
            href: '/users',
            icon: UserIcon,
        },
        {
            title: 'Managers',
            href: '/users',
            icon: Users2,
        },
        {
            title: 'Wallets',
            href: '/wallets',
            icon: DollarSign,
        },
        {
            title: 'Expenses',
            href: '/expenses',
            icon: ReceiptIcon,
        },
        {
            title: 'Sales',
            href: '/sales',
            icon: Receipt,
        },
        {
            title: 'Commission Rates',
            href: '/commission-rates',
            icon: Percent,
        },
    ];

    // Reports section - using existing routes
    const reportsNavItems: NavItem[] = [
        {
            title: 'Sales Report',
            href: '/sales',
            icon: BarChart3,
        },
        {
            title: 'Product Report',
            href: '/products',
            icon: Box,
        },
        {
            title: 'Expense Report',
            href: '/expenses',
            icon: ReceiptIcon,
        },
        {
            title: 'Wallet Report',
            href: '/wallets',
            icon: DollarSign,
        },
        {
            title: 'User Report',
            href: '/users',
            icon: Users,
        },
    ];

    // Admin-only navigation items
    const adminNavItems: NavItem[] = [
        {
            title: 'Products',
            href: '/products',
            icon: Package,
        },
        {
            title: 'Create Product',
            href: '/products/create',
            icon: Plus,
        },
        {
            title: 'Users',
            href: '/users',
            icon: Users,
        },
        {
            title: 'Manager Wallets',
            href: '/wallets',
            icon: DollarSign,
        },
        {
            title: 'Expenses',
            href: '/expenses',
            icon: ReceiptIcon,
        },
        {
            title: 'View All Sales',
            href: '/sales',
            icon: Receipt,
        },
        {
            title: 'Commission Rates',
            href: '/commission-rates',
            icon: Percent,
        },
    ];

    // Manager-only navigation items
    const managerNavItems: NavItem[] = [
        {
            title: 'Product Catalog',
            href: '/dashboard',
            icon: Package,
        },
        {
            title: 'Shopping Cart',
            href: '/cart',
            icon: Package,
        },
        {
            title: 'Sales History',
            href: '/sales',
            icon: Receipt,
        },
        {
            title: 'My Expenses',
            href: '/expenses',
            icon: ReceiptIcon,
        },
    ];

   

    return (
        <Sidebar collapsible="icon" variant="inset" className="z-50">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />

                {/* Stores Section */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarMenu>
                        {storesNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* HRM Section */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>HRM</SidebarGroupLabel>
                    <SidebarMenu>
                        {hrmNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Reports Section */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel>Reports</SidebarGroupLabel>
                    <SidebarMenu>
                        {reportsNavItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Admin Navigation */}
                {isAdmin && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Admin</SidebarGroupLabel>
                        <SidebarMenu>
                            {adminNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}

                {/* Manager Navigation */}
                {isManager && (
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Sales</SidebarGroupLabel>
                        <SidebarMenu>
                            {managerNavItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild isActive={page.url.startsWith(item.href)} tooltip={{ children: item.title }}>
                                        <Link href={item.href} prefetch>
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroup>
                )}
            </SidebarContent>

            <SidebarFooter>
                
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
