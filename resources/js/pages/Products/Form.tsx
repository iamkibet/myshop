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
import { AlertCircle, ArrowLeft, Check, Loader2, Package, Plus, Save, Trash2, X } from 'lucide-react';
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
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [showNewBrand, setShowNewBrand] = useState(false);

    // Debug: Log form initialization
    console.log('Form initialization:', {
        isEditing,
        product,
        initialFormData: {
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
        }
    });

    // Ensure form data is properly set when editing
    useEffect(() => {
        if (isEditing && product) {
            console.log('Setting form data for editing:', product);
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
            console.log('Form data set successfully:', newFormData);
        }
    }, [isEditing, product]);

    // CRITICAL FIX: Force form data initialization if it's empty
    useEffect(() => {
        if (isEditing && product && (!formData.name || !formData.category)) {
            console.log('Form data is empty, re-initializing...');
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
            console.log('Form data re-initialized:', newFormData);
        }
    }, [isEditing, product, formData.name, formData.category]);

    // Debug: Log whenever formData changes
    useEffect(() => {
        console.log('Form data changed:', formData);
    }, [formData]);

    // Debug: Log whenever product prop changes
    useEffect(() => {
        console.log('Product prop changed:', product);
    }, [product]);

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
        setIsSubmitting(true);
        setErrors({});

        // CRITICAL FIX: Check if form data is properly initialized
        if (isEditing && (!formData.name || !formData.category)) {
            console.error('Form data not properly initialized:', formData);
            setErrors({ general: 'Form data not properly loaded. Please refresh the page and try again.' });
            setIsSubmitting(false);
            return;
        }

        // Remove the isFormReady check since we've simplified it
        // if (isEditing && !isFormReady) {
        //     console.error('Form not ready for submission');
        //     setErrors({ general: 'Form is still loading. Please wait and try again.' });
        //     setIsSubmitting(false);
        //     return;
        // }

        // AGGRESSIVE VALIDATION: Check if all required fields are present
        if (isEditing) {
            const requiredFields = ['name', 'category', 'quantity', 'cost_price', 'selling_price', 'low_stock_threshold'];
            const missingFields = requiredFields.filter(field => {
                const value = formData[field as keyof Product];
                return value === undefined || value === null || value === '';
            });
            
            if (missingFields.length > 0) {
                console.error('Missing required fields:', missingFields);
                console.error('Current form data:', formData);
                setErrors({ general: `Missing required fields: ${missingFields.join(', ')}. Please refresh the page and try again.` });
                setIsSubmitting(false);
                return;
            }
        }

        try {
            // Create FormData for file uploads
            const formDataToSend = new FormData();
            
            // Debug: Log the complete formData state
            console.log('=== FORM SUBMISSION DEBUG ===');
            console.log('Complete formData state:', formData);
            console.log('Form data keys:', Object.keys(formData));
            console.log('Form data values:', Object.values(formData));
            console.log('isEditing:', isEditing);
            console.log('product:', product);
            
            // Debug: Log what we're about to process
            console.log('Processing form data:', {
                hasImageFile: !!formData.imageFile,
                imageUrl: formData.image_url,
                isBlobUrl: formData.image_url?.startsWith('blob:')
            });
            
            // SIMPLIFIED APPROACH: Just send all the form data directly
            if (isEditing && product) {
                // For editing, send all the current form data
                formDataToSend.append('_method', 'PUT');
                
                // Add all form fields with explicit values
                formDataToSend.append('name', formData.name || '');
                formDataToSend.append('category', formData.category || '');
                formDataToSend.append('description', formData.description || '');
                formDataToSend.append('brand', formData.brand || '');
                formDataToSend.append('sku', formData.sku || '');
                formDataToSend.append('quantity', String(formData.quantity || 0));
                formDataToSend.append('cost_price', String(formData.cost_price || 0));
                formDataToSend.append('selling_price', String(formData.selling_price || 0));
                formDataToSend.append('low_stock_threshold', String(formData.low_stock_threshold || 5));
                formDataToSend.append('is_active', formData.is_active ? '1' : '0');
                
                // Handle features
                if (formData.features && Array.isArray(formData.features) && formData.features.length > 0) {
                    formDataToSend.append('features', JSON.stringify(formData.features));
                } else {
                    formDataToSend.append('features', JSON.stringify(ensureFeaturesArray(formData.features)));
                }
                
                // Handle image
                if (formData.imageFile) {
                    formDataToSend.append('image', formData.imageFile);
                } else if (formData.image_url && !formData.image_url.startsWith('blob:')) {
                    formDataToSend.append('image_url', formData.image_url);
                }
                
                console.log('=== SIMPLIFIED FORM DATA ===');
                console.log('Form data being sent:', Object.fromEntries(formDataToSend.entries()));
                
                // Use router.post with _method override instead of router.put for better compatibility
                // Also try using the visit method as a fallback
                try {
                    await router.post(`/products/${product.id}`, formDataToSend as any);
                } catch (error) {
                    console.error('Router post failed, trying visit method:', error);
                    // Fallback to visit method
                    await router.visit(`/products/${product.id}`, {
                        method: 'put',
                        data: formDataToSend,
                        preserveState: false,
                        preserveScroll: false,
                    });
                }
            } else {
                // For creating new products, use the original logic
                // Add all form fields EXCEPT image_url (we'll handle it separately)
                Object.keys(formData).forEach(key => {
                    if (key === 'features') {
                        // Send features as proper JSON array
                        const features = ensureFeaturesArray(formData.features);
                        formDataToSend.append(key, JSON.stringify(features));
                    } else if (key === 'imageFile') {
                        // Handle file upload - only send if there's an actual file
                        if (formData.imageFile) {
                            formDataToSend.append('image', formData.imageFile);
                            console.log('Added image file:', formData.imageFile.name);
                        }
                    } else if (key === 'image_url') {
                        // Skip image_url here - we'll handle it separately
                        console.log('Skipping image_url in main loop');
                    } else if (key !== 'imageFile') {
                        // Handle other fields - send ALL values, including empty strings and 0
                        const value = formData[key as keyof Product];
                        if (value !== undefined && value !== null) {
                            if (typeof value === 'boolean') {
                                formDataToSend.append(key, value ? '1' : '0');
                            } else {
                                // Send the value as is, even if it's an empty string or 0
                                formDataToSend.append(key, String(value));
                            }
                            console.log(`Added field ${key}:`, value);
                        } else {
                            console.log(`Skipping field ${key}: undefined or null`);
                        }
                    }
                });

                // Handle image_url separately - only add if no file is uploaded AND it's a real URL
                if (!formData.imageFile && formData.image_url && !formData.image_url.startsWith('blob:')) {
                    formDataToSend.append('image_url', formData.image_url);
                    console.log('Added image_url:', formData.image_url);
                } else if (formData.imageFile) {
                    console.log('Skipping image_url because we have imageFile');
                } else if (formData.image_url?.startsWith('blob:')) {
                    console.log('Skipping blob URL:', formData.image_url);
                } else {
                    console.log('No image_url to add - field is empty or null');
                }

                // Debug: Log what we're sending
                console.log('Final form data being sent:', Object.fromEntries(formDataToSend.entries()));
                console.log('Form state:', {
                    isEditing,
                    productId: product?.id,
                    hasImageFile: !!formData.imageFile,
                    imageUrl: formData.image_url,
                    originalImageUrl: product?.image_url
                });

                // FINAL VALIDATION: Ensure we have data to send
                const formDataEntries = Array.from(formDataToSend.entries());
                if (isEditing && formDataEntries.length === 0) {
                    console.error('FormData is empty! This should not happen.');
                    setErrors({ general: 'Form data is empty. Please refresh the page and try again.' });
                    setIsSubmitting(false);
                    return;
                }

                console.log('Creating new product');
                await router.post('/products', formDataToSend as any);
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

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4 pb-20 sm:pb-6">
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

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Remove the loading state since we've simplified the logic */}
                    {/* {isEditing && !isFormReady && (
                        <Alert>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <AlertDescription>Loading product data...</AlertDescription>
                        </Alert>
                    )} */}

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
                            <CardDescription>
                                Essential product details like name, category, and description
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Product Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="Enter product name"
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className={errors.name ? 'border-red-500' : ''}
                                />
                                {errors.name && <InputError message={errors.name} />}
                            </div>

                            {/* Category */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Category *</Label>
                                <div className="flex gap-2">
                                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                                        <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {existingCategories.map((category) => (
                                                <SelectItem key={category} value={category}>
                                                    {category}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowNewCategory(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {errors.category && <InputError message={errors.category} />}
                            </div>

                            {/* Brand */}
                            <div className="space-y-2">
                                <Label htmlFor="brand">Brand</Label>
                                <div className="flex gap-2">
                                    <Select value={formData.brand || ''} onValueChange={(value) => handleInputChange('brand', value)}>
                                        <SelectTrigger className={errors.brand ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Select brand" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {existingBrands.map((brand) => (
                                                <SelectItem key={brand} value={brand}>
                                                    {brand}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowNewBrand(true)}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                                {errors.brand && <InputError message={errors.brand} />}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe your product..."
                                    value={formData.description || ''}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows={3}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                {errors.description && <InputError message={errors.description} />}
                            </div>

                            {/* Features */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Features</CardTitle>
                                    <CardDescription>
                                        Add key features or specifications for your product
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="newFeature">Add Feature</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="newFeature"
                                                placeholder="Enter a feature..."
                                                value={newFeature}
                                                onChange={(e) => setNewFeature(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                            />
                                            <Button type="button" onClick={addFeature} disabled={!newFeature.trim()}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {formData.features && Array.isArray(formData.features) && formData.features.length > 0 && (
                                        <div className="space-y-2">
                                            <Label>Current Features</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {ensureFeaturesArray(formData.features).map((feature, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm"
                                                    >
                                                        <span>{feature}</span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-4 w-4 p-0 hover:bg-primary/20"
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
                            <div className="space-y-2">
                                <Label htmlFor="image">Product Image</Label>
                                <div className="space-y-3">
                                    {/* Show preview for uploaded file or URL */}
                                    {(formData.imageFile || formData.image_url) && (
                                        <div className="relative">
                                            <img
                                                src={formData.imageFile ? URL.createObjectURL(formData.imageFile) : formData.image_url}
                                                alt="Product preview"
                                                className="h-32 w-32 rounded-lg border object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                                                onClick={() => {
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        image_url: '',
                                                        imageFile: undefined 
                                                    }));
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                    
                                    {/* File Upload */}
                                    <div className="space-y-2">
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    // Store the file for upload
                                                    setFormData(prev => ({ 
                                                        ...prev, 
                                                        imageFile: file,
                                                        image_url: '' // Clear any existing URL
                                                    }));
                                                }
                                            }}
                                            className={errors.image ? 'border-red-500' : ''}
                                        />
                                        {errors.image && <InputError message={errors.image} />}
                                    </div>

                                    {/* URL Input (alternative) */}
                                    <div className="space-y-2">
                                        <Label htmlFor="image_url" className="text-sm text-muted-foreground">
                                            Or enter image URL
                                        </Label>
                                        <Input
                                            id="image_url"
                                            type="url"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.image_url || ''}
                                            onChange={(e) => {
                                                // Clear the file when URL is entered
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    imageFile: undefined,
                                                    image_url: e.target.value 
                                                }));
                                            }}
                                            className={errors.image_url ? 'border-red-500' : ''}
                                        />
                                        {errors.image_url && <InputError message={errors.image_url} />}
                                    </div>
                                    
                                    <p className="text-sm text-muted-foreground">
                                        Upload an image file (JPEG, PNG, GIF, WebP up to 2MB) or enter a URL
                                    </p>
                                </div>
                            </div>

                            {/* SKU */}
                            <div className="space-y-2">
                                <Label htmlFor="sku">SKU</Label>
                                <Input
                                    id="sku"
                                    placeholder="Auto-generated if empty"
                                    value={formData.sku || ''}
                                    onChange={(e) => handleInputChange('sku', e.target.value)}
                                    className={errors.sku ? 'border-red-500' : ''}
                                />
                                {errors.sku && <InputError message={errors.sku} />}
                                <p className="text-sm text-muted-foreground">
                                    Leave empty to auto-generate a unique SKU
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & Inventory */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Inventory</CardTitle>
                            <CardDescription>
                                Set your product pricing and stock levels
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {/* Cost Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="cost_price">Cost Price *</Label>
                                    <Input
                                        id="cost_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={formData.cost_price}
                                        onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                                        className={errors.cost_price ? 'border-red-500' : ''}
                                    />
                                    {errors.cost_price && <InputError message={errors.cost_price} />}
                                </div>

                                {/* Selling Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="selling_price">Selling Price *</Label>
                                    <Input
                                        id="selling_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={formData.selling_price}
                                        onChange={(e) => handleInputChange('selling_price', parseFloat(e.target.value) || 0)}
                                        className={errors.selling_price ? 'border-red-500' : ''}
                                    />
                                    {errors.selling_price && <InputError message={errors.selling_price} />}
                                </div>

                                {/* Discount Price */}
                                <div className="space-y-2">
                                    <Label htmlFor="discount_price">Discount Price</Label>
                                    <Input
                                        id="discount_price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="Optional"
                                        value={formData.discount_price || ''}
                                        onChange={(e) => handleInputChange('discount_price', e.target.value ? parseFloat(e.target.value) : undefined)}
                                        className={errors.discount_price ? 'border-red-500' : ''}
                                    />
                                    {errors.discount_price && <InputError message={errors.discount_price} />}
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity *</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formData.quantity}
                                        onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                                        className={errors.quantity ? 'border-red-500' : ''}
                                    />
                                    {errors.quantity && <InputError message={errors.quantity} />}
                                </div>

                                {/* Low Stock Threshold */}
                                <div className="space-y-2">
                                    <Label htmlFor="low_stock_threshold">Low Stock Threshold *</Label>
                                    <Input
                                        id="low_stock_threshold"
                                        type="number"
                                        min="0"
                                        placeholder="5"
                                        value={formData.low_stock_threshold}
                                        onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 0)}
                                        className={errors.low_stock_threshold ? 'border-red-500' : ''}
                                    />
                                    {errors.low_stock_threshold && <InputError message={errors.low_stock_threshold} />}
                                </div>

                                {/* Active Status */}
                                <div className="space-y-2">
                                    <Label htmlFor="is_active">Status</Label>
                                    <div className="flex items-center space-x-2">
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

                            {/* Profit Calculator */}
                            <div className="rounded-lg bg-muted p-4">
                                <h4 className="font-medium mb-2">Profit Analysis</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">Profit Amount:</span>
                                        <span className="ml-2 font-medium text-green-600">
                                            {formatCurrency(profit)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Profit Margin:</span>
                                        <span className="ml-2 font-medium text-green-600">
                                            {margin.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-4">
                        <Link href="/products">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting}>
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
