 import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrandSelect } from '@/components/ui/brand-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CategorySelect } from '@/components/ui/category-select';
import { ImageUpload } from '@/components/ui/image-upload';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Check, Loader2, Package, Plus, Save, Trash2, X, DollarSign, Package2, TrendingUp, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface Product {
    id?: number;
    name: string;
    category: string;
    description?: string;
    brand?: string;
    image_url?: string;
    features?: string[];
    sku?: string;
    quantity: number;
    cost_price: number;
    selling_price: number;
    discount_price?: number;
    low_stock_threshold: number;
    is_active: boolean;
    imageFile?: File; // Add this for file uploads
}

interface ProductFormProps {
    product?: Product;
    isEditing?: boolean;
    existingCategories?: string[];
    existingBrands?: string[];
}

export default function ProductForm({
    product,
    isEditing = false,
    existingCategories = [],
    existingBrands = [],
}: ProductFormProps) {
    // Utility function to ensure features is always an array
    const ensureFeaturesArray = (features: any): string[] => {
        if (Array.isArray(features)) {
            return features;
        }
        return [];
    };

    const [formData, setFormData] = useState<Product>({
        name: product?.name || '',
        category: product?.category || '',
        description: product?.description || '',
        brand: product?.brand || '',
        image_url: product?.image_url || '',
        features: ensureFeaturesArray(product?.features),
        sku: product?.sku || '',
        quantity: product?.quantity || 0,
        cost_price: product?.cost_price || 0,
        selling_price: product?.selling_price || 0,
        discount_price: product?.discount_price,
        low_stock_threshold: product?.low_stock_threshold || 5,
        is_active: product?.is_active ?? true,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newFeature, setNewFeature] = useState('');



    // Ensure form data is properly set when editing
    useEffect(() => {
        if (isEditing && product) {
            const newFormData = {
                name: product.name || '',
                category: product.category || '',
                description: product.description || '',
                brand: product.brand || '',
                image_url: product.image_url || '',
                features: ensureFeaturesArray(product.features),
                sku: product.sku || '',
                quantity: product.quantity || 0,
                cost_price: product.cost_price || 0,
                selling_price: product.selling_price || 0,
                discount_price: product.discount_price,
                low_stock_threshold: product.low_stock_threshold || 5,
                is_active: product.is_active ?? true,
            };
            setFormData(newFormData);
        }
    }, [isEditing, product]);

    const handleInputChange = (field: keyof Product, value: any) => {
        // Handle undefined values for optional fields
        if (value === undefined && ['image_url', 'description', 'brand', 'sku'].includes(field)) {
            value = '';
        }
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const addFeature = () => {
        if (newFeature.trim() && formData.features && Array.isArray(formData.features) && !ensureFeaturesArray(formData.features).includes(newFeature.trim())) {
            setFormData(prev => ({
                ...prev,
                features: [...ensureFeaturesArray(prev.features), newFeature.trim()],
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        if (formData.features && Array.isArray(formData.features)) {
            setFormData(prev => ({
                ...prev,
                features: ensureFeaturesArray(prev.features).filter((_, i) => i !== index),
            }));
        }
    };

    const calculateProfit = () => {
        if (formData.cost_price && formData.selling_price) {
            const profit = formData.selling_price - formData.cost_price;
            const margin = (profit / formData.cost_price) * 100;
            return { profit, margin };
        }
        return { profit: 0, margin: 0 };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted!');
        console.log('Form data:', formData);
        console.log('Is editing:', isEditing);
        console.log('Product:', product);
        
        setIsSubmitting(true);
        setErrors({});

        try {
            if (isEditing && product) {
                // For editing, use PUT method with regular object (like CommissionRates)
                console.log('Submitting product update for:', product.id);
                console.log('Product ID:', product.id);
                
                // Only send changed fields to avoid overwriting existing data
                const dataToSend: any = {};
                
                // Check each field and only include if it changed
                if (formData.name !== product.name) dataToSend.name = formData.name;
                if (formData.category !== product.category) dataToSend.category = formData.category;
                if (formData.description !== product.description) dataToSend.description = formData.description || '';
                if (formData.brand !== product.brand) dataToSend.brand = formData.brand || '';
                if (formData.sku !== product.sku) dataToSend.sku = formData.sku || '';
                if (formData.quantity !== product.quantity) dataToSend.quantity = formData.quantity;
                if (formData.cost_price !== product.cost_price) dataToSend.cost_price = formData.cost_price;
                if (formData.selling_price !== product.selling_price) dataToSend.selling_price = formData.selling_price;
                if (formData.discount_price !== product.discount_price) dataToSend.discount_price = formData.discount_price || '';
                if (formData.low_stock_threshold !== product.low_stock_threshold) dataToSend.low_stock_threshold = formData.low_stock_threshold;
                if (formData.is_active !== product.is_active) dataToSend.is_active = formData.is_active ? '1' : '0';
                
                // Handle features - only send if changed
                const currentFeatures = JSON.stringify(formData.features || []);
                const originalFeatures = JSON.stringify(product.features || []);
                if (currentFeatures !== originalFeatures) {
                    dataToSend.features = currentFeatures;
                }
                
                // Handle image - only send if changed
                if (formData.imageFile) {
                    // If there's a new file, we need to handle this differently
                    setErrors({ general: 'Image upload not supported in edit mode yet. Please update other fields first.' });
                    setIsSubmitting(false);
                    return;
                } else if (formData.image_url && formData.image_url !== product.image_url && !formData.image_url.startsWith('blob:')) {
                    dataToSend.image_url = formData.image_url;
                }
                
                // Only proceed if there are actual changes
                if (Object.keys(dataToSend).length === 0) {
                    setErrors({ general: 'No changes detected. Please modify at least one field before updating.' });
                    setIsSubmitting(false);
                    return;
                }
                
                console.log('Data to send (only changed fields):', dataToSend);
                console.log('URL:', `/products/${product.id}`);
                
                // Update the product
                await router.put(`/products/${product.id}`, dataToSend);
            } else {
                // For creating new products
                const dataToSend: any = {};
                
                Object.keys(formData).forEach(key => {
                    if (key === 'features') {
                        dataToSend[key] = JSON.stringify(formData.features || []);
                    } else if (key === 'imageFile' && formData.imageFile) {
                        // Skip for now, handle separately
                    } else if (key !== 'imageFile') {
                        const value = formData[key as keyof Product];
                        if (value !== undefined && value !== null) {
                            if (typeof value === 'boolean') {
                                dataToSend[key] = value ? '1' : '0';
                            } else {
                                dataToSend[key] = value;
                            }
                        }
                    }
                });

                // Handle image_url separately
                if (!formData.imageFile && formData.image_url && !formData.image_url.startsWith('blob:')) {
                    dataToSend.image_url = formData.image_url;
                }

                if (formData.imageFile) {
                    // If there's a file, we need to handle this differently
                    setErrors({ general: 'Image upload not supported in create mode yet. Please add image URL instead.' });
                    setIsSubmitting(false);
                    return;
                } else {
                    console.log('Submitting new product:', dataToSend);
                    await router.post('/products', dataToSend);
                }
            }
        } catch (error: any) {
            console.error('Form submission error:', error);
            
            if (error.response?.data?.errors) {
                // Format Laravel validation errors
                const formattedErrors: Record<string, string> = {};
                Object.entries(error.response.data.errors).forEach(([key, value]) => {
                    formattedErrors[key] = Array.isArray(value) ? value[0] : String(value);
                });
                setErrors(formattedErrors);
            } else if (error.response?.data?.message) {
                setErrors({ general: error.response.data.message });
            } else if (error.message) {
                setErrors({ general: error.message });
            } else {
                setErrors({ general: 'An error occurred while saving the product. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const { profit, margin } = calculateProfit();

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Products', href: '/products' },
                { title: isEditing ? 'Edit Product' : 'Create Product', href: '#' },
            ]}
        >
            <Head title={isEditing ? 'Edit Product' : 'Create Product'} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-3 pb-20 sm:gap-6 sm:p-4 sm:pb-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:gap-6">
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
                                {isEditing ? 'Update product information' : 'Add a new product to your inventory'}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
                    {/* General Error Display */}
                    {errors.general && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{errors.general}</AlertDescription>
                        </Alert>
                    )}

                    {/* Basic Product Information */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Package className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                            <CardDescription>
                                Essential product details like name, category, and description
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Product Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">Product Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter product name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={`h-11 text-base ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                />
                                {errors.name && <InputError message={errors.name} />}
                            </div>

                            {/* Category and Brand Row */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Category */}
                                <div className="space-y-2">
                                    <CategorySelect
                                        value={formData.category}
                                        onChange={(value) => handleInputChange('category', value)}
                                        existingCategories={existingCategories}
                                        error={errors.category}
                                    />
                                </div>

                                {/* Brand */}
                                <div className="space-y-2">
                                    <BrandSelect
                                        value={formData.brand || ''}
                                        onChange={(value) => handleInputChange('brand', value)}
                                        existingBrands={existingBrands}
                                        error={errors.brand}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe your product..."
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={3}
                                    className={`resize-none text-base min-h-[80px] ${errors.description ? 'border-red-500 focus:ring-red-500' : ''}`}
                                />
                                {errors.description && <InputError message={errors.description} />}
                            </div>

                            {/* Features */}
                            <Card className="border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Features</CardTitle>
                                    <CardDescription>
                                        Add key features or specifications for your product
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="newFeature" className="text-sm font-medium">Add Feature</Label>
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <Input
                                                id="newFeature"
                                                placeholder="Enter a feature..."
                                                value={newFeature}
                                                onChange={(e) => setNewFeature(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                                className="h-10"
                                            />
                                            <Button type="button" onClick={addFeature} disabled={!newFeature.trim()} size="sm" className="w-full sm:w-auto">
                                                <Plus className="h-4 w-4" />
                                                <span className="sm:hidden">Add Feature</span>
                                            </Button>
                                        </div>
                                    </div>

                                    {formData.features && Array.isArray(formData.features) && formData.features.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Current Features</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {ensureFeaturesArray(formData.features).map((feature, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm border border-primary/20"
                                                    >
                                                        <span className="text-primary-foreground">{feature}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-5 w-5 p-0 hover:bg-primary/20 rounded-full"
                                                            onClick={() => removeFeature(index)}
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Product Image */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="image" className="text-sm font-medium">Product Image</Label>
                                    <span className="text-xs text-muted-foreground">(Optional)</span>
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Image Preview */}
                                    {(formData.imageFile || formData.image_url) && (
                                        <div className="relative inline-block group">
                                            <div className="relative">
                                                <img
                                                    src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : formData.image_url}
                                                    alt="Product preview"
                                                    className="h-40 w-40 rounded-lg border-2 border-border object-cover shadow-md transition-all duration-200 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg"></div>
                                            </div>
                                            
                                            {/* Remove Button */}
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="sm"
                                                className="absolute -top-3 -right-3 h-7 w-7 rounded-full p-0 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                                onClick={() => {
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        image_url: '',
                                                        imageFile: undefined 
                                                    }));
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                            
                                            {/* Image Info */}
                                            <div className="mt-2 text-center">
                                                <p className="text-xs text-muted-foreground">
                                                    {formData.imageFile ? (
                                                        <>
                                                            <span className="font-medium">{formData.imageFile.name}</span>
                                                            <span className="mx-1">•</span>
                                                            <span>{(formData.imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                                        </>
                                                    ) : (
                                                        'External image URL'
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Upload Options */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {/* File Upload */}
                                        <div className="space-y-3">
                                            <Label htmlFor="image" className="text-sm font-medium flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                Upload File
                                            </Label>
                                            
                                            {/* Drag & Drop Zone */}
                                            <div 
                                                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 ${
                                                    formData.imageFile ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
                                                }`}
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.add('border-primary', 'bg-primary/10');
                                                }}
                                                onDragLeave={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                                                    const files = e.dataTransfer.files;
                                                    if (files.length > 0 && files[0].type.startsWith('image/')) {
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            imageFile: files[0],
                                                            image_url: ''
                                                        }));
                                                    }
                                                }}
                                            >
                                                <div className="space-y-3">
                                                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Package className="h-6 w-6 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-foreground">
                                                            {formData.imageFile ? 'File Selected' : 'Drop image here'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            or click to browse
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <Input
                                                    id="image"
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setFormData(prev => ({ 
                                                                ...prev, 
                                                                imageFile: file,
                                                                image_url: ''
                                                            }));
                                                        }
                                                    }}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                            </div>
                                            
                                            {errors.image && <InputError message={errors.image} />}
                                        </div>

                                        {/* URL Input */}
                                        <div className="space-y-3">
                                            <Label htmlFor="image_url" className="text-sm font-medium flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                                Image URL
                                            </Label>
                                            
                                            <div className="space-y-2">
                                                <Input
                                                    id="image_url"
                                                    type="url"
                                                    placeholder="https://example.com/image.jpg"
                                                    value={formData.image_url || ''}
                                                    onChange={(e) => {
                                                        setFormData(prev => ({ 
                                                            ...prev, 
                                                            imageFile: undefined,
                                                            image_url: e.target.value 
                                                        }));
                                                    }}
                                                    className={`h-10 text-base ${errors.image_url ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => {
                                                        if (formData.image_url) {
                                                            // Test the URL by creating a temporary image
                                                            const img = new Image();
                                                            img.onload = () => {
                                                                // URL is valid and image loads
                                                                setFormData(prev => ({ 
                                                                    ...prev, 
                                                                    imageFile: undefined,
                                                                    image_url: formData.image_url 
                                                                }));
                                                            };
                                                            img.onerror = () => {
                                                                setErrors(prev => ({ ...prev, image_url: 'Invalid image URL or image cannot be loaded' }));
                                                            };
                                                            img.src = formData.image_url;
                                                        }
                                                    }}
                                                    disabled={!formData.image_url}
                                                >
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Test URL
                                                </Button>
                                            </div>
                                            
                                            {errors.image_url && <InputError message={errors.image_url} />}
                                        </div>
                                    </div>

                                    {/* Help Text */}
                                    <div className="rounded-lg bg-muted/50 p-3">
                                        <div className="flex items-start gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                                            <div className="text-xs text-muted-foreground space-y-1">
                                                <p><strong>Supported formats:</strong> JPEG, PNG, GIF, WebP</p>
                                                <p><strong>Recommended:</strong> Square images (1:1 ratio) work best</p>
                                                <p><strong>Note:</strong> File upload takes priority over URL input</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SKU */}
                            <div className="space-y-2">
                                <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                                <Input
                                    id="sku"
                                    placeholder="Auto-generated if empty"
                                    value={formData.sku || ''}
                                    onChange={(e) => handleInputChange('sku', e.target.value)}
                                    className={`h-10 text-base ${errors.sku ? 'border-red-500 focus:ring-red-500' : ''}`}
                                />
                                {errors.sku && <InputError message={errors.sku} />}
                                <p className="text-xs text-muted-foreground">
                                    Leave empty to auto-generate a unique SKU
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & Inventory */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <DollarSign className="h-5 w-5" />
                                Pricing & Inventory
                            </CardTitle>
                            <CardDescription>
                                Set your product pricing and stock levels
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Pricing Section */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Pricing</h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {/* Cost Price */}
                                    <div className="space-y-2">
                                        <Label htmlFor="cost_price" className="text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            Cost Price *
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                            <Input
                                                id="cost_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={formData.cost_price === 0 ? '' : formData.cost_price}
                                                onChange={(e) => handleInputChange('cost_price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                                                onBlur={(e) => e.target.value === '' && (e.target.value = '0')}
                                                className={`h-11 pl-8 text-base ${errors.cost_price ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                inputMode="decimal"
                                            />
                                        </div>
                                        {errors.cost_price && <InputError message={errors.cost_price} />}
                                    </div>

                                    {/* Selling Price */}
                                    <div className="space-y-2">
                                        <Label htmlFor="selling_price" className="text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Selling Price *
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                            <Input
                                                id="selling_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="0.00"
                                                value={formData.selling_price === 0 ? '' : formData.selling_price}
                                                onChange={(e) => handleInputChange('selling_price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                                                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                                                onBlur={(e) => e.target.value === '' && (e.target.value = '0')}
                                                className={`h-11 pl-8 text-base ${errors.selling_price ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                inputMode="decimal"
                                            />
                                        </div>
                                        {errors.selling_price && <InputError message={errors.selling_price} />}
                                    </div>

                                    {/* Discount Price */}
                                    <div className="space-y-2">
                                        <Label htmlFor="discount_price" className="text-sm font-medium flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            Discount Price
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">$</span>
                                            <Input
                                                id="discount_price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                placeholder="Optional"
                                                value={formData.discount_price === 0 ? '' : formData.discount_price || ''}
                                                onChange={(e) => handleInputChange('discount_price', e.target.value === '' ? undefined : parseFloat(e.target.value) || 0)}
                                                onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                                                onBlur={(e) => e.target.value === '' && (e.target.value = '0')}
                                                className={`h-11 pl-8 text-base ${errors.discount_price ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                inputMode="decimal"
                                            />
                                        </div>
                                        {errors.discount_price && <InputError message={errors.discount_price} />}
                                    </div>
                                </div>
                            </div>

                            {/* Inventory Section */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Inventory</h4>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {/* Quantity */}
                                    <div className="space-y-2">
                                        <Label htmlFor="quantity" className="text-sm font-medium flex items-center gap-2">
                                            <Package2 className="h-4 w-4" />
                                            Quantity *
                                        </Label>
                                        <Input
                                            id="quantity"
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={formData.quantity === 0 ? '' : formData.quantity}
                                            onChange={(e) => handleInputChange('quantity', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                            onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                                            onBlur={(e) => e.target.value === '' && (e.target.value = '0')}
                                            className={`h-11 text-base ${errors.quantity ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            inputMode="numeric"
                                        />
                                        {errors.quantity && <InputError message={errors.quantity} />}
                                    </div>

                                    {/* Low Stock Threshold */}
                                    <div className="space-y-2">
                                        <Label htmlFor="low_stock_threshold" className="text-sm font-medium flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            Low Stock Threshold *
                                        </Label>
                                        <Input
                                            id="low_stock_threshold"
                                            type="number"
                                            min="0"
                                            placeholder="5"
                                            value={formData.low_stock_threshold === 0 ? '' : formData.low_stock_threshold}
                                            onChange={(e) => handleInputChange('low_stock_threshold', e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
                                            onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                                            onBlur={(e) => e.target.value === '' && (e.target.value = '0')}
                                            className={`h-11 text-base ${errors.low_stock_threshold ? 'border-red-500 focus:ring-red-500' : ''}`}
                                            inputMode="numeric"
                                        />
                                        {errors.low_stock_threshold && <InputError message={errors.low_stock_threshold} />}
                                    </div>

                                    {/* Active Status */}
                                    <div className="space-y-2">
                                        <Label htmlFor="is_active" className="text-sm font-medium">Status</Label>
                                        <div className="flex items-center space-x-3 pt-2">
                                            <Switch
                                                id="is_active"
                                                checked={formData.is_active}
                                                onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                                            />
                                            <Label htmlFor="is_active" className="text-sm">
                                                {formData.is_active ? 'Active' : 'Inactive'}
                                            </Label>
                                        </div>
                                        {errors.is_active && <InputError message={errors.is_active} />}
                                    </div>
                                </div>
                            </div>

                            {/* Profit Calculator */}
                            <div className="rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-4">
                                <h4 className="font-medium mb-3 flex items-center gap-2 text-green-800">
                                    <TrendingUp className="h-4 w-4" />
                                    Profit Analysis
                                </h4>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                        <span className="text-sm text-muted-foreground">Profit Amount:</span>
                                        <div className="text-lg font-semibold text-green-600">
                                            {formatCurrency(profit)}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-green-200">
                                        <span className="text-sm text-muted-foreground">Profit Margin:</span>
                                        <div className="text-lg font-semibold text-green-600">
                                            {margin.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-green-700 mt-3 text-center">
                                    💡 Update prices to see profit calculations in real-time
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:gap-4 pt-4 border-t">
                        <Link href="/products" className="w-full sm:w-auto">
                            <Button variant="outline" type="button" className="w-full sm:w-auto">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {isEditing ? 'Updating...' : 'Creating...'}
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