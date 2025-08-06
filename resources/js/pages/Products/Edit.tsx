import { usePage } from '@inertiajs/react';
import ProductsForm from './Form';

interface PageProps {
    product: {
        id: number;
        name: string;
        description?: string;
        brand: string;
        category: string;
        image_url?: string;
        features?: string[];
        meta_title?: string;
        meta_description?: string;
        is_active: boolean;
        variants?: Array<{
            id: number;
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
        }>;
    };
    existingCategories?: string[];
    existingBrands?: string[];
    existingSizes?: string[];
    [key: string]: any;
}

export default function Edit() {
    const { product, existingCategories, existingBrands, existingSizes } = usePage<PageProps>().props;
    return <ProductsForm 
        product={product} 
        isEditing={true} 
        existingCategories={existingCategories || []} 
        existingBrands={existingBrands || []}
        existingSizes={existingSizes || []}
    />;
}
