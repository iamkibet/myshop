<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sale_id',
        'product_variant_id',
        'quantity',
        'unit_price',
        'total_price',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    /**
     * Get the sale that owns the item.
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the product variant for this item.
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * Get the product through the variant.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'id', 'product_variants');
    }

    /**
     * Calculate total price before saving.
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($saleItem) {
            if (!$saleItem->total_price) {
                $saleItem->total_price = $saleItem->quantity * $saleItem->unit_price;
            }
        });

        static::updating(function ($saleItem) {
            if ($saleItem->isDirty('quantity') || $saleItem->isDirty('unit_price')) {
                $saleItem->total_price = $saleItem->quantity * $saleItem->unit_price;
            }
        });
    }
} 