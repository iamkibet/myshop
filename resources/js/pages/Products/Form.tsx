import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/icon';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

interface Product {
    id?: number;
    name: string;
    sku: string;
    cost_price: number;
    msrp: number;
    quantity_on_hand: number;
}

interface ProductsFormProps {
    product?: Product;
}

export default function ProductsForm({ product }: ProductsFormProps) {
    const isEditing = !!product;
    const [formData, setFormData] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        cost_price: product?.cost_price || 0,
        msrp: product?.msrp || 0,
        quantity_on_hand: product?.quantity_on_hand || 0,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Products',
            href: '/products',
        },
        {
            title: isEditing ? 'Edit Product' : 'Create Product',
            href: '#',
        },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            if (isEditing) {
                await router.put(`/products/${product.id}`, formData);
            } else {
                await router.post('/products', formData);
            }
        } catch (error: any) {
            if (error.response?.data?.errors) {
                setErrors(error.response.data.errors);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Product' : 'Create Product'} />
            
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">
                            {isEditing ? 'Edit Product' : 'Create Product'}
                        </h1>
                        <p className="text-muted-foreground">
                            {isEditing ? 'Update product information' : 'Add a new product to inventory'}
                        </p>
                    </div>
                    <Link href="/products">
                        <Button variant="outline">
                            <Icon name="arrow-left" className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Enter product name"
                                        error={errors.name}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU</Label>
                                    <Input
                                        id="sku"
                                        value={formData.sku}
                                        onChange={(e) => handleInputChange('sku', e.target.value)}
                                        placeholder="Enter SKU"
                                        error={errors.sku}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cost_price">Cost Price</Label>
                                    <Input
                                        id="cost_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.cost_price}
                                        onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        error={errors.cost_price}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="msrp">MSRP</Label>
                                    <Input
                                        id="msrp"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.msrp}
                                        onChange={(e) => handleInputChange('msrp', parseFloat(e.target.value) || 0)}
                                        placeholder="0.00"
                                        error={errors.msrp}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="quantity_on_hand">Quantity on Hand</Label>
                                    <Input
                                        id="quantity_on_hand"
                                        type="number"
                                        min="0"
                                        value={formData.quantity_on_hand}
                                        onChange={(e) => handleInputChange('quantity_on_hand', parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                        error={errors.quantity_on_hand}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Link href="/products">
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Icon name="loader" className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="save" className="mr-2 h-4 w-4" />
                                            {isEditing ? 'Update Product' : 'Create Product'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 