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

            // Senior-level indexing strategy
            $table->index(['is_active', 'category'], 'products_active_category_idx');
            $table->index(['brand', 'is_active'], 'products_brand_active_idx');
            $table->index(['name', 'is_active'], 'products_name_active_idx');
            // Note: fullText index removed for SQLite compatibility in testing
            // $table->fullText(['name', 'description'], 'products_search_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
