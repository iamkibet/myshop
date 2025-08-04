# Image Upload and Variants Functionality Guide

## Overview

The product creation and editing form now includes comprehensive image upload functionality with camera support and proper variant management.

## Features

### Image Upload Component (`ImageUpload`)

The `ImageUpload` component provides three ways to add images:

1. **URL Input**: Directly enter an image URL
2. **File Upload**: Click "Upload File" to select an image from your device
3. **Camera Capture**: Click "Camera" to take a photo using your device's camera

### Key Features

- **Preview**: Images are immediately previewed when uploaded or URL is entered
- **Camera Support**: Uses `capture="environment"` to open the rear camera on mobile devices
- **File Validation**: Only accepts image files (JPEG, PNG, GIF, WebP)
- **Size Limit**: Maximum 5MB per image
- **Error Handling**: Shows error messages if upload fails
- **Loading States**: Shows processing indicator during upload

## Usage

### Product Images

The product form includes an image upload field for the main product image:

```tsx
<ImageUpload
    value={formData.image_url}
    onChange={(value) => handleInputChange('image_url', value)}
    onFileChange={(file) => handleImageUpload(file, 'product')}
    label="Product Image"
    placeholder="Enter image URL or upload file"
    error={errors.image_url}
/>
```

### Variant Images

Each product variant can have its own image:

```tsx
<ImageUpload
    value={variant.image_url || ''}
    onChange={(value) => updateVariant(index, 'image_url', value)}
    onFileChange={(file) => handleVariantImageUpload(file, index)}
    label="Variant Image (Optional)"
    placeholder="Enter image URL or upload file"
/>
```

## Backend Integration

### Upload Route

The image upload is handled by the `/upload-image` route:

```php
Route::post('/upload-image', [ProductController::class, 'uploadImage'])->name('upload.image');
```

### Upload Handler

The `uploadImage` method in `ProductController`:

1. Validates the uploaded file (image format, size limit)
2. Uses the `ImageService` to process and store the image
3. Returns the public URL of the uploaded image
4. Handles errors gracefully

### Image Service

The `ImageService` provides:

- Image optimization (resize to max 1200px, JPEG quality 85%)
- Unique filename generation using UUID
- Storage in `storage/app/public/products/` directory
- Public URL generation

## Variants Management

### Adding Variants

1. Click "Add Variant" button
2. Fill in variant details:
    - Color (optional)
    - Size (optional)
    - SKU (auto-generated if empty)
    - Quantity
    - Cost Price
    - Selling Price
    - Discount Price (optional)
    - Low Stock Threshold
    - Variant Image (optional)
    - Active status

### Variant Features

- **Auto SKU Generation**: Creates unique SKUs based on product name, color, and size
- **Stock Management**: Track quantity and low stock thresholds
- **Pricing**: Support for cost price, selling price, and discount price
- **Individual Images**: Each variant can have its own image
- **Active/Inactive**: Toggle variant availability

### Validation

- At least one variant is required
- SKU must be unique within the product
- Prices must be positive numbers
- Quantities must be non-negative integers

## File Storage

### Directory Structure

```
storage/app/public/
├── products/           # Main product images
└── products/thumbnails/ # Thumbnail versions (if needed)
```

### Public Access

Images are accessible via `/storage/products/filename.jpg`

## Error Handling

### Upload Errors

- File format not supported
- File size too large (>5MB)
- Network errors during upload
- Server processing errors

### Form Validation

- Required fields validation
- SKU uniqueness validation
- Price format validation
- Quantity validation

## Mobile Support

### Camera Integration

- Uses HTML5 `capture="environment"` attribute
- Opens rear camera on mobile devices
- Falls back to file picker if camera not available
- Works on both iOS and Android

### Responsive Design

- Image upload buttons stack on mobile
- Preview images are responsive
- Form layout adapts to screen size

## Security

### File Validation

- MIME type checking
- File size limits
- Image format validation
- Secure filename generation

### CSRF Protection

- All upload requests include CSRF tokens
- Laravel's built-in CSRF protection
- Secure file handling

## Troubleshooting

### Common Issues

1. **Upload Fails**: Check file size and format
2. **Camera Not Working**: Ensure HTTPS in production
3. **Images Not Displaying**: Check storage link is created
4. **SKU Conflicts**: Ensure unique SKUs within product

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify network requests in browser dev tools
3. Check Laravel logs for server errors
4. Verify storage permissions and links

## Best Practices

1. **Image Optimization**: Use the built-in optimization
2. **File Naming**: Let the system generate unique filenames
3. **Error Handling**: Always provide user feedback
4. **Mobile Testing**: Test camera functionality on real devices
5. **Storage Management**: Regularly clean up unused images
