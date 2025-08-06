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
        $brands = [
            'Nike',
            'Adidas',
            'Puma',
            'Under Armour',
            'Reebok',
            'New Balance',
            'Converse',
            'Vans',
            'Levi\'s',
            'Calvin Klein',
            'Tommy Hilfiger',
            'Ralph Lauren',
            'Gap',
            'H&M',
            'Zara',
            'Uniqlo',
            'Forever 21',
            'American Eagle',
            'Hollister',
            'Aeropostale'
        ];

        $categories = [
            'T-Shirts',
            'Pants',
            'Shoes',
            'Jackets',
            'Hats',
            'Dresses',
            'Shirts',
            'Shorts',
            'Sweaters',
            'Hoodies',
            'Jeans',
            'Skirts',
            'Blazers',
            'Coats',
            'Sneakers',
            'Boots',
            'Sandals',
            'Slippers',
            'Socks',
            'Underwear'
        ];

        $colors = [
            'Black',
            'White',
            'Red',
            'Blue',
            'Green',
            'Yellow',
            'Purple',
            'Pink',
            'Orange',
            'Brown',
            'Gray',
            'Navy',
            'Maroon',
            'Teal',
            'Coral',
            'Lavender',
            'Olive',
            'Tan',
            'Burgundy',
            'Cyan'
        ];

        $sizes = [
            'XS',
            'S',
            'M',
            'L',
            'XL',
            'XXL',
            'XXXL',
            '6',
            '7',
            '8',
            '9',
            '10',
            '11',
            '12',
            '13',
            '28',
            '30',
            '32',
            '34',
            '36',
            '38',
            '40',
            '42'
        ];

        $products = [
            // Clothing - T-Shirts (10 products)
            [
                'name' => 'Classic Cotton T-Shirt',
                'description' => 'Premium cotton t-shirt with excellent comfort and durability. Perfect for everyday wear.',
                'brand' => 'Nike',
                'category' => 'T-Shirts',
                'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
                'features' => ['100% Cotton', 'Breathable', 'Machine Washable', 'Comfortable Fit'],
                'meta_title' => 'Classic Cotton T-Shirt - Premium Comfort',
                'meta_description' => 'Premium cotton t-shirt with excellent comfort and durability.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Black', 'White', 'Gray'], ['S', 'M', 'L', 'XL'], 'CCT', 15.00, 29.99, 4500),
            ],
            [
                'name' => 'Graphic Print T-Shirt',
                'description' => 'Stylish t-shirt with trendy graphic prints. Made from soft cotton blend.',
                'brand' => 'Adidas',
                'category' => 'T-Shirts',
                'image_url' => 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400',
                'features' => ['Cotton Blend', 'Graphic Print', 'Trendy Design', 'Comfortable'],
                'meta_title' => 'Graphic Print T-Shirt - Trendy Design',
                'meta_description' => 'Stylish t-shirt with trendy graphic prints.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Black', 'White', 'Red'], ['S', 'M', 'L'], 'GPT', 18.00, 34.99, 3800),
            ],
            [
                'name' => 'V-Neck T-Shirt',
                'description' => 'Elegant V-neck t-shirt perfect for layering or casual wear.',
                'brand' => 'Calvin Klein',
                'category' => 'T-Shirts',
                'image_url' => 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
                'features' => ['V-Neck Design', 'Premium Cotton', 'Slim Fit', 'Versatile'],
                'meta_title' => 'V-Neck T-Shirt - Elegant Design',
                'meta_description' => 'Elegant V-neck t-shirt perfect for layering.',
                'is_active' => true,
                'variants' => $this->generateVariants(['White', 'Black', 'Navy'], ['S', 'M', 'L', 'XL'], 'VNT', 20.00, 39.99, 3200),
            ],
            [
                'name' => 'Polo T-Shirt',
                'description' => 'Classic polo t-shirt with collar design. Perfect for business casual.',
                'brand' => 'Ralph Lauren',
                'category' => 'T-Shirts',
                'image_url' => 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
                'features' => ['Collar Design', 'Pique Fabric', 'Business Casual', 'Durable'],
                'meta_title' => 'Polo T-Shirt - Classic Design',
                'meta_description' => 'Classic polo t-shirt with collar design.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Navy', 'Red', 'White'], ['S', 'M', 'L'], 'PLT', 25.00, 49.99, 2800),
            ],
            [
                'name' => 'Long Sleeve T-Shirt',
                'description' => 'Comfortable long sleeve t-shirt for cooler weather.',
                'brand' => 'Gap',
                'category' => 'T-Shirts',
                'image_url' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
                'features' => ['Long Sleeve', 'Cotton Blend', 'Warm', 'Comfortable'],
                'meta_title' => 'Long Sleeve T-Shirt - Warm Comfort',
                'meta_description' => 'Comfortable long sleeve t-shirt for cooler weather.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Gray', 'Black', 'Navy'], ['S', 'M', 'L', 'XL'], 'LST', 22.00, 44.99, 2500),
            ],

            // Pants (10 products)
            [
                'name' => 'Classic Denim Jeans',
                'description' => 'Timeless denim jeans with perfect fit and classic styling.',
                'brand' => 'Levi\'s',
                'category' => 'Pants',
                'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
                'features' => ['100% Denim', 'Classic Fit', '5-Pocket Design', 'Durable'],
                'meta_title' => 'Classic Denim Jeans - Timeless Style',
                'meta_description' => 'Timeless denim jeans with perfect fit.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Blue', 'Black', 'Gray'], ['30', '32', '34', '36'], 'CDJ', 35.00, 79.99, 1800),
            ],
            [
                'name' => 'Chino Pants',
                'description' => 'Versatile chino pants perfect for casual and business wear.',
                'brand' => 'Dockers',
                'category' => 'Pants',
                'image_url' => 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400',
                'features' => ['Cotton Chino', 'Versatile', 'Comfortable', 'Wrinkle Resistant'],
                'meta_title' => 'Chino Pants - Versatile Style',
                'meta_description' => 'Versatile chino pants for casual and business wear.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Khaki', 'Navy', 'Olive'], ['30', '32', '34'], 'CHP', 30.00, 69.99, 1500),
            ],
            [
                'name' => 'Cargo Pants',
                'description' => 'Functional cargo pants with multiple pockets for storage.',
                'brand' => 'Dickies',
                'category' => 'Pants',
                'image_url' => 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400',
                'features' => ['Multiple Pockets', 'Durable Fabric', 'Comfortable Fit', 'Functional'],
                'meta_title' => 'Cargo Pants - Functional Design',
                'meta_description' => 'Functional cargo pants with multiple pockets.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Olive', 'Black', 'Tan'], ['30', '32', '34', '36'], 'CRP', 28.00, 59.99, 1200),
            ],
            [
                'name' => 'Slim Fit Jeans',
                'description' => 'Modern slim fit jeans with contemporary styling.',
                'brand' => 'American Eagle',
                'category' => 'Pants',
                'image_url' => 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400',
                'features' => ['Slim Fit', 'Stretch Denim', 'Modern Style', 'Comfortable'],
                'meta_title' => 'Slim Fit Jeans - Modern Style',
                'meta_description' => 'Modern slim fit jeans with contemporary styling.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Blue', 'Black', 'Gray'], ['30', '32', '34'], 'SFJ', 32.00, 74.99, 1600),
            ],
            [
                'name' => 'Jogger Pants',
                'description' => 'Comfortable jogger pants with elastic cuffs and drawstring waist.',
                'brand' => 'Nike',
                'category' => 'Pants',
                'image_url' => 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400',
                'features' => ['Elastic Cuffs', 'Drawstring Waist', 'Comfortable', 'Athletic Fit'],
                'meta_title' => 'Jogger Pants - Comfortable Style',
                'meta_description' => 'Comfortable jogger pants with elastic cuffs.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Gray', 'Black', 'Navy'], ['S', 'M', 'L', 'XL'], 'JGP', 25.00, 54.99, 2000),
            ],

            // Shoes (10 products)
            [
                'name' => 'Running Shoes Pro',
                'description' => 'Professional running shoes with advanced cushioning technology.',
                'brand' => 'Nike',
                'category' => 'Shoes',
                'image_url' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
                'features' => ['Advanced Cushioning', 'Breathable Mesh', 'Lightweight', 'Performance'],
                'meta_title' => 'Running Shoes Pro - Advanced Performance',
                'meta_description' => 'Professional running shoes with advanced cushioning.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Red', 'Blue', 'Black'], ['8', '9', '10', '11'], 'RSP', 60.00, 129.99, 800),
            ],
            [
                'name' => 'Casual Sneakers',
                'description' => 'Versatile casual sneakers perfect for everyday wear.',
                'brand' => 'Adidas',
                'category' => 'Shoes',
                'image_url' => 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400',
                'features' => ['Casual Design', 'Comfortable', 'Versatile', 'Durable'],
                'meta_title' => 'Casual Sneakers - Everyday Comfort',
                'meta_description' => 'Versatile casual sneakers for everyday wear.',
                'is_active' => true,
                'variants' => $this->generateVariants(['White', 'Black', 'Gray'], ['7', '8', '9', '10'], 'CSN', 45.00, 89.99, 1200),
            ],
            [
                'name' => 'Leather Boots',
                'description' => 'Premium leather boots with classic styling and durability.',
                'brand' => 'Timberland',
                'category' => 'Shoes',
                'image_url' => 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
                'features' => ['Premium Leather', 'Classic Design', 'Durable', 'Waterproof'],
                'meta_title' => 'Leather Boots - Premium Quality',
                'meta_description' => 'Premium leather boots with classic styling.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Brown', 'Black', 'Tan'], ['8', '9', '10', '11'], 'LBT', 80.00, 159.99, 600),
            ],
            [
                'name' => 'Slip-on Loafers',
                'description' => 'Comfortable slip-on loafers for casual and business wear.',
                'brand' => 'Cole Haan',
                'category' => 'Shoes',
                'image_url' => 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400',
                'features' => ['Slip-on Design', 'Comfortable', 'Versatile', 'Classic'],
                'meta_title' => 'Slip-on Loafers - Comfortable Style',
                'meta_description' => 'Comfortable slip-on loafers for casual wear.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Brown', 'Black', 'Tan'], ['8', '9', '10'], 'SLL', 55.00, 109.99, 900),
            ],
            [
                'name' => 'Athletic Sandals',
                'description' => 'Comfortable athletic sandals for outdoor activities.',
                'brand' => 'Teva',
                'category' => 'Shoes',
                'image_url' => 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
                'features' => ['Athletic Design', 'Comfortable', 'Outdoor Ready', 'Durable'],
                'meta_title' => 'Athletic Sandals - Outdoor Comfort',
                'meta_description' => 'Comfortable athletic sandals for outdoor activities.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Black', 'Gray', 'Blue'], ['7', '8', '9', '10'], 'ATS', 25.00, 49.99, 1500),
            ],

            // Jackets (10 products)
            [
                'name' => 'Casual Hoodie',
                'description' => 'Comfortable casual hoodie perfect for everyday wear.',
                'brand' => 'ComfortWear',
                'category' => 'Jackets',
                'image_url' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400',
                'features' => ['Cotton Blend', 'Kangaroo Pocket', 'Drawstring Hood', 'Comfortable'],
                'meta_title' => 'Casual Hoodie - Comfortable Everyday Wear',
                'meta_description' => 'Comfortable casual hoodie perfect for everyday wear.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Gray', 'Navy', 'Black'], ['S', 'M', 'L', 'XL'], 'CHD', 30.00, 59.99, 2200),
            ],
            [
                'name' => 'Denim Jacket',
                'description' => 'Classic denim jacket with timeless appeal and durability.',
                'brand' => 'Levi\'s',
                'category' => 'Jackets',
                'image_url' => 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=400',
                'features' => ['Classic Denim', 'Timeless Design', 'Durable', 'Versatile'],
                'meta_title' => 'Denim Jacket - Classic Style',
                'meta_description' => 'Classic denim jacket with timeless appeal.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Blue', 'Black', 'Gray'], ['S', 'M', 'L'], 'DNJ', 45.00, 89.99, 1400),
            ],
            [
                'name' => 'Bomber Jacket',
                'description' => 'Stylish bomber jacket with modern design and comfort.',
                'brand' => 'Alpha Industries',
                'category' => 'Jackets',
                'image_url' => 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
                'features' => ['Bomber Style', 'Comfortable', 'Modern Design', 'Versatile'],
                'meta_title' => 'Bomber Jacket - Modern Style',
                'meta_description' => 'Stylish bomber jacket with modern design.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Black', 'Olive', 'Navy'], ['S', 'M', 'L', 'XL'], 'BMJ', 55.00, 109.99, 1000),
            ],
            [
                'name' => 'Leather Jacket',
                'description' => 'Premium leather jacket with classic styling and durability.',
                'brand' => 'Schott NYC',
                'category' => 'Jackets',
                'image_url' => 'https://images.unsplash.com/photo-1521223890158-4c3f06c31948?w=400',
                'features' => ['Premium Leather', 'Classic Design', 'Durable', 'Stylish'],
                'meta_title' => 'Leather Jacket - Premium Quality',
                'meta_description' => 'Premium leather jacket with classic styling.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Black', 'Brown'], ['S', 'M', 'L'], 'LTJ', 120.00, 249.99, 500),
            ],
            [
                'name' => 'Windbreaker Jacket',
                'description' => 'Lightweight windbreaker perfect for outdoor activities.',
                'brand' => 'Columbia',
                'category' => 'Jackets',
                'image_url' => 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
                'features' => ['Lightweight', 'Windproof', 'Water Resistant', 'Comfortable'],
                'meta_title' => 'Windbreaker Jacket - Outdoor Ready',
                'meta_description' => 'Lightweight windbreaker for outdoor activities.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Blue', 'Red', 'Yellow'], ['S', 'M', 'L'], 'WBJ', 35.00, 69.99, 1800),
            ],

            // Hats (10 products)
            [
                'name' => 'Baseball Cap',
                'description' => 'Classic baseball cap with embroidered logo.',
                'brand' => 'CapStyle',
                'category' => 'Hats',
                'image_url' => 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400',
                'features' => ['Adjustable Strap', 'Embroidered Logo', 'Classic Fit', 'Versatile'],
                'meta_title' => 'Baseball Cap - Classic Style',
                'meta_description' => 'Classic baseball cap with embroidered logo.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Red', 'Blue', 'Black'], [null], 'BBC', 12.00, 24.99, 3000),
            ],
            [
                'name' => 'Beanie Hat',
                'description' => 'Warm beanie hat perfect for cold weather.',
                'brand' => 'WinterWear',
                'category' => 'Hats',
                'image_url' => 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400',
                'features' => ['Warm', 'Comfortable', 'Stretchy', 'Versatile'],
                'meta_title' => 'Beanie Hat - Warm Comfort',
                'meta_description' => 'Warm beanie hat for cold weather.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Gray', 'Black', 'Navy'], [null], 'BNH', 8.00, 19.99, 2500),
            ],
            [
                'name' => 'Fedora Hat',
                'description' => 'Stylish fedora hat with classic design.',
                'brand' => 'HatCo',
                'category' => 'Hats',
                'image_url' => 'https://images.unsplash.com/photo-1556306535-38febf6782e7?w=400',
                'features' => ['Classic Design', 'Stylish', 'Versatile', 'Durable'],
                'meta_title' => 'Fedora Hat - Classic Style',
                'meta_description' => 'Stylish fedora hat with classic design.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Brown', 'Black', 'Gray'], [null], 'FDH', 25.00, 49.99, 1200),
            ],
            [
                'name' => 'Bucket Hat',
                'description' => 'Casual bucket hat perfect for outdoor activities.',
                'brand' => 'OutdoorGear',
                'category' => 'Hats',
                'image_url' => 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400',
                'features' => ['Casual Design', 'Outdoor Ready', 'Comfortable', 'Versatile'],
                'meta_title' => 'Bucket Hat - Casual Style',
                'meta_description' => 'Casual bucket hat for outdoor activities.',
                'is_active' => true,
                'variants' => $this->generateVariants(['Olive', 'Navy', 'Black'], [null], 'BKH', 15.00, 29.99, 2000),
            ],
            [
                'name' => 'Visor Cap',
                'description' => 'Sporty visor cap perfect for athletic activities.',
                'brand' => 'SportMax',
                'category' => 'Hats',
                'image_url' => 'https://images.unsplash.com/photo-1521223890158-4c3f06c31948?w=400',
                'features' => ['Sporty Design', 'Athletic', 'Comfortable', 'Breathable'],
                'meta_title' => 'Visor Cap - Sporty Style',
                'meta_description' => 'Sporty visor cap for athletic activities.',
                'is_active' => true,
                'variants' => $this->generateVariants(['White', 'Black', 'Red'], [null], 'VSC', 10.00, 24.99, 1800),
            ],
        ];

        // Create 50 products by duplicating and varying the base products
        $allProducts = [];
        for ($i = 0; $i < 50; $i++) {
            $baseProduct = $products[$i % count($products)];
            $product = $baseProduct;

            // Vary the product slightly
            $product['name'] = $this->varyProductName($baseProduct['name'], $i);
            $product['brand'] = $brands[$i % count($brands)];
            $product['category'] = $categories[$i % count($categories)];
            $product['description'] = $this->varyDescription($baseProduct['description'], $i);

            // Adjust pricing based on brand and category
            $priceMultiplier = $this->getPriceMultiplier($product['brand'], $product['category']);
            $product['variants'] = $this->adjustVariantPricing($baseProduct['variants'], $priceMultiplier);

            $allProducts[] = $product;
        }

        // Create the products
        foreach ($allProducts as $productData) {
            $variants = $productData['variants'];
            unset($productData['variants']);

            $product = Product::create($productData);

            foreach ($variants as $variantData) {
                $product->variants()->create($variantData);
            }
        }
    }

    /**
     * Generate variants for a product
     */
    private function generateVariants(array $colors, array $sizes, string $skuPrefix, float $costPrice, float $sellingPrice, int $baseQuantity): array
    {
        $variants = [];
        foreach ($colors as $color) {
            foreach ($sizes as $size) {
                $sku = $skuPrefix . '-' . strtoupper(substr($color, 0, 3)) . '-' . ($size ?? 'ONE');
                $variants[] = [
                    'color' => $color,
                    'size' => $size,
                    'sku' => $sku,
                    'quantity' => $baseQuantity + rand(-5, 10),
                    'cost_price' => $costPrice,
                    'selling_price' => $sellingPrice,
                    'discount_price' => rand(0, 10) > 7 ? $sellingPrice * 0.8 : null,
                    'image_url' => null,
                    'is_active' => true,
                    'low_stock_threshold' => max(5, intval($baseQuantity * 0.2)),
                ];
            }
        }
        return $variants;
    }

    /**
     * Vary product name to create unique products
     */
    private function varyProductName(string $baseName, int $index): string
    {
        $suffixes = ['Pro', 'Elite', 'Premium', 'Classic', 'Modern', 'Sport', 'Casual', 'Urban', 'Vintage', 'Contemporary'];
        $prefixes = ['New', 'Advanced', 'Enhanced', 'Superior', 'Deluxe', 'Professional', 'Standard', 'Basic', 'Essential', 'Core'];

        if ($index < 10) {
            return $baseName;
        }

        $suffix = $suffixes[$index % count($suffixes)];
        $prefix = $prefixes[$index % count($prefixes)];

        return rand(0, 1) ? "$prefix $baseName" : "$baseName $suffix";
    }

    /**
     * Vary product description
     */
    private function varyDescription(string $baseDescription, int $index): string
    {
        if ($index < 10) {
            return $baseDescription;
        }

        $variations = [
            'Enhanced version with improved features.',
            'Updated design with modern styling.',
            'Premium quality with superior comfort.',
            'Classic design with contemporary appeal.',
            'Professional grade with excellent durability.',
        ];

        return $baseDescription . ' ' . $variations[$index % count($variations)];
    }

    /**
     * Get price multiplier based on brand and category
     */
    private function getPriceMultiplier(string $brand, string $category): float
    {
        $brandMultipliers = [
            'Nike' => 1.2,
            'Adidas' => 1.15,
            'Levi\'s' => 1.1,
            'Calvin Klein' => 1.3,
            'Ralph Lauren' => 1.25,
            'Tommy Hilfiger' => 1.2,
            'Gap' => 1.0,
            'H&M' => 0.9,
            'Zara' => 1.05,
            'Uniqlo' => 0.95
        ];

        $categoryMultipliers = [
            'Shoes' => 1.3,
            'Jackets' => 1.2,
            'Pants' => 1.1,
            'T-Shirts' => 0.9,
            'Hats' => 0.8,
            'Dresses' => 1.15,
            'Shirts' => 1.05
        ];

        $brandMultiplier = $brandMultipliers[$brand] ?? 1.0;
        $categoryMultiplier = $categoryMultipliers[$category] ?? 1.0;

        return $brandMultiplier * $categoryMultiplier;
    }

    /**
     * Adjust variant pricing based on multiplier
     */
    private function adjustVariantPricing(array $variants, float $multiplier): array
    {
        return array_map(function ($variant) use ($multiplier) {
            $variant['cost_price'] = round($variant['cost_price'] * $multiplier, 2);
            $variant['selling_price'] = round($variant['selling_price'] * $multiplier, 2);
            if ($variant['discount_price']) {
                $variant['discount_price'] = round($variant['discount_price'] * $multiplier, 2);
            }
            return $variant;
        }, $variants);
    }
}
