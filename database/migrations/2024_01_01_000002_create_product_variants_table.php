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

            // Senior-level indexing and constraints
            $table->unique(['product_id', 'sku'], 'variants_product_sku_unique');
            $table->index(['product_id', 'is_active'], 'variants_product_active_idx');
            $table->index(['quantity', 'is_active'], 'variants_stock_active_idx');
            $table->index(['selling_price', 'is_active'], 'variants_price_active_idx');
            $table->index(['color', 'size'], 'variants_color_size_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
