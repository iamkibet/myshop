<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'description',
        'brand',
        'image_url',
        'features',
        'sku',
        'quantity',
        'cost_price',
        'selling_price',
        'discount_price',
        'low_stock_threshold',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'is_active' => 'boolean',
        'features' => 'array',
    ];

    /**
     * Auto-generate SKU if not provided
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($product) {
            if (empty($product->sku)) {
                $product->sku = static::generateSku($product->name, $product->category);
            }
        });
    }

    /**
     * Generate unique SKU
     */
    public static function generateSku(string $name, string $category): string
    {
        $base = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $name));
        $categoryCode = strtoupper(substr(preg_replace('/[^A-Za-z]/', '', $category), 0, 3));
        $sku = $base . '-' . $categoryCode . '-' . strtoupper(Str::random(4));
        
        // Ensure uniqueness
        $counter = 1;
        $originalSku = $sku;
        while (static::where('sku', $sku)->exists()) {
            $sku = $originalSku . '-' . $counter;
            $counter++;
        }
        
        return $sku;
    }

    /**
     * Get current price (discount price if available, otherwise selling price)
     */
    public function getCurrentPrice(): float
    {
        return $this->discount_price ?? $this->selling_price;
    }

    /**
     * Check if product is in stock
     */
    public function isInStock(): bool
    {
        return $this->quantity > 0;
    }

    /**
     * Check if product is low in stock
     */
    public function isLowStock(): bool
    {
        return $this->quantity > 0 && $this->quantity <= $this->low_stock_threshold;
    }

    /**
     * Get stock status
     */
    public function getStockStatus(): string
    {
        if ($this->quantity === 0) return 'out_of_stock';
        if ($this->isLowStock()) return 'low_stock';
        return 'in_stock';
    }

    /**
     * Get stock status with color for UI
     */
    public function getStockStatusWithColor(): array
    {
        $status = $this->getStockStatus();
        
        switch ($status) {
            case 'out_of_stock':
                return ['status' => 'Out of Stock', 'color' => 'destructive'];
            case 'low_stock':
                return ['status' => 'Low Stock', 'color' => 'secondary'];
            default:
                return ['status' => 'In Stock', 'color' => 'default'];
        }
    }

    /**
     * Calculate profit margin
     */
    public function getProfitMargin(): float
    {
        if ($this->cost_price <= 0) return 0;
        return (($this->selling_price - $this->cost_price) / $this->cost_price) * 100;
    }

    /**
     * Calculate profit amount
     */
    public function getProfitAmount(): float
    {
        return $this->selling_price - $this->cost_price;
    }

    /**
     * Get sales for this product
     */
    public function sales(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Scope for active products
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for in-stock products
     */
    public function scopeInStock(Builder $query): Builder
    {
        return $query->where('quantity', '>', 0);
    }

    /**
     * Scope for low stock products
     */
    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereRaw('quantity <= low_stock_threshold');
    }

    /**
     * Scope for out of stock products
     */
    public function scopeOutOfStock(Builder $query): Builder
    {
        return $query->where('quantity', 0);
    }

    /**
     * Scope for products by category
     */
    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    /**
     * Scope for products by brand
     */
    public function scopeByBrand(Builder $query, string $brand): Builder
    {
        return $query->where('brand', $brand);
    }

    /**
     * Scope for products within price range
     */
    public function scopePriceRange(Builder $query, float $min, float $max): Builder
    {
        return $query->whereBetween('selling_price', [$min, $max]);
    }

    /**
     * Scope for products with discount
     */
    public function scopeWithDiscount(Builder $query): Builder
    {
        return $query->whereNotNull('discount_price');
    }

    /**
     * Scope for products by stock level
     */
    public function scopeByStockLevel(Builder $query, string $level): Builder
    {
        switch ($level) {
            case 'low':
                return $query->lowStock();
            case 'out':
                return $query->outOfStock();
            case 'in':
                return $query->inStock();
            default:
                return $query;
        }
    }

    /**
     * Get formatted price range for display
     */
    public function getFormattedPriceRange(): string
    {
        if ($this->discount_price) {
            return sprintf(
                '%s - %s',
                number_format($this->discount_price, 2),
                number_format($this->selling_price, 2)
            );
        }
        
        return number_format($this->selling_price, 2);
    }

    /**
     * Check if product has discount
     */
    public function hasDiscount(): bool
    {
        return !is_null($this->discount_price) && $this->discount_price < $this->selling_price;
    }

    /**
     * Get discount percentage
     */
    public function getDiscountPercentage(): float
    {
        if (!$this->hasDiscount()) return 0;
        return round((($this->selling_price - $this->discount_price) / $this->selling_price) * 100, 1);
    }

    /**
     * Get available categories
     */
    public static function getAvailableCategories(): array
    {
        return static::distinct()
            ->whereNotNull('category')
            ->pluck('category')
            ->sort()
            ->values()
            ->toArray();
    }

    /**
     * Get available brands
     */
    public static function getAvailableBrands(): array
    {
        return static::distinct()
            ->whereNotNull('brand')
            ->pluck('brand')
            ->sort()
            ->values()
            ->toArray();
    }

    /**
     * Get products by category with count
     */
    public static function getProductsByCategory(): array
    {
        return static::selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->orderBy('count', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Get low stock products for alerts
     */
    public static function getLowStockProducts(int $limit = 10): array
    {
        return static::lowStock()
            ->orderBy('quantity')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get out of stock products
     */
    public static function getOutOfStockProducts(int $limit = 10): array
    {
        return static::outOfStock()
            ->orderBy('updated_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get the product's image URL with proper formatting
     */
    public function getImageUrlAttribute($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        // If it's already a full URL, return as is
        if (filter_var($value, FILTER_VALIDATE_URL)) {
            return $value;
        }

        // If it's a storage path, make it absolute
        if (str_starts_with($value, '/storage/')) {
            return config('app.url') . $value;
        }

        // If it's stored as a relative path without leading slash, add it
        return config('app.url') . '/' . ltrim($value, '/');
    }

    /**
     * Get the raw image URL value from database
     */
    public function getRawImageUrlAttribute(): ?string
    {
        return $this->attributes['image_url'] ?? null;
    }

    /**
     * Check if product has an image
     */
    public function hasImage(): bool
    {
        return !empty($this->attributes['image_url']);
    }

    /**
     * Get a placeholder image URL
     */
    public function getPlaceholderImageUrl(): string
    {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04MCAxMDBDODAgODkuNTQ0NCA4OS41NDQ0IDgwIDEwMCA4MEMxMTAuNDU2IDgwIDEyMCA4OS41NDQ0IDEyMCAxMEMxMjAgMTEwLjQ1NiAxMTAuNDU2IDEyMCAxMDAgMTIwQzg5LjU0NDQgMTIwIDgwIDExMC40NTYgODAgMTAwWiIgZmlsbD0iI0QxRDVFM0EiLz4KPC9zdmc+';
    }
}
