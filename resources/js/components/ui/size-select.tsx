import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SizeSelectProps {
    value: string;
    onChange: (value: string) => void;
    existingSizes?: string[];
    label?: string;
    placeholder?: string;
    error?: string;
}

export function SizeSelect({ 
    value, 
    onChange, 
    existingSizes = [], 
    label = "Size",
    placeholder = "Select or add size",
    error 
}: SizeSelectProps) {
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newSize, setNewSize] = useState('');
    const [localSizes, setLocalSizes] = useState<string[]>(existingSizes);

    // Update local sizes when existingSizes prop changes
    useEffect(() => {
        setLocalSizes(existingSizes);
    }, [existingSizes]);

    const handleSelectChange = (selectedValue: string) => {
        if (selectedValue === 'add-new') {
            setIsAddingNew(true);
            setNewSize('');
        } else {
            // Convert "no-size" back to "none" for the form
            onChange(selectedValue === 'no-size' ? 'none' : selectedValue);
            setIsAddingNew(false);
        }
    };

    const handleAddNewSize = async () => {
        if (newSize.trim()) {
            const trimmedSize = newSize.trim();
            
            try {
                // Save to database
                const response = await fetch('/save-size', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ size: trimmedSize }),
                });

                const result = await response.json();

                if (result.success) {
                    // Add to local sizes if not already present
                    if (!localSizes.includes(trimmedSize)) {
                        setLocalSizes(prev => [...prev, trimmedSize]);
                    }
                    onChange(trimmedSize);
                    setIsAddingNew(false);
                    setNewSize('');
                } else {
                    console.error('Failed to save size:', result.message);
                    // Still add to local state for immediate use
                    if (!localSizes.includes(trimmedSize)) {
                        setLocalSizes(prev => [...prev, trimmedSize]);
                    }
                    onChange(trimmedSize);
                    setIsAddingNew(false);
                    setNewSize('');
                }
            } catch (error) {
                console.error('Error saving size:', error);
                // Still add to local state for immediate use
                if (!localSizes.includes(trimmedSize)) {
                    setLocalSizes(prev => [...prev, trimmedSize]);
                }
                onChange(trimmedSize);
                setIsAddingNew(false);
                setNewSize('');
            }
        }
    };

    const handleCancelAdd = () => {
        setIsAddingNew(false);
        setNewSize('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddNewSize();
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
                        value={newSize}
                        onChange={(e) => setNewSize(e.target.value)}
                        placeholder="Enter size (e.g., S, M, L, 10, 42)"
                        onKeyDown={handleKeyPress}
                        autoFocus
                        className="flex-1"
                    />
                    <Button 
                        type="button" 
                        onClick={handleAddNewSize} 
                        disabled={!newSize.trim()}
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
            <Select value={value === 'none' ? 'no-size' : value} onValueChange={handleSelectChange}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                    <SelectItem value="no-size" className="text-muted-foreground">
                        <span className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground mr-2"></span>
                            No Size
                        </span>
                    </SelectItem>
                    {localSizes.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                Existing Sizes
                            </div>
                            {localSizes.map((size) => (
                                <SelectItem key={size} value={size} className="cursor-pointer">
                                    <span className="flex items-center">
                                        <span className="w-2 h-2 rounded-full bg-primary mr-2"></span>
                                        {size}
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
                            Add New Size
                        </span>
                    </SelectItem>
                </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
} 