<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop all related tables in the correct order
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('product_variants');
        Schema::dropIfExists('products');

        // Create new simplified products table
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->string('category', 100);
            $table->text('description')->nullable();
            $table->string('brand', 100)->nullable();
            $table->string('image_url')->nullable();
            $table->json('features')->nullable();
            $table->string('sku', 100)->unique();
            $table->integer('quantity')->default(0);
            $table->decimal('cost_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('discount_price', 10, 2)->nullable();
            $table->integer('low_stock_threshold')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Senior-level indexing strategy
            $table->index(['category', 'is_active'], 'products_category_active_idx');
            $table->index(['brand', 'is_active'], 'products_brand_active_idx');
            $table->index(['quantity', 'is_active'], 'products_stock_active_idx');
            $table->index(['selling_price', 'is_active'], 'products_price_active_idx');
            $table->index(['name', 'category'], 'products_name_category_idx');
        });

        // Recreate sale_items table with the correct structure for simplified products
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
            
            $table->index(['sale_id', 'product_id']);
            $table->index('sale_id');
            $table->index('product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop new tables
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('products');

        // Recreate old structure
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('brand', 100)->nullable();
            $table->string('category', 100)->nullable();
            $table->string('image_url')->nullable();
            $table->json('features')->nullable();
            $table->string('meta_title', 255)->nullable();
            $table->text('meta_description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'category'], 'products_active_category_idx');
            $table->index(['brand', 'is_active'], 'products_brand_active_idx');
            $table->index(['name', 'is_active'], 'products_name_active_idx');
        });

        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->onDelete('cascade');
            $table->string('color', 50)->nullable();
            $table->string('size', 20)->nullable();
            $table->string('sku', 100);
            $table->integer('quantity')->default(0);
            $table->decimal('cost_price', 10, 2);
            $table->decimal('selling_price', 10, 2);
            $table->decimal('discount_price', 10, 2)->nullable();
            $table->string('image_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('low_stock_threshold')->default(5);
            $table->timestamps();

            $table->unique(['product_id', 'sku'], 'variants_product_sku_unique');
            $table->index(['product_id', 'is_active'], 'variants_product_active_idx');
            $table->index(['quantity', 'is_active'], 'variants_stock_active_idx');
            $table->index(['selling_price', 'is_active'], 'variants_price_active_idx');
            $table->index(['color', 'size'], 'variants_color_size_idx');
        });

        // Recreate old sale_items table structure
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignId('product_variant_id')->constrained('product_variants')->onDelete('cascade');
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_price', 10, 2);
            $table->timestamps();
            
            $table->index(['sale_id', 'product_variant_id']);
        });
    }
};
