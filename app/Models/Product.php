<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'brand',
        'category',
        'image_url',
        'features',
        'meta_title',
        'meta_description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'features' => 'array',
    ];

    /**
     * Get the variants for the product.
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Get active variants for the product.
     */
    public function activeVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->active();
    }

    /**
     * Get in-stock variants for the product.
     */
    public function inStockVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->active()->inStock();
    }

    /**
     * Get low stock variants for the product.
     */
    public function lowStockVariants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->active()->lowStock();
    }

    /**
     * Get the total quantity across all variants.
     */
    public function getTotalQuantity(): int
    {
        return $this->variants()->sum('quantity');
    }

    /**
     * Get the minimum price across all variants.
     */
    public function getMinPrice(): float
    {
        return $this->variants()->active()->min('selling_price') ?? 0;
    }

    /**
     * Get the maximum price across all variants.
     */
    public function getMaxPrice(): float
    {
        return $this->variants()->active()->max('selling_price') ?? 0;
    }

    /**
     * Check if the product has any variants in stock.
     */
    public function hasStock(): bool
    {
        return $this->variants()->active()->where('quantity', '>', 0)->exists();
    }

    /**
     * Get available colors for this product.
     */
    public function getAvailableColors(): array
    {
        return $this->variants()
            ->active()
            ->whereNotNull('color')
            ->distinct()
            ->pluck('color')
            ->toArray();
    }

    /**
     * Get available sizes for this product.
     */
    public function getAvailableSizes(): array
    {
        return $this->variants()
            ->active()
            ->whereNotNull('size')
            ->distinct()
            ->pluck('size')
            ->toArray();
    }

    /**
     * Scope for active products.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope for products with stock.
     */
    public function scopeInStock($query)
    {
        return $query->whereHas('variants', function ($q) {
            $q->active()->where('quantity', '>', 0);
        });
    }
}
