import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
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
}

export default function UsersIndex({ users, filters }: UsersIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [roleFilter, setRoleFilter] = useState(filters.role || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/users', { search: value, role: roleFilter }, { 
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleRoleFilter = (value: string) => {
        setRoleFilter(value);
        router.get('/users', { search, role: value }, { 
            preserveState: true,
            preserveScroll: true,
        });
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
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Users</h1>
                        <p className="text-muted-foreground">Manage user accounts and roles</p>
                    </div>
                    <Link href="/users/create">
                        <Button>
                            <Icon name="user-plus" className="mr-2 h-4 w-4" />
                            Add User
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>User Management</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Input
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="max-w-sm"
                            />
                            <select
                                value={roleFilter}
                                onChange={(e) => handleRoleFilter(e.target.value)}
                                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
                            >
                                <option value="">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Name</th>
                                        <th className="text-left p-2">Email</th>
                                        <th className="text-left p-2">Role</th>
                                        <th className="text-left p-2">Created</th>
                                        <th className="text-left p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2 font-medium">{user.name}</td>
                                            <td className="p-2 text-sm text-muted-foreground">{user.email}</td>
                                            <td className="p-2">
                                                <Badge variant={getRoleBadgeVariant(user.role)}>
                                                    {user.role}
                                                </Badge>
                                            </td>
                                            <td className="p-2 text-sm text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center space-x-2">
                                                    <Link href={`/users/${user.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Icon name="edit" className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleDelete(user.id)}
                                                    >
                                                        <Icon name="trash" className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {users.data.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No users found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 