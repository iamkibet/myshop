import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Package2, Search, AlertTriangle, CheckCircle, XCircle, Plus, Minus } from 'lucide-react';
import { useForm } from '@inertiajs/react';

interface Product {
  id: number;
  name: string;
  category: string;
  quantity: number;
  low_stock_threshold: number;
  cost_price: number;
  selling_price: number;
}

interface BulkRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRestock: (items: RestockItem[]) => void;
}

interface RestockItem {
  product_id: number;
  new_quantity: number;
  reason?: string;
}

const BulkRestockModal: React.FC<BulkRestockModalProps> = ({
  isOpen,
  onClose,
  products,
  onRestock
}) => {
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [restockItems, setRestockItems] = useState<RestockItem[]>([]);
  const [globalReason, setGlobalReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedProducts(new Set());
      setRestockItems([]);
      setGlobalReason('');
      setSearchQuery('');
      setCategoryFilter('all');
      setStockFilter('all');
    }
  }, [isOpen]);

  // Filter products based on search, category, and stock status
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      
      const matchesStock = (() => {
        if (stockFilter === 'all') return true;
        if (stockFilter === 'out_of_stock') return product.quantity === 0;
        if (stockFilter === 'low_stock') return product.quantity > 0 && product.quantity <= product.low_stock_threshold;
        if (stockFilter === 'in_stock') return product.quantity > product.low_stock_threshold;
        return true;
      })();
      
      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, categoryFilter, stockFilter]);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return uniqueCategories.sort();
  }, [products]);

  // Update restock items when selection changes
  useEffect(() => {
    const newItems: RestockItem[] = Array.from(selectedProducts).map(productId => {
      const existingItem = restockItems.find(item => item.product_id === productId);
      const product = products.find(p => p.id === productId);
      
      return {
        product_id: productId,
        new_quantity: existingItem?.new_quantity || product?.quantity || 0,
        reason: existingItem?.reason || globalReason
      };
    });
    
    setRestockItems(newItems);
  }, [selectedProducts, globalReason, products]);

  const handleProductSelect = (productId: number, checked: boolean) => {
    const newSelection = new Set(selectedProducts);
    if (checked) {
      newSelection.add(productId);
    } else {
      newSelection.delete(productId);
    }
    setSelectedProducts(newSelection);
  };


  const handleReasonChange = (productId: number, reason: string) => {
    setRestockItems(prev => 
      prev.map(item => 
        item.product_id === productId 
          ? { ...item, reason }
          : item
      )
    );
  };

  const handleQuantityChange = (productId: number, change: number) => {
    setRestockItems(prev => 
      prev.map(item => {
        if (item.product_id === productId) {
          const newQuantity = Math.max(0, item.new_quantity + change);
          return { ...item, new_quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const handleQuantityInput = (productId: number, value: string) => {
    const quantity = parseInt(value) || 0;
    setRestockItems(prev => 
      prev.map(item => 
        item.product_id === productId 
          ? { ...item, new_quantity: Math.max(0, quantity) }
          : item
      )
    );
  };

  const getStockStatus = (product: Product) => {
    if (product.quantity === 0) return { status: 'Out of Stock', color: 'destructive' };
    if (product.quantity <= product.low_stock_threshold) return { status: 'Low Stock', color: 'secondary' };
    return { status: 'In Stock', color: 'default' };
  };

  const handleSubmit = async () => {
    if (selectedProducts.size === 0) return;
    
    setIsSubmitting(true);
    try {
      await onRestock(restockItems);
      onClose();
    } catch (error) {
      console.error('Restock failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedProductsList = filteredProducts.filter(p => selectedProducts.has(p.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto w-[95vw] sm:w-full mx-2 sm:mx-0 p-2 sm:p-6">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package2 className="h-5 w-5" />
            <span className="truncate">Bulk Restock Products</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Filter */}
          <div className="space-y-4">
            {/* Search Bar */}
            <div>
              <Label htmlFor="search" className="text-sm font-medium">
                Search Products
              </Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name, category, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <select
                  id="category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="stock" className="text-sm font-medium">
                  Stock Status
                </Label>
                <select
                  id="stock"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Stock Levels</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="in_stock">In Stock</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredProducts.length} products found • {selectedProducts.size} selected
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedProducts.size === filteredProducts.length) {
                    setSelectedProducts(new Set());
                  } else {
                    setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
                  }
                }}
              >
                {selectedProducts.size === filteredProducts.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>

          {/* Product Selection */}
          <div className="border rounded-lg max-h-60 sm:max-h-80 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="p-4 sm:p-8 text-center text-gray-500">
                <Package2 className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">No products found matching your search criteria</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const isSelected = selectedProducts.has(product.id);
                  
                  return (
                    <div
                      key={product.id}
                      className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleProductSelect(product.id, !isSelected)}
                    >
                      <div className="flex items-start sm:items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                            </h4>
                            <Badge variant={stockStatus.color as any} className="text-xs w-fit">
                              {stockStatus.status}
                            </Badge>
                          </div>
                          <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-gray-500">
                            <span>{product.category}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>SKU: {product.sku}</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Current: {product.quantity}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="flex-shrink-0">
                            <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Global Reason */}
          <div>
            <Label htmlFor="global-reason" className="text-base font-medium">
              Global Restock Reason (Optional)
            </Label>
            <Textarea
              id="global-reason"
              placeholder="e.g., Seasonal restock, supplier delivery, emergency restock..."
              value={globalReason}
              onChange={(e) => setGlobalReason(e.target.value)}
              className="mt-2"
              rows={2}
            />
          </div>

          {/* Selected Products Details */}
          {selectedProductsList.length > 0 && (
            <div>
              <Label className="text-base font-medium mb-3 block">
                Set Quantities for Selected Products
              </Label>
              <div className="space-y-3 sm:space-y-4 max-h-60 sm:max-h-80 overflow-y-auto border rounded-lg p-3 sm:p-4">
                {selectedProductsList.map((product) => {
                  const restockItem = restockItems.find(item => item.product_id === product.id);
                  const currentQuantity = restockItem?.new_quantity || product.quantity;
                  
                  return (
                    <div key={product.id} className="bg-white border rounded-lg p-3 sm:p-4 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            <span className="block sm:inline">{product.category}</span>
                            <span className="hidden sm:inline"> • </span>
                            <span className="block sm:inline">SKU: {product.sku}</span>
                            <span className="hidden sm:inline"> • </span>
                            <span className="block sm:inline">Current: {product.quantity}</span>
                          </p>
                        </div>
                        <Badge variant={getStockStatus(product).color as any} className="text-xs w-fit">
                          {getStockStatus(product).status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Quantity Controls */}
                        <div>
                          <Label htmlFor={`quantity-${product.id}`} className="text-sm font-medium">
                            New Quantity
                          </Label>
                          <div className="flex items-center space-x-2 mt-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(product.id, -1)}
                              className="h-8 w-8 p-0 touch-manipulation"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              id={`quantity-${product.id}`}
                              type="number"
                              min="0"
                              value={currentQuantity}
                              onChange={(e) => handleQuantityInput(product.id, e.target.value)}
                              className="w-16 sm:w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuantityChange(product.id, 1)}
                              className="h-8 w-8 p-0 touch-manipulation"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Change: {currentQuantity > product.quantity ? '+' : ''}{currentQuantity - product.quantity}
                          </p>
                        </div>
                        
                        {/* Reason Input */}
                        <div>
                          <Label htmlFor={`reason-${product.id}`} className="text-sm font-medium">
                            Reason (Optional)
                          </Label>
                          <Input
                            id={`reason-${product.id}`}
                            placeholder="e.g., Supplier delivery"
                            value={restockItem?.reason || ''}
                            onChange={(e) => handleReasonChange(product.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        {/* Summary */}
                        <div className="flex items-center justify-center lg:justify-start">
                          <div className="text-center lg:text-left">
                            <p className="text-sm font-medium text-gray-900">
                              {currentQuantity > product.quantity ? '+' : ''}{currentQuantity - product.quantity}
                            </p>
                            <p className="text-xs text-gray-500">items to add</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          {selectedProductsList.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-3">Restock Summary</h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Products:</span>
                  <span className="ml-1 font-medium">{selectedProductsList.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Total Items to Add:</span>
                  <span className="ml-1 font-medium">
                    {selectedProductsList.reduce((total, product) => {
                      const restockItem = restockItems.find(item => item.product_id === product.id);
                      const newQuantity = restockItem?.new_quantity || product.quantity;
                      return total + Math.max(0, newQuantity - product.quantity);
                    }, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Out of Stock:</span>
                  <span className="ml-1 font-medium">
                    {selectedProductsList.filter(p => p.quantity === 0).length}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Low Stock:</span>
                  <span className="ml-1 font-medium">
                    {selectedProductsList.filter(p => p.quantity > 0 && p.quantity <= p.low_stock_threshold).length}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedProducts.size === 0 || isSubmitting}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 order-1 sm:order-2"
          >
            {isSubmitting ? 'Restocking...' : `Restock ${selectedProducts.size} Products`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BulkRestockModal;
