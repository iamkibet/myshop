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
                'description' => 'High-performance laptop for work and gaming',
                'brand' => 'TechCorp',
                'category' => 'Electronics',
                'cost_price' => 800.00,
                'msrp' => 1200.00,
                'quantity_on_hand' => 15,
                'low_stock_threshold' => 5,
                'images' => [
                    'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
                    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'
                ],
                'sizes' => ['13"', '15"', '17"'],
                'colors' => ['Silver', 'Black', 'Space Gray'],
                'is_active' => true,
            ],
            [
                'name' => 'Wireless Headphones',
                'sku' => 'AUD-001',
                'description' => 'Premium wireless headphones with noise cancellation',
                'brand' => 'SoundMax',
                'category' => 'Electronics',
                'cost_price' => 150.00,
                'msrp' => 299.00,
                'quantity_on_hand' => 25,
                'low_stock_threshold' => 10,
                'images' => [
                    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
                ],
                'sizes' => ['One Size'],
                'colors' => ['Black', 'White', 'Blue'],
                'is_active' => true,
            ],
            [
                'name' => 'Running Shoes',
                'sku' => 'SHO-001',
                'description' => 'Comfortable running shoes for all terrains',
                'brand' => 'SportFlex',
                'category' => 'Shoes',
                'cost_price' => 45.00,
                'msrp' => 89.99,
                'quantity_on_hand' => 8,
                'low_stock_threshold' => 10,
                'images' => [
                    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400'
                ],
                'sizes' => ['7', '8', '9', '10', '11', '12'],
                'colors' => ['White', 'Black', 'Red', 'Blue'],
                'is_active' => true,
            ],
            [
                'name' => 'Cotton T-Shirt',
                'sku' => 'TSH-001',
                'description' => 'Premium cotton t-shirt with comfortable fit',
                'brand' => 'FashionCo',
                'category' => 'T-Shirts',
                'cost_price' => 12.00,
                'msrp' => 24.99,
                'quantity_on_hand' => 50,
                'low_stock_threshold' => 15,
                'images' => [
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'
                ],
                'sizes' => ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                'colors' => ['White', 'Black', 'Gray', 'Navy', 'Red'],
                'is_active' => true,
            ],
            [
                'name' => 'Denim Jeans',
                'sku' => 'JEA-001',
                'description' => 'Classic denim jeans with modern fit',
                'brand' => 'DenimStyle',
                'category' => 'Pants',
                'cost_price' => 25.00,
                'msrp' => 59.99,
                'quantity_on_hand' => 3,
                'low_stock_threshold' => 10,
                'images' => [
                    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'
                ],
                'sizes' => ['28', '30', '32', '34', '36', '38'],
                'colors' => ['Blue', 'Black', 'Gray'],
                'is_active' => true,
            ],
            [
                'name' => 'Smartphone',
                'sku' => 'PHO-001',
                'description' => 'Latest smartphone with advanced features',
                'brand' => 'MobileTech',
                'category' => 'Electronics',
                'cost_price' => 400.00,
                'msrp' => 699.99,
                'quantity_on_hand' => 0,
                'low_stock_threshold' => 5,
                'images' => [
                    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
                ],
                'sizes' => ['One Size'],
                'colors' => ['Black', 'White', 'Gold'],
                'is_active' => true,
            ],
            [
                'name' => 'Coffee Mug',
                'sku' => 'MUG-001',
                'description' => 'Ceramic coffee mug with handle',
                'brand' => 'HomeStyle',
                'category' => 'Home & Garden',
                'cost_price' => 3.50,
                'msrp' => 12.99,
                'quantity_on_hand' => 100,
                'low_stock_threshold' => 20,
                'images' => [
                    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400'
                ],
                'sizes' => ['Standard'],
                'colors' => ['White', 'Black', 'Red', 'Blue'],
                'is_active' => true,
            ],
            [
                'name' => 'Yoga Mat',
                'sku' => 'YOG-001',
                'description' => 'Non-slip yoga mat for home workouts',
                'brand' => 'FitLife',
                'category' => 'Sports',
                'cost_price' => 15.00,
                'msrp' => 29.99,
                'quantity_on_hand' => 12,
                'low_stock_threshold' => 10,
                'images' => [
                    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400'
                ],
                'sizes' => ['Standard', 'Large'],
                'colors' => ['Purple', 'Blue', 'Green', 'Pink'],
                'is_active' => true,
            ],
        ];

        foreach ($products as $productData) {
            Product::create($productData);
        }
    }
}
