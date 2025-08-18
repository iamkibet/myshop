<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductUpdateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_admin_can_update_product()
    {
        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);
        
        // Create a product
        $product = Product::create([
            'name' => 'Test Product',
            'category' => 'Test Category',
            'description' => 'Test Description',
            'brand' => 'Test Brand',
            'image_url' => 'http://example.com/image.jpg',
            'features' => ['Feature 1', 'Feature 2'],
            'sku' => 'TEST-SKU-001',
            'quantity' => 10,
            'cost_price' => 100.00,
            'selling_price' => 150.00,
            'discount_price' => null,
            'low_stock_threshold' => 5,
            'is_active' => true,
        ]);

        $this->actingAs($admin);

        // Test updating product with new data
        $updateData = [
            'name' => 'Updated Product',
            'category' => 'Updated Category',
            'description' => 'Updated Description',
            'brand' => 'Updated Brand',
            'image_url' => 'http://example.com/updated-image.jpg',
            'features' => json_encode(['Updated Feature 1', 'Updated Feature 2']),
            'sku' => 'UPDATED-SKU-001',
            'quantity' => 20,
            'cost_price' => 200.00,
            'selling_price' => 300.00,
            'discount_price' => 250.00,
            'low_stock_threshold' => 10,
            'is_active' => false,
            '_method' => 'PUT',
        ];

        $response = $this->put("/products/{$product->id}", $updateData);

        $response->assertRedirect(route('products.index'));

        // Verify the product was updated
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product',
            'category' => 'Updated Category',
            'description' => 'Updated Description',
            'brand' => 'Updated Brand',
            'quantity' => 20,
            'cost_price' => 200.00,
            'selling_price' => 300.00,
            'discount_price' => 250.00,
            'low_stock_threshold' => 10,
            'is_active' => false,
        ]);
    }

    public function test_admin_can_update_product_with_image_upload()
    {
        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);
        
        // Create a product
        $product = Product::create([
            'name' => 'Test Product',
            'category' => 'Test Category',
            'description' => 'Test Description',
            'brand' => 'Test Brand',
            'image_url' => 'http://example.com/image.jpg',
            'features' => ['Feature 1'],
            'sku' => 'TEST-SKU-002',
            'quantity' => 10,
            'cost_price' => 100.00,
            'selling_price' => 150.00,
            'low_stock_threshold' => 5,
            'is_active' => true,
        ]);

        $this->actingAs($admin);

        // Create a fake image file
        $image = UploadedFile::fake()->image('product.jpg');

        $updateData = [
            'name' => 'Product with New Image',
            'category' => 'Test Category',
            'description' => 'Test Description',
            'brand' => 'Test Brand',
            'features' => json_encode(['Feature 1']),
            'sku' => 'TEST-SKU-002',
            'quantity' => 15,
            'cost_price' => 120.00,
            'selling_price' => 180.00,
            'low_stock_threshold' => 5,
            'is_active' => true,
            'image' => $image,
            '_method' => 'PUT',
        ];

        $response = $this->put("/products/{$product->id}", $updateData);

        $response->assertRedirect(route('products.index'));

        // Verify the product was updated
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Product with New Image',
            'quantity' => 15,
            'cost_price' => 120.00,
            'selling_price' => 180.00,
        ]);

        // Verify the image was stored
        $updatedProduct = Product::find($product->id);
        $this->assertStringContainsString('/storage/products/', $updatedProduct->image_url);
    }

    public function test_product_update_validation_works()
    {
        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);
        
        // Create a product
        $product = Product::create([
            'name' => 'Test Product',
            'category' => 'Test Category',
            'description' => 'Test Description',
            'brand' => 'Test Brand',
            'image_url' => 'http://example.com/image.jpg',
            'features' => ['Feature 1'],
            'sku' => 'TEST-SKU-003',
            'quantity' => 10,
            'cost_price' => 100.00,
            'selling_price' => 150.00,
            'low_stock_threshold' => 5,
            'is_active' => true,
        ]);

        $this->actingAs($admin);

        // Test with invalid data (missing required fields)
        $invalidData = [
            'name' => '', // Empty name should fail
            'category' => '', // Empty category should fail
            'quantity' => -5, // Negative quantity should fail
            'cost_price' => 'invalid', // Invalid cost price should fail
            'selling_price' => 50, // Selling price less than cost price should fail
            'low_stock_threshold' => -1, // Negative threshold should fail
            '_method' => 'PUT',
        ];

        $response = $this->put("/products/{$product->id}", $invalidData);

        $response->assertSessionHasErrors([
            'name',
            'category',
            'quantity',
            'cost_price',
            'low_stock_threshold',
        ]);

        // Verify the product was NOT updated
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Test Product', // Should remain unchanged
            'quantity' => 10, // Should remain unchanged
        ]);
    }

    public function test_product_update_preserves_existing_image_when_no_new_image()
    {
        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);
        
        // Create a product with existing image
        $product = Product::create([
            'name' => 'Test Product',
            'category' => 'Test Category',
            'description' => 'Test Description',
            'brand' => 'Test Brand',
            'image_url' => 'http://example.com/existing-image.jpg',
            'features' => ['Feature 1'],
            'sku' => 'TEST-SKU-004',
            'quantity' => 10,
            'cost_price' => 100.00,
            'selling_price' => 150.00,
            'low_stock_threshold' => 5,
            'is_active' => true,
        ]);

        $this->actingAs($admin);

        // Update only the name, no image change
        $updateData = [
            'name' => 'Updated Product Name',
            'category' => 'Test Category',
            'description' => 'Test Description',
            'brand' => 'Test Brand',
            'features' => json_encode(['Feature 1']),
            'sku' => 'TEST-SKU-004',
            'quantity' => 10,
            'cost_price' => 100.00,
            'selling_price' => 150.00,
            'low_stock_threshold' => 5,
            'is_active' => true,
            '_method' => 'PUT',
        ];

        $response = $this->put("/products/{$product->id}", $updateData);

        $response->assertRedirect(route('products.index'));

        // Verify the product was updated but image remains the same
        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Updated Product Name',
            'image_url' => 'http://example.com/existing-image.jpg', // Should remain unchanged
        ]);
    }

    public function test_product_update_handles_features_correctly()
    {
        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);
        
        // Create a product
        $product = Product::create([
            'name' => 'Test Product',
            'category' => 'Test Category',
            'description' => 'Test Description',
            'brand' => 'Test Brand',
            'image_url' => 'http://example.com/image.jpg',
            'features' => ['Original Feature'],
            'sku' => 'TEST-SKU-005',
            'quantity' => 10,
            'cost_price' => 100.00,
            'selling_price' => 150.00,
            'low_stock_threshold' => 5,
            'is_active' => true,
        ]);

        $this->actingAs($admin);

        // Update with new features
        $updateData = [
            'name' => 'Test Product',
            'category' => 'Test Category',
            'description' => 'Test Description',
            'brand' => 'Test Brand',
            'features' => json_encode(['New Feature 1', 'New Feature 2', 'New Feature 3']),
            'sku' => 'TEST-SKU-005',
            'quantity' => 10,
            'cost_price' => 100.00,
            'selling_price' => 150.00,
            'low_stock_threshold' => 5,
            'is_active' => true,
            '_method' => 'PUT',
        ];

        $response = $this->put("/products/{$product->id}", $updateData);

        $response->assertRedirect(route('products.index'));

        // Verify the features were updated
        $updatedProduct = Product::find($product->id);
        $this->assertEquals(['New Feature 1', 'New Feature 2', 'New Feature 3'], $updatedProduct->features);
    }
}
