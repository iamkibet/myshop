<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommissionRate extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'sales_threshold',
        'commission_amount',
        'is_active',
        'description',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sales_threshold' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Scope to get active commission rates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to order by sales threshold ascending.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sales_threshold', 'asc');
    }

    /**
     * Calculate commission for a given sales amount.
     */
    public static function calculateCommission(float $salesAmount): float
    {
        $commission = 0;
        
        // Get all active commission rates ordered by threshold
        $rates = self::active()->ordered()->get();
        
        foreach ($rates as $rate) {
            if ($salesAmount >= $rate->sales_threshold) {
                // Calculate how many times this threshold is met
                $multiplier = floor($salesAmount / $rate->sales_threshold);
                $commission += $rate->commission_amount * $multiplier;
                
                // Reduce the sales amount for the next calculation
                $salesAmount -= ($rate->sales_threshold * $multiplier);
            }
        }
        
        return $commission;
    }

    /**
     * Get the next commission threshold for a given sales amount.
     */
    public static function getNextThreshold(float $currentSales): ?float
    {
        $nextRate = self::active()
            ->where('sales_threshold', '>', $currentSales)
            ->ordered()
            ->first();
            
        return $nextRate ? $nextRate->sales_threshold : null;
    }

    /**
     * Get commission breakdown for a given sales amount.
     */
    public static function getCommissionBreakdown(float $salesAmount): array
    {
        $breakdown = [];
        $remainingSales = $salesAmount;
        $totalCommission = 0;
        
        $rates = self::active()->ordered()->get();
        
        foreach ($rates as $rate) {
            if ($remainingSales >= $rate->sales_threshold) {
                $multiplier = floor($remainingSales / $rate->sales_threshold);
                $commissionForThisRate = $rate->commission_amount * $multiplier;
                
                $breakdown[] = [
                    'threshold' => $rate->sales_threshold,
                    'commission_per_threshold' => $rate->commission_amount,
                    'multiplier' => $multiplier,
                    'commission_earned' => $commissionForThisRate,
                    'description' => $rate->description,
                ];
                
                $totalCommission += $commissionForThisRate;
                $remainingSales -= ($rate->sales_threshold * $multiplier);
            }
        }
        
        return [
            'breakdown' => $breakdown,
            'total_commission' => $totalCommission,
            'remaining_sales' => $remainingSales,
        ];
    }
}
