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
                'name' => 'Nike Air Max 270',
                'description' => 'The Nike Air Max 270 delivers unrivaled, all-day comfort. The revolutionary Air unit under the heel provides incredible, lightweight cushioning.',
                'brand' => 'Nike',
                'category' => 'Shoes',
                'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                'features' => ['Air Max technology', 'Breathable mesh', 'Rubber outsole'],
                'meta_title' => 'Nike Air Max 270 - Comfortable Running Shoes',
                'meta_description' => 'Get the ultimate comfort with Nike Air Max 270 running shoes. Features Air Max technology and breathable mesh upper.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Black',
                        'size' => 'US 9',
                        'sku' => 'NIKE-AM270-BLK-9',
                        'quantity' => 15,
                        'cost_price' => 89.99,
                        'selling_price' => 129.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'White',
                        'size' => 'US 9',
                        'sku' => 'NIKE-AM270-WHT-9',
                        'quantity' => 8,
                        'cost_price' => 89.99,
                        'selling_price' => 129.99,
                        'discount_price' => 119.99,
                        'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'Black',
                        'size' => 'US 10',
                        'sku' => 'NIKE-AM270-BLK-10',
                        'quantity' => 12,
                        'cost_price' => 89.99,
                        'selling_price' => 129.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                ],
            ],
            [
                'name' => 'Adidas Ultraboost 21',
                'description' => 'The Adidas Ultraboost 21 features responsive Boost midsole and a Primeknit+ upper for a sock-like fit.',
                'brand' => 'Adidas',
                'category' => 'Shoes',
                'image_url' => 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
                'features' => ['Boost midsole', 'Primeknit+ upper', 'Continental rubber outsole'],
                'meta_title' => 'Adidas Ultraboost 21 - Premium Running Shoes',
                'meta_description' => 'Experience ultimate performance with Adidas Ultraboost 21. Features Boost midsole and Primeknit+ upper.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Blue',
                        'size' => 'US 9',
                        'sku' => 'ADIDAS-UB21-BLU-9',
                        'quantity' => 10,
                        'cost_price' => 129.99,
                        'selling_price' => 179.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'Blue',
                        'size' => 'US 10',
                        'sku' => 'ADIDAS-UB21-BLU-10',
                        'quantity' => 3,
                        'cost_price' => 129.99,
                        'selling_price' => 179.99,
                        'discount_price' => 159.99,
                        'image_url' => 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                ],
            ],
            [
                'name' => 'Cotton T-Shirt',
                'description' => 'Comfortable cotton t-shirt perfect for everyday wear. Available in multiple colors and sizes.',
                'brand' => 'Basic',
                'category' => 'T-Shirts',
                'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                'features' => ['100% cotton', 'Breathable', 'Machine washable'],
                'meta_title' => 'Cotton T-Shirt - Comfortable Everyday Wear',
                'meta_description' => 'Comfortable cotton t-shirt perfect for everyday wear. Available in multiple colors and sizes.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'White',
                        'size' => 'M',
                        'sku' => 'BASIC-TS-WHT-M',
                        'quantity' => 25,
                        'cost_price' => 8.99,
                        'selling_price' => 19.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 10,
                    ],
                    [
                        'color' => 'Black',
                        'size' => 'M',
                        'sku' => 'BASIC-TS-BLK-M',
                        'quantity' => 20,
                        'cost_price' => 8.99,
                        'selling_price' => 19.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 10,
                    ],
                    [
                        'color' => 'White',
                        'size' => 'L',
                        'sku' => 'BASIC-TS-WHT-L',
                        'quantity' => 15,
                        'cost_price' => 8.99,
                        'selling_price' => 19.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 10,
                    ],
                ],
            ],
            [
                'name' => 'Denim Jeans',
                'description' => 'Classic denim jeans with a comfortable fit. Perfect for casual and semi-formal occasions.',
                'brand' => 'Levi\'s',
                'category' => 'Pants',
                'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
                'features' => ['100% cotton denim', 'Classic fit', 'Five-pocket design'],
                'meta_title' => 'Denim Jeans - Classic Comfortable Fit',
                'meta_description' => 'Classic denim jeans with a comfortable fit. Perfect for casual and semi-formal occasions.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Blue',
                        'size' => '32x32',
                        'sku' => 'LEVIS-DJ-BLU-32x32',
                        'quantity' => 12,
                        'cost_price' => 29.99,
                        'selling_price' => 59.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'Blue',
                        'size' => '34x32',
                        'sku' => 'LEVIS-DJ-BLU-34x32',
                        'quantity' => 8,
                        'cost_price' => 29.99,
                        'selling_price' => 59.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                ],
            ],
            [
                'name' => 'Wireless Headphones',
                'description' => 'Premium wireless headphones with noise cancellation and long battery life.',
                'brand' => 'Sony',
                'category' => 'Electronics',
                'image_url' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                'features' => ['Noise cancellation', '30-hour battery life', 'Bluetooth 5.0'],
                'meta_title' => 'Wireless Headphones - Premium Audio Experience',
                'meta_description' => 'Premium wireless headphones with noise cancellation and long battery life.',
                'is_active' => true,
                'variants' => [
                    [
                        'color' => 'Black',
                        'size' => null,
                        'sku' => 'SONY-WH-BLK',
                        'quantity' => 18,
                        'cost_price' => 199.99,
                        'selling_price' => 299.99,
                        'discount_price' => null,
                        'image_url' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
                    ],
                    [
                        'color' => 'White',
                        'size' => null,
                        'sku' => 'SONY-WH-WHT',
                        'quantity' => 5,
                        'cost_price' => 199.99,
                        'selling_price' => 299.99,
                        'discount_price' => 279.99,
                        'image_url' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
                        'is_active' => true,
                        'low_stock_threshold' => 5,
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
