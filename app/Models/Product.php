<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'sku',
        'cost_price',
        'msrp',
        'quantity_on_hand',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'cost_price' => 'decimal:2',
            'msrp' => 'decimal:2',
            'quantity_on_hand' => 'integer',
        ];
    }

    /**
     * Get the sale items for this product.
     */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Check if product is in stock.
     */
    public function isInStock(): bool
    {
        return $this->quantity_on_hand > 0;
    }

    /**
     * Check if product has sufficient stock for given quantity.
     */
    public function hasStock(int $quantity): bool
    {
        return $this->quantity_on_hand >= $quantity;
    }
} 