import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Package2 } from 'lucide-react';
import { useForm } from '@inertiajs/react';

interface InlineQuantityEditorProps {
  productId: number;
  currentQuantity: number;
  onSave: (productId: number, newQuantity: number) => void;
  onCancel: () => void;
  isEditing: boolean;
  onEdit: () => void;
}

const InlineQuantityEditor: React.FC<InlineQuantityEditorProps> = ({
  productId,
  currentQuantity,
  onSave,
  onCancel,
  isEditing,
  onEdit
}) => {
  const [quantity, setQuantity] = useState(currentQuantity);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (quantity === currentQuantity) {
      onCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(productId, quantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      setQuantity(currentQuantity); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setQuantity(currentQuantity);
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <Input
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
          onKeyDown={handleKeyPress}
          className="w-20 h-8 text-sm"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isSaving}
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={isSaving}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium min-w-[3rem]">{currentQuantity}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={onEdit}
        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
      >
        <Package2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default InlineQuantityEditor;
