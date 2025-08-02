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
            $table->string('name');
            $table->string('sku')->unique();
            $table->text('description')->nullable();
            $table->string('brand');
            $table->string('category'); // shoes, tshirts, pants, etc.
            $table->decimal('cost_price', 10, 2);
            $table->decimal('msrp', 10, 2);
            $table->integer('quantity_on_hand')->default(0);
            $table->integer('low_stock_threshold')->default(10); // Alert when stock goes below this
            $table->json('images')->nullable(); // Array of image URLs
            $table->json('sizes')->nullable(); // Array of available sizes
            $table->json('colors')->nullable(); // Array of available colors
            $table->boolean('is_active')->default(true);
            $table->timestamps();
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
