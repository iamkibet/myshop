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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('amount', 12, 2);
            $table->enum('category', ['rent', 'utilities', 'inventory', 'maintenance', 'marketing', 'other']);
            $table->date('expense_date');
            $table->foreignId('added_by')->constrained('users')->onDelete('cascade');
            $table->string('receipt_path')->nullable();
            $table->timestamps();

            $table->index('category');
            $table->index('expense_date');
            $table->index('added_by');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
