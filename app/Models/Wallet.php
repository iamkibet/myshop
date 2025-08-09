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
        'paid_sales',
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
            'paid_sales' => 'decimal:2',
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
     * Calculate commission for a sale amount using commission rates.
     */
    public static function calculateCommission(float $saleAmount): float
    {
        return \App\Models\CommissionRate::calculateCommission($saleAmount);
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

    /**
     * Calculate qualified sales using carry-forward logic.
     * Only removes complete threshold amounts from paid sales.
     */
    public function getQualifiedSales(float $totalSales): float
    {
        // Get all active commission rates ordered by threshold
        $rates = \App\Models\CommissionRate::active()->ordered()->get();
        
        if ($rates->isEmpty()) {
            return $totalSales;
        }

        // Calculate how much sales have been fully paid for
        $fullyPaidSales = 0;
        $remainingPaidSales = $this->paid_sales;
        
        foreach ($rates as $rate) {
            if ($remainingPaidSales >= $rate->sales_threshold) {
                $multiplier = floor($remainingPaidSales / $rate->sales_threshold);
                $fullyPaidSales += $rate->sales_threshold * $multiplier;
                $remainingPaidSales -= $rate->sales_threshold * $multiplier;
            }
        }
        
        // Qualified sales = Total sales - Fully paid sales
        return max(0, $totalSales - $fullyPaidSales);
    }

    /**
     * Calculate commission on qualified sales using carry-forward logic.
     */
    public function getQualifiedCommission(float $totalSales): float
    {
        $qualifiedSales = $this->getQualifiedSales($totalSales);
        return \App\Models\CommissionRate::calculateCommission($qualifiedSales);
    }

    /**
     * Get commission breakdown for qualified sales using carry-forward logic.
     */
    public function getQualifiedCommissionBreakdown(float $totalSales): array
    {
        $qualifiedSales = $this->getQualifiedSales($totalSales);
        return \App\Models\CommissionRate::getCommissionBreakdown($qualifiedSales);
    }

    /**
     * Update paid sales when a payout is processed.
     * This calculates how much sales value the payout represents using carry-forward logic.
     */
    public function updatePaidSales(float $payoutAmount, float $totalSales): void
    {
        // Calculate the commission rate based on current qualified sales
        $qualifiedSales = $this->getQualifiedSales($totalSales);
        $qualifiedCommission = $this->getQualifiedCommission($totalSales);
        
        if ($qualifiedCommission > 0) {
            // Calculate what portion of qualified sales this payout represents
            $salesValueForPayout = ($payoutAmount / $qualifiedCommission) * $qualifiedSales;
            
            // Round down to the nearest complete threshold to ensure carry-forward
            $rates = \App\Models\CommissionRate::active()->ordered()->get();
            $completeThresholds = 0;
            
            foreach ($rates as $rate) {
                if ($salesValueForPayout >= $rate->sales_threshold) {
                    $multiplier = floor($salesValueForPayout / $rate->sales_threshold);
                    $completeThresholds += $rate->sales_threshold * $multiplier;
                    $salesValueForPayout -= $rate->sales_threshold * $multiplier;
                }
            }
            
            // Only increment by complete thresholds
            if ($completeThresholds > 0) {
                $this->increment('paid_sales', $completeThresholds);
            }
        }
    }

    /**
     * Get the carry-forward amount (sales that don't qualify for commission yet).
     */
    public function getCarryForwardAmount(float $totalSales): float
    {
        $qualifiedSales = $this->getQualifiedSales($totalSales);
        return $totalSales - $qualifiedSales;
    }

    /**
     * Get the next milestone amount needed for additional commission.
     */
    public function getNextMilestoneAmount(float $totalSales): float
    {
        $rates = \App\Models\CommissionRate::active()->ordered()->get();
        
        if ($rates->isEmpty()) {
            return 0;
        }

        $qualifiedSales = $this->getQualifiedSales($totalSales);
        
        foreach ($rates as $rate) {
            if ($qualifiedSales < $rate->sales_threshold) {
                return $rate->sales_threshold - $qualifiedSales;
            }
        }
        
        return 0;
    }
}
