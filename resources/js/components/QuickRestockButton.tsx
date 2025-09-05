import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Package2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number;
  low_stock_threshold: number;
  cost_price: number;
  selling_price: number;
}

interface QuickRestockButtonProps {
  product: Product;
  onRestock: (productId: number, newQuantity: number, reason?: string) => void;
}

const QuickRestockButton: React.FC<QuickRestockButtonProps> = ({
  product,
  onRestock
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState(product.quantity);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStockStatus = () => {
    if (product.quantity === 0) return { status: 'Out of Stock', color: 'destructive', priority: 'high' };
    if (product.quantity <= product.low_stock_threshold) return { status: 'Low Stock', color: 'secondary', priority: 'medium' };
    return { status: 'In Stock', color: 'default', priority: 'low' };
  };

  const getSuggestedQuantity = () => {
    if (product.quantity === 0) {
      return product.low_stock_threshold * 3; // Emergency restock
    }
    if (product.quantity <= product.low_stock_threshold) {
      return product.low_stock_threshold * 2; // Low stock restock
    }
    return product.quantity + product.low_stock_threshold; // Regular restock
  };

  const getButtonConfig = () => {
    const stockStatus = getStockStatus();
    
    if (stockStatus.priority === 'high') {
      return {
        text: 'Restock',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        className: 'bg-red-600 hover:bg-red-700 text-white text-xs px-2 py-1 h-8'
      };
    }
    
    if (stockStatus.priority === 'medium') {
      return {
        text: 'Restock',
        variant: 'secondary' as const,
        icon: Package2,
        className: 'bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1 h-8'
      };
    }
    
    return {
      text: 'Restock',
      variant: 'outline' as const,
      icon: Package2,
      className: 'border-blue-600 text-blue-600 hover:bg-blue-50 text-xs px-2 py-1 h-8'
    };
  };

  const handleSubmit = async () => {
    if (quantity === product.quantity) {
      setIsOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await onRestock(product.id, quantity, reason);
      setIsOpen(false);
      setQuantity(product.quantity);
      setReason('');
    } catch (error) {
      console.error('Restock failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpen = () => {
    setQuantity(getSuggestedQuantity());
    setReason('');
    setIsOpen(true);
  };

  const stockStatus = getStockStatus();
  const buttonConfig = getButtonConfig();
  const Icon = buttonConfig.icon;

  return (
    <>
      <Button
        size="sm"
        variant={buttonConfig.variant}
        onClick={handleOpen}
        className={buttonConfig.className}
      >
        <Icon className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">{buttonConfig.text}</span>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              {buttonConfig.text}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Product Info */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{product.name}</h4>
                <Badge variant={stockStatus.color as any}>
                  {stockStatus.status}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{product.category}</p>
              <p className="text-sm text-gray-600">
                Current: {product.quantity} | Threshold: {product.low_stock_threshold}
              </p>
            </div>

            {/* Quantity Input */}
            <div>
              <Label htmlFor="quantity" className="text-sm font-medium">
                New Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Suggested: {getSuggestedQuantity()}
              </p>
            </div>

            {/* Reason Input */}
            <div>
              <Label htmlFor="reason" className="text-sm font-medium">
                Restock Reason (Optional)
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g., Supplier delivery, seasonal restock, emergency restock..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="font-medium text-blue-900 mb-1">Restock Summary</h5>
              <div className="text-sm text-blue-700">
                <p>Quantity Change: {product.quantity} → {quantity}</p>
                <p>Difference: {quantity > product.quantity ? '+' : ''}{quantity - product.quantity}</p>
                {quantity > product.quantity && (
                  <p>Inventory Value: +Ksh {((quantity - product.quantity) * product.cost_price).toLocaleString()}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={quantity === product.quantity || isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Restocking...' : 'Confirm Restock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default QuickRestockButton;
