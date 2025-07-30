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
        title: 'Products',
        href: '/products',
    },
];

interface Product {
    id: number;
    name: string;
    sku: string;
    cost_price: number;
    msrp: number;
    quantity_on_hand: number;
    created_at: string;
    updated_at: string;
}

interface ProductsIndexProps {
    products: {
        data: Product[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
    };
}

export default function ProductsIndex({ products, filters }: ProductsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get('/products', { search: value }, { 
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleDelete = (productId: number) => {
        if (confirm('Are you sure you want to delete this product?')) {
            router.delete(`/products/${productId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Products</h1>
                        <p className="text-muted-foreground">Manage your product inventory</p>
                    </div>
                    <Link href="/products/create">
                        <Button>
                            <Icon name="plus" className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Inventory</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Input
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Name</th>
                                        <th className="text-left p-2">SKU</th>
                                        <th className="text-left p-2">Cost Price</th>
                                        <th className="text-left p-2">MSRP</th>
                                        <th className="text-left p-2">Stock</th>
                                        <th className="text-left p-2">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.data.map((product) => (
                                        <tr key={product.id} className="border-b hover:bg-muted/50">
                                            <td className="p-2 font-medium">{product.name}</td>
                                            <td className="p-2 text-sm text-muted-foreground">{product.sku}</td>
                                            <td className="p-2">${product.cost_price.toFixed(2)}</td>
                                            <td className="p-2">${product.msrp.toFixed(2)}</td>
                                            <td className="p-2">
                                                <Badge variant={product.quantity_on_hand > 0 ? 'default' : 'destructive'}>
                                                    {product.quantity_on_hand}
                                                </Badge>
                                            </td>
                                            <td className="p-2">
                                                <div className="flex items-center space-x-2">
                                                    <Link href={`/products/${product.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Icon name="edit" className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleDelete(product.id)}
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

                        {products.data.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No products found.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 