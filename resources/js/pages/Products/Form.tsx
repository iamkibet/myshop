import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Camera, Loader2, Package, Plus, Save, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Product {
    id?: number;
    name: string;
    sku: string;
    description?: string;
    brand: string;
    category: string;
    cost_price: number | string;
    msrp: number | string;
    quantity_on_hand: number;
    low_stock_threshold: number;
    images?: string[];
    sizes?: string[];
    colors?: string[];
    is_active: boolean;
}

interface ProductsFormProps {
    product?: Product;
    options?: {
        brands: string[];
        categories: string[];
        colors: string[];
        sizes: string[];
    };
}

const CATEGORIES = ['Shoes', 'T-Shirts', 'Pants', 'Dresses', 'Jackets', 'Hats', 'Accessories', 'Electronics', 'Home & Garden', 'Sports', 'Other'];

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const COMMON_COLORS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Purple', 'Pink', 'Orange', 'Brown', 'Gray'];

export default function ProductsForm({ product, options }: ProductsFormProps) {
    const isEditing = !!product;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: product?.name || '',
        sku: product?.sku || '',
        description: product?.description || '',
        brand: product?.brand || '',
        category: product?.category || '',
        cost_price: product?.cost_price || 0,
        msrp: product?.msrp || 0,
        quantity_on_hand: product?.quantity_on_hand || 0,
        low_stock_threshold: product?.low_stock_threshold || 10,
        images: product?.images || [],
        sizes: product?.sizes || [],
        colors: product?.colors || [],
        is_active: product?.is_active ?? true,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [newImage, setNewImage] = useState('');
    const [newSize, setNewSize] = useState('');
    const [newColor, setNewColor] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [filePreviews, setFilePreviews] = useState<string[]>([]);

    // Cleanup preview URLs on unmount
    useEffect(() => {
        return () => {
            filePreviews.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [filePreviews]);

    // Helper function to validate image URL
    const isValidImageUrl = (url: string): boolean => {
        try {
            const urlObj = new URL(url);
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
            return imageExtensions.some((ext) => urlObj.pathname.toLowerCase().endsWith(ext));
        } catch {
            return false;
        }
    };

    // Merge existing options with common options
    const allBrands = [
        ...new Set([
            ...(options?.brands || []),
            'TechCorp',
            'SoundMax',
            'SportFlex',
            'FashionCo',
            'DenimStyle',
            'MobileTech',
            'HomeStyle',
            'FitLife',
        ]),
    ];
    const allCategories = [...new Set([...(options?.categories || []), ...CATEGORIES])];

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
        console.log('=== FORM SUBMISSION STARTED ===');
        console.log('Form data:', formData);
        setIsSubmitting(true);
        setErrors({});

        // Validate required fields
        const requiredFields = ['name', 'sku', 'brand', 'category', 'cost_price', 'msrp', 'quantity_on_hand', 'low_stock_threshold'];

        console.log('Form data for validation:', formData);

        const missingFields = requiredFields.filter((field) => {
            const value = formData[field as keyof typeof formData];
            // For numeric fields, check if the value is null, undefined, or empty string
            if (['cost_price', 'msrp', 'quantity_on_hand', 'low_stock_threshold'].includes(field)) {
                const isMissing = value === null || value === undefined || value === '';
                console.log(`Field ${field}: value=${value}, isMissing=${isMissing}`);
                return isMissing;
            }
            // For string fields, check if the value is falsy
            const isMissing = !value;
            console.log(`Field ${field}: value=${value}, isMissing=${isMissing}`);
            return isMissing;
        });

        if (missingFields.length > 0) {
            console.log('Missing required fields:', missingFields);
            setErrors({ general: `Missing required fields: ${missingFields.join(', ')}` });
            setIsSubmitting(false);
            return;
        }

        // Create FormData for file uploads
        const formDataToSend = new FormData();

        // Add basic fields
        formDataToSend.append('name', formData.name);
        formDataToSend.append('sku', formData.sku);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('brand', formData.brand);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('cost_price', formData.cost_price.toString());
        formDataToSend.append('msrp', formData.msrp.toString());
        formDataToSend.append('quantity_on_hand', formData.quantity_on_hand.toString());
        formDataToSend.append('low_stock_threshold', formData.low_stock_threshold.toString());
        formDataToSend.append('is_active', formData.is_active.toString());

        // Add arrays as JSON strings
        formDataToSend.append('sizes', JSON.stringify(formData.sizes));
        formDataToSend.append('colors', JSON.stringify(formData.colors));
        formDataToSend.append('images', JSON.stringify(formData.images));

        // Add file uploads
        if (selectedFiles.length > 0) {
            selectedFiles.forEach((file, index) => {
                formDataToSend.append(`image_files[${index}]`, file);
            });
        }

        // Debug: Log what we're sending
        console.log('Sending data:', {
            name: formData.name,
            sku: formData.sku,
            brand: formData.brand,
            category: formData.category,
            sizes: formData.sizes,
            colors: formData.colors,
            images: formData.images,
            files: selectedFiles.length,
        });

        try {
            if (isEditing) {
                console.log('Updating product:', product?.id);
                await router.put(`/products/${product.id}`, formDataToSend);
            } else {
                console.log('Creating new product');
                // Use Inertia router for form submission
                console.log('About to call router.post');

                // For debugging, let's try sending as a regular object first
                const dataToSend = {
                    name: formData.name,
                    sku: formData.sku,
                    description: formData.description,
                    brand: formData.brand,
                    category: formData.category,
                    cost_price: parseFloat(formData.cost_price.toString()) || 0,
                    msrp: parseFloat(formData.msrp.toString()) || 0,
                    quantity_on_hand: parseInt(formData.quantity_on_hand.toString()) || 0,
                    low_stock_threshold: parseInt(formData.low_stock_threshold.toString()) || 0,
                    is_active: formData.is_active,
                    sizes: JSON.stringify(formData.sizes),
                    colors: JSON.stringify(formData.colors),
                    images: JSON.stringify(formData.images),
                };

                console.log('Sending as object:', dataToSend);
                await router.post('/products', dataToSend);
                console.log('router.post completed successfully');
            }
            console.log('Form submission successful');
        } catch (error: unknown) {
            console.error('Form submission error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred while saving the product.';
            console.log('General error:', errorMessage);
            setErrors({ general: errorMessage });
            // Reset success state on error
            setIsSuccess(false);
        } finally {
            console.log('=== FORM SUBMISSION ENDED ===');
            setIsSubmitting(false);
        }
    };

    const handleInputChange = (field: string, value: string | number | boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: '' }));
        }
    };

    const addImage = () => {
        if (newImage.trim()) {
            // Validate URL format
            if (!isValidImageUrl(newImage.trim())) {
                setErrors((prev) => ({
                    ...prev,
                    general: 'Please enter a valid image URL (jpg, png, gif, webp, svg)',
                }));
                return;
            }

            setFormData((prev) => ({
                ...prev,
                images: [...prev.images, newImage.trim()],
            }));
            setNewImage('');
            // Clear any previous errors
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.general;
                return newErrors;
            });
        }
    };

    const removeImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        let processedCount = 0;
        const newFiles: File[] = [];
        const newPreviews: string[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type.startsWith('image/')) {
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        setErrors((prev) => ({
                            ...prev,
                            general: `File ${file.name} is too large. Maximum size is 5MB.`,
                        }));
                        continue;
                    }

                    // Add to selected files
                    newFiles.push(file);
                    newPreviews.push(URL.createObjectURL(file)); // Create a preview URL
                    processedCount++;
                } else {
                    setErrors((prev) => ({
                        ...prev,
                        general: `File ${file.name} is not a valid image.`,
                    }));
                }
            }

            // Update selected files and previews
            setSelectedFiles((prev) => [...prev, ...newFiles]);
            setFilePreviews((prev) => [...prev, ...newPreviews]);

            // Show success message for processed images
            if (processedCount > 0) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.general;
                    return newErrors;
                });
                setUploadSuccess(true);
                setTimeout(() => setUploadSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Error processing image:', error);
            setErrors((prev) => ({
                ...prev,
                general: 'Error processing image. Please try again.',
            }));
        } finally {
            setIsUploading(false);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const triggerCameraCapture = () => {
        cameraInputRef.current?.click();
    };

    const removeSelectedFile = (index: number) => {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
        setFilePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const addSize = () => {
        if (newSize.trim()) {
            setFormData((prev) => ({
                ...prev,
                sizes: [...prev.sizes, newSize.trim()],
            }));
            setNewSize('');
            // Add visual feedback
            const button = document.querySelector('[data-add-size]') as HTMLButtonElement;
            if (button) {
                button.classList.add('bg-green-500');
                setTimeout(() => button.classList.remove('bg-green-500'), 200);
            }
        }
    };

    const removeSize = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            sizes: prev.sizes.filter((_, i) => i !== index),
        }));
    };

    const addColor = () => {
        if (newColor.trim()) {
            setFormData((prev) => ({
                ...prev,
                colors: [...prev.colors, newColor.trim()],
            }));
            setNewColor('');
            // Add visual feedback
            const button = document.querySelector('[data-add-color]') as HTMLButtonElement;
            if (button) {
                button.classList.add('bg-green-500');
                setTimeout(() => button.classList.remove('bg-green-500'), 200);
            }
        }
    };

    const removeColor = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            colors: prev.colors.filter((_, i) => i !== index),
        }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEditing ? 'Edit Product' : 'Create Product'} />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Product' : 'Create Product'}</h1>
                        <p className="text-muted-foreground">{isEditing ? 'Update product information' : 'Add a new product to inventory'}</p>
                    </div>
                    <Link href="/products">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Products
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Success Message */}
                    {isSuccess && (
                        <div className="rounded-md bg-green-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-green-800">Success!</h3>
                                    <div className="mt-2 text-sm text-green-700">Product created successfully. Redirecting to products list...</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* General Error Display */}
                    {errors.general && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">{errors.general}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Product Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Enter product name"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    <InputError message={errors.name} className="mt-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU *</Label>
                                    <Input
                                        id="sku"
                                        value={formData.sku}
                                        onChange={(e) => handleInputChange('sku', e.target.value)}
                                        placeholder="Enter SKU"
                                        className={errors.sku ? 'border-red-500' : ''}
                                    />
                                    <InputError message={errors.sku} className="mt-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="brand">Brand *</Label>
                                    <Combobox
                                        options={allBrands}
                                        value={formData.brand}
                                        onValueChange={(value) => handleInputChange('brand', value)}
                                        placeholder="Select or create brand"
                                        emptyText="No brands found"
                                        createText="Create brand"
                                        onCreateNew={(value) => handleInputChange('brand', value)}
                                        className={errors.brand ? 'border-red-500' : ''}
                                    />
                                    <InputError message={errors.brand} className="mt-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="category">Category *</Label>
                                    <Combobox
                                        options={allCategories}
                                        value={formData.category}
                                        onValueChange={(value) => handleInputChange('category', value)}
                                        placeholder="Select or create category"
                                        emptyText="No categories found"
                                        createText="Create category"
                                        onCreateNew={(value) => handleInputChange('category', value)}
                                        className={errors.category ? 'border-red-500' : ''}
                                    />
                                    <InputError message={errors.category} className="mt-1" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Enter product description"
                                    rows={3}
                                    className={errors.description ? 'border-red-500' : ''}
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pricing & Stock */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pricing & Stock</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="cost_price">Cost Price (KSH) *</Label>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">KSH</span>
                                        <Input
                                            id="cost_price"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.cost_price}
                                            onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            className={`pl-12 ${errors.cost_price ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <InputError message={errors.cost_price} className="mt-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="msrp">MSRP (KSH) *</Label>
                                    <div className="relative">
                                        <span className="absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">KSH</span>
                                        <Input
                                            id="msrp"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={formData.msrp}
                                            onChange={(e) => handleInputChange('msrp', parseFloat(e.target.value) || 0)}
                                            placeholder="0.00"
                                            className={`pl-12 ${errors.msrp ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    <InputError message={errors.msrp} className="mt-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="quantity_on_hand">Quantity on Hand *</Label>
                                    <Input
                                        id="quantity_on_hand"
                                        type="number"
                                        min="0"
                                        value={formData.quantity_on_hand}
                                        onChange={(e) => handleInputChange('quantity_on_hand', parseInt(e.target.value) || 0)}
                                        placeholder="0"
                                        className={errors.quantity_on_hand ? 'border-red-500' : ''}
                                    />
                                    <InputError message={errors.quantity_on_hand} className="mt-1" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="low_stock_threshold">Low Stock Threshold *</Label>
                                    <Input
                                        id="low_stock_threshold"
                                        type="number"
                                        min="0"
                                        value={formData.low_stock_threshold}
                                        onChange={(e) => handleInputChange('low_stock_threshold', parseInt(e.target.value) || 0)}
                                        placeholder="10"
                                        className={errors.low_stock_threshold ? 'border-red-500' : ''}
                                    />
                                    <InputError message={errors.low_stock_threshold} className="mt-1" />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked: boolean) => handleInputChange('is_active', checked)}
                                />
                                <Label htmlFor="is_active">Product is active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Images */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Product Images</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Upload Options */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                {/* URL Input */}
                                <div className="space-y-2">
                                    <Label>Add Image URL</Label>
                                    <div className="flex space-x-2">
                                        <Input
                                            placeholder="Enter image URL"
                                            value={newImage}
                                            onChange={(e) => setNewImage(e.target.value)}
                                            className="flex-1"
                                        />
                                        <Button type="button" onClick={addImage} size="sm">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* File Upload */}
                                <div className="space-y-2">
                                    <Label>Upload Images</Label>
                                    <Button type="button" variant="outline" onClick={triggerFileUpload} disabled={isUploading} className="w-full">
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Choose Files
                                            </>
                                        )}
                                    </Button>
                                    <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
                                </div>

                                {/* Camera Capture */}
                                <div className="space-y-2">
                                    <Label>Take Photo</Label>
                                    <Button type="button" variant="outline" onClick={triggerCameraCapture} disabled={isUploading} className="w-full">
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Camera className="mr-2 h-4 w-4" />
                                                Use Camera
                                            </>
                                        )}
                                    </Button>
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            {/* Image Upload Success Message */}
                            {uploadSuccess && (
                                <div className="rounded-md bg-green-50 p-3">
                                    <div className="flex">
                                        <div className="ml-3">
                                            <p className="text-sm text-green-700">Files selected successfully!</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Selected Files Preview */}
                            {selectedFiles.length > 0 && (
                                <div className="space-y-4">
                                    <Label>Selected Files ({selectedFiles.length})</Label>
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                        {filePreviews.map((preview, index) => (
                                            <div key={index} className="group relative">
                                                <div className="flex h-24 w-full items-center justify-center rounded-md border bg-gray-50">
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="h-full w-full rounded-md object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                    <div className="hidden text-center">
                                                        <Package className="mx-auto h-8 w-8 text-gray-400" />
                                                        <p className="mt-1 truncate px-2 text-xs text-gray-500">
                                                            {selectedFiles[index]?.name || `File ${index + 1}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                                                    onClick={() => removeSelectedFile(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Image Preview */}
                            {formData.images.length > 0 && (
                                <div className="space-y-4">
                                    <Label>Product Images ({formData.images.length})</Label>
                                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                        {formData.images.map((image, index) => (
                                            <div key={index} className="group relative">
                                                <img
                                                    src={image}
                                                    alt={`Product ${index + 1}`}
                                                    className="h-24 w-full rounded-md border object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.src =
                                                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                <div className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-xs text-white">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Help Text */}
                            <div className="text-sm text-muted-foreground">
                                <p>• Add image URLs for external images (jpg, png, gif, webp, svg)</p>
                                <p>• Upload multiple images from your device (max 5MB each)</p>
                                <p>• Use camera to take photos directly</p>
                                <p>• Supported formats: JPG, PNG, GIF, WebP, SVG</p>
                                <p>• Maximum file size: 5MB per image</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sizes & Colors */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Sizes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Sizes</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex space-x-2">
                                    <Input
                                        placeholder="Enter size"
                                        value={newSize}
                                        onChange={(e) => setNewSize(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addSize();
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button type="button" onClick={addSize} size="sm" disabled={!newSize.trim()} data-add-size>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {formData.sizes.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.sizes.map((size, index) => (
                                            <div key={index} className="flex items-center space-x-1 rounded-md bg-secondary px-2 py-1">
                                                <span className="text-sm">{size}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeSize(index)}
                                                    className="h-4 w-4 p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="text-sm text-muted-foreground">Common sizes: {COMMON_SIZES.join(', ')}</div>
                            </CardContent>
                        </Card>

                        {/* Colors */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Available Colors</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex space-x-2">
                                    <Input
                                        placeholder="Enter color"
                                        value={newColor}
                                        onChange={(e) => setNewColor(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addColor();
                                            }
                                        }}
                                        className="flex-1"
                                    />
                                    <Button type="button" onClick={addColor} size="sm" disabled={!newColor.trim()} data-add-color>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {formData.colors.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {formData.colors.map((color, index) => (
                                            <div key={index} className="flex items-center space-x-1 rounded-md bg-secondary px-2 py-1">
                                                <span className="text-sm">{color}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeColor(index)}
                                                    className="h-4 w-4 p-0"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="text-sm text-muted-foreground">Common colors: {COMMON_COLORS.join(', ')}</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end space-x-2 border-t pt-4">
                        <Link href="/products">
                            <Button variant="outline" type="button">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={isSubmitting || isSuccess}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Product...
                                </>
                            ) : isSuccess ? (
                                <>
                                    <Package className="mr-2 h-4 w-4" />
                                    Product Created!
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
