import { usePage } from '@inertiajs/react';
import ProductForm from './Form';

interface PageProps {
    product: {
        id: number;
        name: string;
        category: string;
        description?: string;
        brand?: string;
        image_url?: string;
        features?: string[];
        sku: string;
        quantity: number;
        cost_price: number;
        selling_price: number;
        discount_price?: number;
        low_stock_threshold: number;
        is_active: boolean;
    };
    existingCategories?: string[];
    existingBrands?: string[];
    [key: string]: any;
}

export default function Edit() {
    const { product, existingCategories, existingBrands } = usePage<PageProps>().props;
    
    return <ProductForm 
        product={product} 
        isEditing={true} 
        existingCategories={existingCategories || []} 
        existingBrands={existingBrands || []}
    />;
}
