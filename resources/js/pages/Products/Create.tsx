import { usePage } from '@inertiajs/react';
import ProductsForm from './Form';

export default function Create() {
    const props = usePage().props as Record<string, unknown>;
    const existingCategories = (props.existingCategories as string[]) || [];
    const existingBrands = (props.existingBrands as string[]) || [];
    const existingSizes = (props.existingSizes as string[]) || [];
    return <ProductsForm isEditing={false} existingCategories={existingCategories} existingBrands={existingBrands} existingSizes={existingSizes} />;
}
