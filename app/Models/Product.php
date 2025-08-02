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
        'sku',
        'description',
        'brand',
        'category',
        'cost_price',
        'msrp',
        'quantity_on_hand',
        'low_stock_threshold',
        'images',
        'sizes',
        'colors',
        'is_active',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'msrp' => 'decimal:2',
        'quantity_on_hand' => 'integer',
        'low_stock_threshold' => 'integer',
        'images' => 'array',
        'sizes' => 'array',
        'colors' => 'array',
        'is_active' => 'boolean',
    ];

    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function isInStock(): bool
    {
        return $this->quantity_on_hand > 0;
    }

    public function hasStock(int $quantity = 1): bool
    {
        return $this->quantity_on_hand >= $quantity;
    }

    public function isLowStock(): bool
    {
        return $this->quantity_on_hand <= $this->low_stock_threshold;
    }

    public function isOutOfStock(): bool
    {
        return $this->quantity_on_hand === 0;
    }

    public function getStockStatus(): string
    {
        if ($this->isOutOfStock()) {
            return 'out_of_stock';
        }

        if ($this->isLowStock()) {
            return 'low_stock';
        }

        return 'in_stock';
    }

    public function getStockStatusColor(): string
    {
        return match ($this->getStockStatus()) {
            'out_of_stock' => 'destructive',
            'low_stock' => 'warning',
            default => 'default',
        };
    }

    public function getMainImage(): ?string
    {
        return $this->images[0] ?? null;
    }

    public function getAvailableSizes(): array
    {
        return $this->sizes ?? [];
    }

    public function getAvailableColors(): array
    {
        return $this->colors ?? [];
    }
}
