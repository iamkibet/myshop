<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            [
                'name' => 'Laptop Computer',
                'sku' => 'LAP-001',
                'cost_price' => 800.00,
                'msrp' => 1200.00,
                'quantity_on_hand' => 15,
            ],
            [
                'name' => 'Wireless Mouse',
                'sku' => 'MOU-001',
                'cost_price' => 15.00,
                'msrp' => 25.00,
                'quantity_on_hand' => 50,
            ],
            [
                'name' => 'Mechanical Keyboard',
                'sku' => 'KEY-001',
                'cost_price' => 60.00,
                'msrp' => 100.00,
                'quantity_on_hand' => 25,
            ],
            [
                'name' => 'USB-C Cable',
                'sku' => 'CAB-001',
                'cost_price' => 5.00,
                'msrp' => 12.00,
                'quantity_on_hand' => 100,
            ],
            [
                'name' => 'External Hard Drive',
                'sku' => 'HDD-001',
                'cost_price' => 80.00,
                'msrp' => 150.00,
                'quantity_on_hand' => 20,
            ],
            [
                'name' => 'Webcam',
                'sku' => 'CAM-001',
                'cost_price' => 30.00,
                'msrp' => 60.00,
                'quantity_on_hand' => 30,
            ],
            [
                'name' => 'Bluetooth Headphones',
                'sku' => 'AUD-001',
                'cost_price' => 40.00,
                'msrp' => 80.00,
                'quantity_on_hand' => 40,
            ],
            [
                'name' => 'Monitor Stand',
                'sku' => 'ACC-001',
                'cost_price' => 25.00,
                'msrp' => 45.00,
                'quantity_on_hand' => 35,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }
    }
} 