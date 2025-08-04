<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ImageUploadTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_upload_image()
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);

        $file = UploadedFile::fake()->image('product.jpg', 100, 100);

        $response = $this->actingAs($admin)
            ->post('/upload-image', [
                'image' => $file,
            ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);

        $this->assertStringContainsString('/storage/products/', $response->json('url'));
    }

    public function test_upload_rejects_invalid_file()
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);

        $file = UploadedFile::fake()->create('document.pdf', 100);

        $response = $this->actingAs($admin)
            ->post('/upload-image', [
                'image' => $file,
            ]);

        $response->assertStatus(302); // Redirect due to validation failure
        $response->assertSessionHasErrors(['image']);
    }

    public function test_upload_rejects_large_file()
    {
        Storage::fake('public');

        $admin = User::factory()->create(['role' => 'admin']);

        $file = UploadedFile::fake()->image('large.jpg')->size(6000); // 6MB

        $response = $this->actingAs($admin)
            ->post('/upload-image', [
                'image' => $file,
            ]);

        $response->assertStatus(302); // Redirect due to validation failure
        $response->assertSessionHasErrors(['image']);
    }

    public function test_non_admin_cannot_upload_image()
    {
        $user = User::factory()->create(['role' => 'manager']);

        $file = UploadedFile::fake()->image('product.jpg');

        $response = $this->actingAs($user)
            ->post('/upload-image', [
                'image' => $file,
            ]);

        $response->assertStatus(403);
    }
}
