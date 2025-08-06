<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin Users
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Sarah Johnson',
            'email' => 'sarah@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Michael Chen',
            'email' => 'michael@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        // Create Manager Users
        User::create([
            'name' => 'Manager User',
            'email' => 'manager@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'John Smith',
            'email' => 'john@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Emily Davis',
            'email' => 'emily@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'David Wilson',
            'email' => 'david@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Lisa Brown',
            'email' => 'lisa@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Robert Taylor',
            'email' => 'robert@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'email_verified_at' => now(),
        ]);

        User::create([
            'name' => 'Jennifer Garcia',
            'email' => 'jennifer@myshop.com',
            'password' => Hash::make('password'),
            'role' => 'manager',
            'email_verified_at' => now(),
        ]);
    }
}
