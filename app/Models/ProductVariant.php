<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'color',
        'size',
        'sku',
        'quantity',
        'cost_price',
        'selling_price',
        'discount_price',
        'image_url',
        'is_active',
        'low_stock_threshold',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'selling_price' => 'decimal:2',
        'discount_price' => 'decimal:2',
        'quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the product that owns the variant.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the sale items for this variant.
     */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Check if the variant is in stock.
     */
    public function isInStock(): bool
    {
        return $this->quantity > 0;
    }

    /**
     * Check if the variant is low in stock.
     */
    public function isLowStock(): bool
    {
        return $this->quantity <= $this->low_stock_threshold;
    }

    /**
     * Get the current price (discount price if available, otherwise selling price).
     */
    public function getCurrentPrice(): float
    {
        return $this->discount_price ?? $this->selling_price;
    }

    /**
     * Get the variant name with color and size.
     */
    public function getVariantName(): string
    {
        $parts = [];
        
        if ($this->color) {
            $parts[] = $this->color;
        }
        
        if ($this->size) {
            $parts[] = $this->size;
        }
        
        return implode(' - ', $parts) ?: 'Default';
    }

    /**
     * Generate SKU automatically if not provided.
     */
    public static function generateSku(Product $product, ?string $color = null, ?string $size = null): string
    {
        $base = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $product->name));
        $parts = [$base];
        
        if ($color) {
            $parts[] = strtoupper(substr($color, 0, 3));
        }
        
        if ($size) {
            $parts[] = strtoupper($size);
        }
        
        $sku = implode('-', $parts);
        
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
     * Scope for active variants.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for in-stock variants.
     */
    public function scopeInStock($query)
    {
        return $query->where('quantity', '>', 0);
    }

    /**
     * Scope for low stock variants.
     */
    public function scopeLowStock($query)
    {
        return $query->whereRaw('quantity <= low_stock_threshold');
    }
}
