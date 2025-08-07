<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Wallet;
use Illuminate\Database\Seeder;

class WalletSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all managers
        $managers = User::where('role', 'manager')->get();

        foreach ($managers as $manager) {
            // Create wallet for each manager if it doesn't exist
            Wallet::firstOrCreate(
                ['user_id' => $manager->id],
                [
                    'balance' => rand(1000, 5000), // Random balance between 1000-5000
                    'total_earned' => rand(5000, 15000), // Random total earned
                    'total_paid_out' => rand(1000, 8000), // Random total paid out
                ]
            );
        }
    }
}
