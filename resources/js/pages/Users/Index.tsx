import { Icon } from '@/components/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, Eye, Trash, UserPlus, Search, Users, Shield, UserCheck, Calendar, Mail } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Users',
        href: '/users',
    },
];

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'manager';
    created_at: string;
    updated_at: string;
}

interface UsersIndexProps {
    users: {
        data: User[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        role?: string;
    };
    flash?: {
        success?: string;
        error?: string;
        message?: string;
    };
}

export default function UsersIndex({ users, filters }: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');
    const { flash } = usePage<{ flash?: { success?: string; error?: string; message?: string } }>().props;

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            '/users',
            { search: value, role: roleFilter },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleRoleFilter = (value: string) => {
        setRoleFilter(value);
        router.get(
            '/users',
            { search, role: value },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleDelete = (userId: number) => {
        if (confirm('Are you sure you want to delete this user?')) {
            router.delete(`/users/${userId}`);
        }
    };

    const getRoleBadgeVariant = (role: string) => {
        return role === 'admin' ? 'default' : 'secondary';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />

            <div className="flex h-full flex-1 flex-col gap-6 sm:gap-8 overflow-x-auto rounded-xl p-3 sm:p-6 pb-20 sm:pb-6">
                {/* Success Message */}
                {flash?.success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UserCheck className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Success!</h3>
                                <div className="mt-1 text-sm text-green-700 dark:text-green-300">{flash.success}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950 p-4">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Shield className="h-5 w-5 text-red-400" />
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error</h3>
                                <div className="mt-1 text-sm text-red-700 dark:text-red-300">{flash.error}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950 dark:via-purple-950 dark:to-pink-950 border border-indigo-200 dark:border-indigo-800">
                    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[length:20px_20px]"></div>
                    <div className="relative p-4 sm:p-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                                <div className="flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg mx-auto sm:mx-0">
                                    <Users className="h-6 w-6 sm:h-8 sm:w-8" />
                                </div>
                                <div className="text-center sm:text-left">
                                    <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">User Management</h1>
                                    <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">Manage user accounts, roles, and permissions</p>
                                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center justify-center sm:justify-start space-x-1">
                                            <Users className="h-4 w-4" />
                                            <span>{users.total} Total Users</span>
                                        </div>
                                        <div className="flex items-center justify-center sm:justify-start space-x-1">
                                            <Shield className="h-4 w-4" />
                                            <span>{users.data.filter(u => u.role === 'admin').length} Admins</span>
                                        </div>
                                        <div className="flex items-center justify-center sm:justify-start space-x-1">
                                            <UserCheck className="h-4 w-4" />
                                            <span>{users.data.filter(u => u.role === 'manager').length} Managers</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Link href="/users/create" className="w-full sm:w-auto">
                                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                                    <UserPlus className="mr-2 h-5 w-5" />
                                    Add New User
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">Search & Filter</CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">Find and filter users by name, email, or role</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:space-x-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Search by name or email..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-10 h-10 sm:h-12 text-sm sm:text-base"
                                />
                            </div>
                            <div className="w-full lg:w-48">
                                <Select value={roleFilter || "all"} onValueChange={(value) => handleRoleFilter(value === "all" ? "" : value)}>
                                    <SelectTrigger className="h-10 sm:h-12">
                                        <SelectValue placeholder="All Roles" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="manager">Manager</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Users List */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">User Accounts</CardTitle>
                        <CardDescription className="text-sm text-gray-600 dark:text-gray-400">
                            {users.data.length} user{users.data.length !== 1 ? 's' : ''} found
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.data.length === 0 ? (
                            <div className="py-8 sm:py-12 text-center">
                                <div className="mx-auto mb-3 sm:mb-4 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
                            </div>
                        ) : (
                            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {users.data.map((user) => (
                                    <div key={user.id} className="group relative overflow-hidden rounded-lg sm:rounded-xl border bg-white dark:bg-gray-900 p-4 sm:p-6 hover:shadow-lg transition-all duration-200 hover:border-indigo-300 dark:hover:border-indigo-600">
                                        <div className="flex items-start justify-between mb-3 sm:mb-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900">
                                                    <span className="text-base sm:text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{user.name}</h3>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Badge 
                                                            variant={getRoleBadgeVariant(user.role)}
                                                            className={`text-xs px-2 py-1 ${user.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}`}
                                                        >
                                                            {user.role === 'admin' ? 'Admin' : 'Manager'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                                                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-800">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/users/${user.id}`} className="flex-1 sm:flex-none">
                                                    <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 sm:h-8 px-3 text-xs sm:text-sm">
                                                        <Eye className="h-3 w-3 sm:h-3 sm:w-3 mr-1" />
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link href={`/users/${user.id}/edit`} className="flex-1 sm:flex-none">
                                                    <Button variant="outline" size="sm" className="w-full sm:w-auto h-9 sm:h-8 px-3 text-xs sm:text-sm">
                                                        <Edit className="h-3 w-3 sm:h-3 sm:w-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </div>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleDelete(user.id)}
                                                className="w-full sm:w-auto h-9 sm:h-8 px-3 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                            >
                                                <Trash className="h-3 w-3 sm:h-3 sm:w-3 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
