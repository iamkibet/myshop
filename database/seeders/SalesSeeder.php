<?php

namespace Database\Seeders;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Seeder;

class SalesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all managers
        $managers = User::where('role', 'manager')->get();

        if ($managers->isEmpty()) {
            $this->command->warn('No managers found. Creating sales with first user.');
            $managers = User::take(1)->get();
        }

        // Get all product variants
        $variants = ProductVariant::with('product')->get();

        if ($variants->isEmpty()) {
            $this->command->warn('No product variants found. Skipping sales seeding.');
            return;
        }

        // Create 50 sales with realistic data
        for ($i = 0; $i < 50; $i++) {
            $this->createSale($managers->random(), $variants);
        }

        $this->command->info('Created 50 sales with comprehensive data.');
    }

    /**
     * Create a single sale with multiple items
     */
    private function createSale(User $manager, $variants): void
    {
        // Random date within last 30 days
        $saleDate = now()->subDays(rand(0, 30))->subHours(rand(0, 23))->subMinutes(rand(0, 59));

        // Create sale
        $sale = Sale::create([
            'manager_id' => $manager->id,
            'total_amount' => 0, // Will be calculated after items
            'created_at' => $saleDate,
            'updated_at' => $saleDate,
        ]);

        // Add 1-5 items to the sale
        $numberOfItems = rand(1, 5);
        $totalAmount = 0;
        $selectedVariants = $variants->random($numberOfItems);

        foreach ($selectedVariants as $variant) {
            $quantity = rand(1, 5);
            $unitPrice = $variant->selling_price;
            $totalPrice = $unitPrice * $quantity;
            $totalAmount += $totalPrice;

            // Create sale item
            SaleItem::create([
                'sale_id' => $sale->id,
                'product_variant_id' => $variant->id,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'total_price' => $totalPrice,
            ]);

            // Reduce stock (but don't go below 0)
            $newQuantity = max(0, $variant->quantity - $quantity);
            $variant->update(['quantity' => $newQuantity]);
        }

        // Update sale with total amount
        $sale->update(['total_amount' => $totalAmount]);
    }
}
