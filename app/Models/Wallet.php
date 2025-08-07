<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Wallet extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'balance',
        'total_earned',
        'total_paid_out',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'balance' => 'decimal:2',
            'total_earned' => 'decimal:2',
            'total_paid_out' => 'decimal:2',
        ];
    }

    /**
     * Get the user who owns this wallet.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the payouts for this wallet.
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(Payout::class, 'user_id', 'user_id');
    }

    /**
     * Calculate commission for a sale amount.
     */
    public static function calculateCommission(float $saleAmount): float
    {
        // 6% commission (300/5000 = 0.06)
        return $saleAmount * 0.06;
    }

    /**
     * Add earnings to wallet.
     */
    public function addEarnings(float $amount): void
    {
        $this->increment('balance', $amount);
        $this->increment('total_earned', $amount);
    }

    /**
     * Process payout and reduce balance.
     */
    public function processPayout(float $amount): void
    {
        if ($this->balance >= $amount) {
            $this->decrement('balance', $amount);
            $this->increment('total_paid_out', $amount);
        }
    }
}
