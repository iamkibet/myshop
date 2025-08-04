<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductVariant;
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
                'name' => 'Premium Cotton T-Shirt',
                'description' => 'High-quality cotton t-shirt with excellent comfort and durability.',
                'brand' => 'FashionCorp',
                'category' => 'T-Shirts',
                'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                'features' => ['100% Cotton', 'Breathable', 'Machine Washable'],
                'meta_title' => 'Premium Cotton T-Shirt - Comfortable & Durable',
                'meta_description' => 'Get the best cotton t-shirt with premium quality and comfort.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Black',
                        'size' => 'S',
                        'sku' => 'PCTS-BLK-S',
                        'quantity' => 50,
                        'cost_price' => 15.00,
                        'selling_price' => 29.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 10,
                    ],
                    [
                        'color' => 'Black',
                        'size' => 'M',
                        'sku' => 'PCTS-BLK-M',
                        'quantity' => 75,
                        'cost_price' => 15.00,
                        'selling_price' => 29.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 10,
                    ],
                    [
                        'color' => 'White',
                        'size' => 'L',
                        'sku' => 'PCTS-WHT-L',
                        'quantity' => 30,
                        'cost_price' => 15.00,
                        'selling_price' => 29.99,
                        'discount_price' => 24.99,
                        'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 10,
                    ],
                ],
            ],
            [
                'name' => 'Classic Denim Jeans',
                'description' => 'Timeless denim jeans with perfect fit and classic styling.',
                'brand' => 'DenimStyle',
                'category' => 'Pants',
                'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
                'features' => ['100% Denim', 'Classic Fit', '5-Pocket Design'],
                'meta_title' => 'Classic Denim Jeans - Timeless Style',
                'meta_description' => 'Classic denim jeans with perfect fit and timeless style.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Blue',
                        'size' => '30',
                        'sku' => 'CDJ-BLU-30',
                        'quantity' => 25,
                        'cost_price' => 25.00,
                        'selling_price' => 59.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'Blue',
                        'size' => '32',
                        'sku' => 'CDJ-BLU-32',
                        'quantity' => 40,
                        'cost_price' => 25.00,
                        'selling_price' => 59.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'Black',
                        'size' => '34',
                        'sku' => 'CDJ-BLK-34',
                        'quantity' => 15,
                        'cost_price' => 25.00,
                        'selling_price' => 59.99,
                        'discount_price' => 49.99,
                        'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                ],
            ],
            [
                'name' => 'Running Shoes Pro',
                'description' => 'Professional running shoes with advanced cushioning technology.',
                'brand' => 'SportMax',
                'category' => 'Shoes',
                'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                'features' => ['Advanced Cushioning', 'Breathable Mesh', 'Lightweight'],
                'meta_title' => 'Running Shoes Pro - Advanced Performance',
                'meta_description' => 'Professional running shoes with advanced cushioning technology.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Red',
                        'size' => '8',
                        'sku' => 'RSP-RED-8',
                        'quantity' => 20,
                        'cost_price' => 45.00,
                        'selling_price' => 89.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'Blue',
                        'size' => '9',
                        'sku' => 'RSP-BLU-9',
                        'quantity' => 35,
                        'cost_price' => 45.00,
                        'selling_price' => 89.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'Black',
                        'size' => '10',
                        'sku' => 'RSP-BLK-10',
                        'quantity' => 8,
                        'cost_price' => 45.00,
                        'selling_price' => 89.99,
                        'discount_price' => 79.99,
                        'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                ],
            ],
            [
                'name' => 'Casual Hoodie',
                'description' => 'Comfortable casual hoodie perfect for everyday wear.',
                'brand' => 'ComfortWear',
                'category' => 'Jackets',
                'image_url' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
                'features' => ['Cotton Blend', 'Kangaroo Pocket', 'Drawstring Hood'],
                'meta_title' => 'Casual Hoodie - Comfortable Everyday Wear',
                'meta_description' => 'Comfortable casual hoodie perfect for everyday wear.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Gray',
                        'size' => 'M',
                        'sku' => 'CH-GRY-M',
                        'quantity' => 45,
                        'cost_price' => 20.00,
                        'selling_price' => 39.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 10,
                    ],
                    [
                        'color' => 'Navy',
                        'size' => 'L',
                        'sku' => 'CH-NAV-L',
                        'quantity' => 30,
                        'cost_price' => 20.00,
                        'selling_price' => 39.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 10,
                    ],
                ],
            ],
            [
                'name' => 'Baseball Cap',
                'description' => 'Classic baseball cap with embroidered logo.',
                'brand' => 'CapStyle',
                'category' => 'Hats',
                'image_url' => 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400',
                'features' => ['Adjustable Strap', 'Embroidered Logo', 'Classic Fit'],
                'meta_title' => 'Baseball Cap - Classic Style',
                'meta_description' => 'Classic baseball cap with embroidered logo.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Red',
                        'size' => null,
                        'sku' => 'BC-RED-ONE',
                        'quantity' => 60,
                        'cost_price' => 8.00,
                        'selling_price' => 19.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 15,
                    ],
                    [
                        'color' => 'Blue',
                        'size' => null,
                        'sku' => 'BC-BLU-ONE',
                        'quantity' => 40,
                        'cost_price' => 8.00,
                        'selling_price' => 19.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 15,
                    ],
                ],
            ],
        ];

        foreach ($products as $productData) {
            $variants = $productData['variants'];
            unset($productData['variants']);

            $product = Product::create($productData);

            foreach ($variants as $variantData) {
                $product->variants()->create($variantData);
            }
        }
    }
}
