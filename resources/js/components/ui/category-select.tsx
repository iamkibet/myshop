import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    const [localCategories, setLocalCategories] = useState<string[]>(existingCategories);

    // Update local categories when existingCategories prop changes
    useEffect(() => {
        setLocalCategories(existingCategories);
    }, [existingCategories]);

    const handleSelectChange = (selectedValue: string) => {
        if (selectedValue === 'add_new') {
            setIsAddingNew(true);
            setNewCategory('');
        } else {
            onChange(selectedValue);
            setIsAddingNew(false);
        }
    };

    const handleAddNewCategory = async () => {
        if (newCategory.trim()) {
            const trimmedCategory = newCategory.trim();
            
            try {
                // Save to database
                const response = await fetch('/save-category', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ category: trimmedCategory }),
                });

                const result = await response.json();

                if (result.success) {
                    // Add to local categories if not already present
                    if (!localCategories.includes(trimmedCategory)) {
                        setLocalCategories(prev => [...prev, trimmedCategory]);
                    }
                    onChange(trimmedCategory);
                    setIsAddingNew(false);
                    setNewCategory('');
                } else {
                    console.error('Failed to save category:', result.message);
                    // Still add to local state for immediate use
                    if (!localCategories.includes(trimmedCategory)) {
                        setLocalCategories(prev => [...prev, trimmedCategory]);
                    }
                    onChange(trimmedCategory);
                    setIsAddingNew(false);
                    setNewCategory('');
                }
            } catch (error) {
                console.error('Error saving category:', error);
                // Still add to local state for immediate use
                if (!localCategories.includes(trimmedCategory)) {
                    setLocalCategories(prev => [...prev, trimmedCategory]);
                }
                onChange(trimmedCategory);
                setIsAddingNew(false);
                setNewCategory('');
            }
        }
    };

    const handleCancelAdd = () => {
        setIsAddingNew(false);
        setNewCategory('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNewCategory();
        } else if (e.key === 'Escape') {
            handleCancelAdd();
        }
    };

    const allCategories = [...localCategories, ...['Shoes', 'T-Shirts', 'Pants', 'Dresses', 'Jackets', 'Hats', 'Accessories', 'Electronics', 'Home & Garden', 'Sports', 'Other']].filter((cat, index, arr) => arr.indexOf(cat) === index);

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            
            {isAddingNew ? (
                <div className="flex space-x-2">
                    <Input
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Enter new category name"
                        onKeyDown={handleKeyPress}
                        autoFocus
                        className="flex-1"
                    />
                    <Button 
                        type="button" 
                        onClick={handleAddNewCategory} 
                        disabled={!newCategory.trim()}
                        size="sm"
                        className="px-3"
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleCancelAdd}
                        size="sm"
                        className="px-3"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Select value={value} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder={placeholder} />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                        {allCategories.length > 0 && (
                            <>
                                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                    Available Categories
                                </div>
                                {allCategories.map((category) => (
                                    <SelectItem key={category} value={category} className="cursor-pointer">
                                        <span className="flex items-center">
                                            <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
                                            {category}
                                        </span>
                                    </SelectItem>
                                ))}
                            </>
                        )}
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                            Actions
                        </div>
                        <SelectItem value="add_new" className="cursor-pointer text-primary">
                            <span className="flex items-center">
                                <Plus className="h-4 w-4 mr-2" />
                                Add New Category
                            </span>
                        </SelectItem>
                    </SelectContent>
                </Select>
            )}
            
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
} 