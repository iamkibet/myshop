import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandSelect } from '@/components/ui/brand-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CategorySelect } from '@/components/ui/category-select';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SizeSelect } from '@/components/ui/size-select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Package, Plus, Save, Trash2, X } from 'lucide-react';
import { useState } from 'react';

interface ProductVariant {
    id?: number;
    color?: string;
    size?: string;
    sku: string;
    quantity: number;
    cost_price: number;
    selling_price: number;
    discount_price?: number;
    image_url?: string;
    is_active: boolean;
    low_stock_threshold: number;
}

interface Product {
    id?: number;
    name: string;
    description?: string;
    brand: string;
    category: string;
    image_url?: string;
    features?: string[];
    meta_title?: string;
    meta_description?: string;
    is_active: boolean;
    variants?: ProductVariant[];
}

interface ProductsFormProps {
    product?: Product;
    isEditing?: boolean;
    existingCategories?: string[];
    existingBrands?: string[];
    existingSizes?: string[];
}

const COMMON_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink', 'Orange', 'Brown', 'Gray'];

export default function ProductsForm({
    product,
    isEditing = false,
    existingCategories = [],
    existingBrands = [],
    existingSizes = [],
}: ProductsFormProps) {
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        brand: product?.brand || '',
        category: product?.category || '',
        image_url: product?.image_url || '',
        features: product?.features || [],
        meta_title: product?.meta_title || '',
        meta_description: product?.meta_description || '',
        is_active: product?.is_active ?? true,
    });

    const [variants, setVariants] = useState<ProductVariant[]>(
        product?.variants?.map((v) => ({
            ...v,
            color: v.color || 'none',
            size: v.size || 'none',
            cost_price: Number(v.cost_price),
            selling_price: Number(v.selling_price),
            discount_price: v.discount_price ? Number(v.discount_price) : undefined,
        })) || [],
    );

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newFeature, setNewFeature] = useState('');

    const handleInputChange = (field: string, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const addFeature = () => {
        if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
            setFormData((prev) => ({
                ...prev,
                features: [...prev.features, newFeature.trim()],
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index),
        }));
    };

    const addVariant = () => {
        console.log('Adding variant');
        const newVariant: ProductVariant = {
            color: 'none',
            size: 'none',
            sku: `SKU-${Date.now()}`,
            quantity: 0,
            cost_price: 0,
            selling_price: 0,
            is_active: true,
            low_stock_threshold: 5,
        };
        setVariants((prev) => {
            console.log('Previous variants:', prev);
            const newVariants = [...prev, newVariant];
            console.log('New variants:', newVariants);
            return newVariants;
        });
    };

    const updateVariant = (index: number, field: keyof ProductVariant, value: string | number | boolean | undefined) => {
        setVariants((prev) => prev.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant)));
    };

    const removeVariant = (index: number) => {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    };

    const generateSku = (color: string, size: string) => {
        const base = formData.name.replace(/\s+/g, '').toUpperCase();
        const colorPart = color && color !== 'none' && color !== null ? `-${color.toUpperCase()}` : '';
        const sizePart = size && size !== 'none' && size !== null ? `-${size.toUpperCase()}` : '';
        return `${base}${colorPart}${sizePart}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        try {
            const payload = {
                ...formData,
                variants: variants.map((variant) => ({
                    ...variant,
                    color: variant.color === 'none' ? null : variant.color,
                    size: variant.size === 'none' ? null : variant.size,
                    sku: variant.sku || generateSku(variant.color || '', variant.size || ''),
                })),
            };

            if (isEditing && product?.id) {
                await router.put(`/products/${product.id}`, payload, {
                    onSuccess: () => {
                        // Success will be handled by redirect
                    },
                    onError: (errors) => {
                        // Convert Inertia error format to our format
                        const formattedErrors: Record<string, string> = {};
                        Object.entries(errors).forEach(([key, value]) => {
                            if (Array.isArray(value)) {
                                formattedErrors[key] = value[0];
                            } else {
                                formattedErrors[key] = value as string;
                            }
                        });

                        setErrors(formattedErrors);
                    },
                });
            } else {
                console.log('Submitting to /products with payload:', payload);
                await router.post('/products', payload);
            }

            // Success feedback will be handled by the redirect
        } catch (error: unknown) {
            console.error('Form submission error:', error);
            if (error && typeof error === 'object' && 'response' in error) {
                const errorResponse = error as { response?: { data?: { errors?: Record<string, string[]> | string; message?: string } } };
                if (errorResponse.response?.data?.errors) {
                    // Convert array errors to single string errors
                    const flatErrors: Record<string, string> = {};
                    if (typeof errorResponse.response.data.errors === 'string') {
                        setErrors({ general: errorResponse.response.data.errors });
                    } else {
                        Object.entries(errorResponse.response.data.errors).forEach(([key, value]) => {
                            flatErrors[key] = Array.isArray(value) ? value[0] : value;
                        });
                        setErrors(flatErrors);
                    }
                } else if (errorResponse.response?.data?.message) {
                    setErrors({ general: errorResponse.response.data.message });
                }
            } else {
                setErrors({ general: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageUpload = async (file: File, type: 'product' | 'variant', variantIndex?: number) => {
        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/upload-image', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();

            if (result.success) {
                if (type === 'product') {
                    handleInputChange('image_url', result.url);
                } else if (type === 'variant' && variantIndex !== undefined) {
                    updateVariant(variantIndex, 'image_url', result.url);
                }
            } else {
                console.error('Upload failed:', result.message);
                // Show error to user
                setErrors((prev) => ({ ...prev, image_upload: result.message }));
            }
        } catch (error) {
            console.error('Upload error:', error);
            setErrors((prev) => ({ ...prev, image_upload: 'Failed to upload image. Please try again.' }));
        }
    };

    const handleVariantImageUpload = (file: File, variantIndex: number) => {
        handleImageUpload(file, 'variant', variantIndex);
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Products', href: '/products' },
                { title: isEditing ? 'Edit Product' : 'Create Product', href: '#' },
            ]}
        >
            <Head title={isEditing ? 'Edit Product' : 'Create Product'} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                        <Link href="/products">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto sm:px-4 sm:py-2">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Back to Products</span>
                                <span className="sm:hidden">Back</span>
                            </Button>
                        </Link>
                        <div className="min-w-0 flex-1 sm:border-l sm:border-border sm:pl-6">
                            <h1 className="text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl">
                                {isEditing ? 'Edit Product' : 'Create Product'}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground sm:text-base sm:leading-relaxed">
                                {isEditing ? 'Update product information and variants' : 'Add a new product with variants'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* General Error Display */}
                    {errors.general && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errors.general}</AlertDescription>
                        </Alert>
                    )}

                    {/* Basic Product Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Enter product name"
                                        className="mt-1"
                                    />
                                    {errors.name && <InputError message={errors.name} />}
                                </div>

                                <div>
                                    <BrandSelect
                                        value={formData.brand}
                                        onChange={(value) => handleInputChange('brand', value)}
                                        existingBrands={existingBrands}
                                        label="Brand"
                                        placeholder="Select or add brand"
                                        error={errors.brand}
                                    />
                                </div>

                                <div>
                                    <CategorySelect
                                        value={formData.category}
                                        onChange={(value) => handleInputChange('category', value)}
                                        existingCategories={existingCategories}
                                        label="Category"
                                        placeholder="Select or add category"
                                        error={errors.category}
                                    />
                                </div>

                                <div>
                                    <ImageUpload
                                        value={formData.image_url}
                                        onChange={(value) => handleInputChange('image_url', value)}
                                        onFileChange={(file) => handleImageUpload(file, 'product')}
                                        label="Product Image"
                                        placeholder="Enter image URL or upload file"
                                        error={errors.image_url}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Enter product description"
                                    className="mt-1"
                                    rows={3}
                                />
                                {errors.description && <InputError message={errors.description} />}
                            </div>

                            {/* Features */}
                            <div>
                                <Label>Features</Label>
                                <div className="mt-1 flex space-x-2">
                                    <Input
                                        value={newFeature}
                                        onChange={(e) => setNewFeature(e.target.value)}
                                        placeholder="Add a feature"
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                    />
                                    <Button type="button" onClick={addFeature} disabled={!newFeature.trim()}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {formData.features.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {formData.features.map((feature, index) => (
                                            <div key={index} className="flex items-center space-x-1 rounded-md bg-muted px-2 py-1">
                                                <span className="text-sm">{feature}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFeature(index)}
                                                    className="h-4 w-4 p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Product Variants */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Product Variants</CardTitle>
                                <Button type="button" onClick={addVariant} variant="outline" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Variant
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {variants.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground">No variants added yet.</p>
                                    <p className="text-sm text-muted-foreground">Add at least one variant to continue.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {variants.map((variant, index) => (
                                        <div key={index} className="rounded-lg border p-4">
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="font-medium">Variant {index + 1}</h3>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeVariant(index)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                                                <div>
                                                    <Label>Color</Label>
                                                    <Select
                                                        value={variant.color || ''}
                                                        onValueChange={(value) => updateVariant(index, 'color', value)}
                                                    >
                                                        <SelectTrigger className="mt-1">
                                                            <SelectValue placeholder="Select color" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">No Color</SelectItem>
                                                            {COMMON_COLORS.map((color) => (
                                                                <SelectItem key={color} value={color}>
                                                                    {color}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <SizeSelect
                                                        value={variant.size || ''}
                                                        onChange={(value) => updateVariant(index, 'size', value)}
                                                        existingSizes={existingSizes}
                                                        label="Size"
                                                        placeholder="Select or add size"
                                                    />
                                                </div>

                                                <div>
                                                    <Label>SKU</Label>
                                                    <Input
                                                        value={variant.sku}
                                                        onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                                        placeholder="Auto-generated"
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Quantity</Label>
                                                    <Input
                                                        type="number"
                                                        value={variant.quantity}
                                                        onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                                                        min="0"
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Cost Price</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={variant.cost_price}
                                                        onChange={(e) => updateVariant(index, 'cost_price', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Selling Price</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={variant.selling_price}
                                                        onChange={(e) => updateVariant(index, 'selling_price', parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Discount Price (Optional)</Label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={variant.discount_price || ''}
                                                        onChange={(e) =>
                                                            updateVariant(
                                                                index,
                                                                'discount_price',
                                                                e.target.value ? parseFloat(e.target.value) : undefined,
                                                            )
                                                        }
                                                        min="0"
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div>
                                                    <Label>Low Stock Threshold</Label>
                                                    <Input
                                                        type="number"
                                                        value={variant.low_stock_threshold}
                                                        onChange={(e) => updateVariant(index, 'low_stock_threshold', parseInt(e.target.value) || 0)}
                                                        min="0"
                                                        className="mt-1"
                                                    />
                                                </div>

                                                <div className="md:col-span-2 lg:col-span-1">
                                                    <ImageUpload
                                                        value={variant.image_url || ''}
                                                        onChange={(value) => updateVariant(index, 'image_url', value)}
                                                        onFileChange={(file) => handleVariantImageUpload(file, index)}
                                                        label="Variant Image (Optional)"
                                                        placeholder="Enter image URL or upload file"
                                                    />
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={variant.is_active}
                                                        onCheckedChange={(checked) => updateVariant(index, 'is_active', checked)}
                                                    />
                                                    <Label>Active</Label>
                                                </div>
                                            </div>

                                            {/* Variant Summary */}
                                            <div className="mt-4 rounded-md bg-muted p-3">
                                                <div className="text-sm">
                                                    <span className="font-medium">Summary:</span>{' '}
                                                    {variant.color && variant.color !== 'none' ? variant.color : 'No color'} -{' '}
                                                    {variant.size && variant.size !== 'none' ? variant.size : 'No size'} | Qty: {variant.quantity} |
                                                    Cost: {formatCurrency(variant.cost_price)} | Price: {formatCurrency(variant.selling_price)}
                                                    {variant.discount_price && ` | Discount: ${formatCurrency(variant.discount_price)}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-2">
                        <Link href="/products">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting || variants.length === 0}>
                            {isSubmitting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {isEditing ? 'Update Product' : 'Create Product'}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
