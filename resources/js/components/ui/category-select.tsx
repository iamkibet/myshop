import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface CategorySelectProps {
    value: string;
    onChange: (value: string) => void;
    existingCategories: string[];
    label?: string;
    placeholder?: string;
    error?: string;
}

export function CategorySelect({
    value,
    onChange,
    existingCategories,
    label = 'Category',
    placeholder = 'Select or add category',
    error,
}: CategorySelectProps) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    const handleSelectChange = (selectedValue: string) => {
        if (selectedValue === 'add_new') {
            setIsAddingNew(true);
            setNewCategory('');
        } else {
            onChange(selectedValue);
            setIsAddingNew(false);
        }
    };

    const handleAddNewCategory = () => {
        if (newCategory.trim()) {
            onChange(newCategory.trim());
            setIsAddingNew(false);
            setNewCategory('');
        }
    };

    const handleCancelAdd = () => {
        setIsAddingNew(false);
        setNewCategory('');
    };

    const allCategories = [...existingCategories, ...['Shoes', 'T-Shirts', 'Pants', 'Dresses', 'Jackets', 'Hats', 'Accessories', 'Electronics', 'Home & Garden', 'Sports', 'Other']].filter((cat, index, arr) => arr.indexOf(cat) === index);

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            
            {isAddingNew ? (
                <div className="space-y-2">
                    <div className="flex space-x-2">
                        <Input
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="Enter new category name"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddNewCategory()}
                        />
                        <Button type="button" onClick={handleAddNewCategory} disabled={!newCategory.trim()}>
                            <Plus className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancelAdd}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <Select value={value} onValueChange={handleSelectChange}>
                    <SelectTrigger>
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {allCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                                {category}
                            </SelectItem>
                        ))}
                        <SelectItem value="add_new">
                            <div className="flex items-center space-x-2">
                                <Plus className="h-4 w-4" />
                                <span>Add New Category</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            )}
            
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
} 