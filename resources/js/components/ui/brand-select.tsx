import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface BrandSelectProps {
    value: string;
    onChange: (value: string) => void;
    existingBrands?: string[];
    label?: string;
    placeholder?: string;
    error?: string;
}

export function BrandSelect({ 
    value, 
    onChange, 
    existingBrands = [], 
    label = "Brand",
    placeholder = "Select or add brand",
    error 
}: BrandSelectProps) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newBrand, setNewBrand] = useState('');
    const [localBrands, setLocalBrands] = useState<string[]>(existingBrands);

    // Update local brands when existingBrands prop changes
    useEffect(() => {
        setLocalBrands(existingBrands);
    }, [existingBrands]);

    const handleSelectChange = (selectedValue: string) => {
        if (selectedValue === 'add-new') {
            setIsAddingNew(true);
            setNewBrand('');
        } else {
            // Convert "no-brand" back to empty string for the form
            onChange(selectedValue === 'no-brand' ? '' : selectedValue);
            setIsAddingNew(false);
        }
    };

    const handleAddNewBrand = async () => {
        if (newBrand.trim()) {
            const trimmedBrand = newBrand.trim();
            
            try {
                // Save to database
                const response = await fetch('/save-brand', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ brand: trimmedBrand }),
                });

                const result = await response.json();

                if (result.success) {
                    // Add to local brands if not already present
                    if (!localBrands.includes(trimmedBrand)) {
                        setLocalBrands(prev => [...prev, trimmedBrand]);
                    }
                    onChange(trimmedBrand);
                    setIsAddingNew(false);
                    setNewBrand('');
                } else {
                    console.error('Failed to save brand:', result.message);
                    // Still add to local state for immediate use
                    if (!localBrands.includes(trimmedBrand)) {
                        setLocalBrands(prev => [...prev, trimmedBrand]);
                    }
                    onChange(trimmedBrand);
                    setIsAddingNew(false);
                    setNewBrand('');
                }
            } catch (error) {
                console.error('Error saving brand:', error);
                // Still add to local state for immediate use
                if (!localBrands.includes(trimmedBrand)) {
                    setLocalBrands(prev => [...prev, trimmedBrand]);
                }
                onChange(trimmedBrand);
                setIsAddingNew(false);
                setNewBrand('');
            }
        }
    };

    const handleCancelAdd = () => {
        setIsAddingNew(false);
        setNewBrand('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNewBrand();
        } else if (e.key === 'Escape') {
            handleCancelAdd();
        }
    };

    if (isAddingNew) {
        return (
            <div className="space-y-2">
                <Label>{label}</Label>
                <div className="flex space-x-2">
                    <Input
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        placeholder="Enter brand name"
                        onKeyDown={handleKeyPress}
                        autoFocus
                        className="flex-1"
                    />
                    <Button 
                        type="button" 
                        onClick={handleAddNewBrand} 
                        disabled={!newBrand.trim()}
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
                {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Label>{label}</Label>
            <Select value={value || 'no-brand'} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                    <SelectItem value="no-brand" className="text-muted-foreground">
                        <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground mr-2"></span>
                            No Brand
                        </span>
                    </SelectItem>
                    {localBrands.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                Existing Brands
                            </div>
                            {localBrands.map((brand) => (
                                <SelectItem key={brand} value={brand} className="cursor-pointer">
                                    <span className="flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
                                        {brand}
                                    </span>
                                </SelectItem>
                            ))}
                        </>
                    )}
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                        Actions
                    </div>
                    <SelectItem value="add-new" className="cursor-pointer text-primary">
                        <span className="flex items-center">
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Brand
                        </span>
                    </SelectItem>
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
} 