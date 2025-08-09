<?php

namespace Database\Seeders;

use App\Models\CommissionRate;
use Illuminate\Database\Seeder;

class CommissionRateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing commission rates
        CommissionRate::truncate();

        // Add default commission rates
        CommissionRate::create([
            'sales_threshold' => 5000,
            'commission_amount' => 300,
            'description' => 'Base commission rate - KSH 300 for every KSH 5,000 in sales',
            'is_active' => true,
        ]);

        CommissionRate::create([
            'sales_threshold' => 10000,
            'commission_amount' => 700,
            'description' => 'Tier 2 commission rate - KSH 700 for every KSH 10,000 in sales',
            'is_active' => true,
        ]);

        CommissionRate::create([
            'sales_threshold' => 20000,
            'commission_amount' => 1500,
            'description' => 'Tier 3 commission rate - KSH 1,500 for every KSH 20,000 in sales',
            'is_active' => true,
        ]);
    }
}
