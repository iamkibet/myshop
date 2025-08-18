<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Events\Created;

class Sale extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'manager_id',
        'total_amount',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
        ];
    }

    /**
     * Get the manager who made this sale.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get the sale items for this sale.
     */
    public function saleItems(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Boot the model and register events.
     */
    protected static function boot()
    {
        parent::boot();

        static::created(function ($sale) {
            // Calculate commission and add to manager's wallet
            $commission = Wallet::calculateCommission($sale->total_amount);

            // Get or create wallet for the manager
            $wallet = Wallet::firstOrCreate(
                ['user_id' => $sale->manager_id],
                ['balance' => 0, 'total_earned' => 0, 'total_paid_out' => 0, 'paid_sales' => 0]
            );

            // Add commission to wallet
            $wallet->addEarnings($commission);
        });
    }
}
