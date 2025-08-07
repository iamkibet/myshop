<?php

namespace Database\Seeders;

use App\Models\Expense;
use App\Models\User;
use Illuminate\Database\Seeder;

class ExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get admin users
        $admins = User::where('role', 'admin')->get();

        if ($admins->isEmpty()) {
            return;
        }

        $categories = ['rent', 'utilities', 'inventory', 'maintenance', 'marketing', 'other'];
        $expenseTitles = [
            'Monthly Rent',
            'Electricity Bill',
            'Water Bill',
            'Internet Service',
            'Security Service',
            'Cleaning Supplies',
            'Office Supplies',
            'Marketing Materials',
            'Equipment Maintenance',
            'Insurance Premium',
            'License Renewal',
            'Advertising Campaign',
            'Inventory Purchase',
            'Repair Services',
            'Transportation Costs'
        ];

        for ($i = 0; $i < 20; $i++) {
            $admin = $admins->random();
            $category = $categories[array_rand($categories)];
            $title = $expenseTitles[array_rand($expenseTitles)];

            Expense::create([
                'title' => $title,
                'description' => 'Sample expense for testing purposes',
                'amount' => rand(500, 5000),
                'category' => $category,
                'expense_date' => now()->subDays(rand(1, 30)),
                'added_by' => $admin->id,
            ]);
        }
    }
}
