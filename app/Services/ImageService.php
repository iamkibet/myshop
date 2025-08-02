<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageService
{
    private ImageManager $imageManager;

    public function __construct()
    {
        $this->imageManager = new ImageManager(new Driver());
    }

    /**
     * Upload and optimize a single image
     */
    public function uploadImage(UploadedFile $file, string $directory = 'products'): string
    {
        // Validate file
        $this->validateImage($file);

        // Generate unique filename
        $filename = $this->generateFilename($file);

        // Create image instance
        $image = $this->imageManager->read($file);

        // Optimize image
        $optimizedImage = $this->optimizeImage($image);

        // Store optimized image
        $path = $directory . '/' . $filename;
        Storage::disk('public')->put($path, $optimizedImage->encode());

        return Storage::url($path);
    }

    /**
     * Upload multiple images
     */
    public function uploadMultipleImages(array $files, string $directory = 'products'): array
    {
        $urls = [];

        foreach ($files as $file) {
            if ($file instanceof UploadedFile) {
                $urls[] = $this->uploadImage($file, $directory);
            }
        }

        return $urls;
    }

    /**
     * Delete image from storage
     */
    public function deleteImage(string $url): bool
    {
        $path = $this->getPathFromUrl($url);

        if ($path && Storage::disk('public')->exists($path)) {
            return Storage::disk('public')->delete($path);
        }

        return false;
    }

    /**
     * Delete multiple images
     */
    public function deleteMultipleImages(array $urls): void
    {
        foreach ($urls as $url) {
            $this->deleteImage($url);
        }
    }

    /**
     * Validate uploaded image
     */
    private function validateImage(UploadedFile $file): void
    {
        $allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5MB

        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException('Invalid image format. Allowed: JPG, PNG, GIF, WebP');
        }

        if ($file->getSize() > $maxSize) {
            throw new \InvalidArgumentException('Image size too large. Maximum: 5MB');
        }
    }

    /**
     * Generate unique filename
     */
    private function generateFilename(UploadedFile $file): string
    {
        $extension = $file->getClientOriginalExtension();
        $filename = Str::uuid() . '.' . $extension;

        return $filename;
    }

    /**
     * Optimize image for web
     */
    private function optimizeImage($image)
    {
        // Resize if too large (max 1200px width/height)
        $image->scaleDown(1200);

        // Optimize quality
        $image->toJpeg(85); // 85% quality for JPEG

        return $image;
    }

    /**
     * Extract file path from storage URL
     */
    private function getPathFromUrl(string $url): ?string
    {
        $storageUrl = Storage::disk('public')->url('');
        $path = str_replace($storageUrl, '', $url);

        return $path ?: null;
    }

    /**
     * Create thumbnail version
     */
    public function createThumbnail(UploadedFile $file, string $directory = 'products/thumbnails'): string
    {
        $this->validateImage($file);

        $filename = $this->generateFilename($file);
        $image = $this->imageManager->read($file);

        // Create thumbnail (300x300, maintain aspect ratio)
        $thumbnail = $image->scaleDown(300);

        $path = $directory . '/' . $filename;
        Storage::disk('public')->put($path, $thumbnail->encode());

        return Storage::url($path);
    }

    /**
     * Get image dimensions
     */
    public function getImageDimensions(string $url): array
    {
        $path = $this->getPathFromUrl($url);

        if ($path && Storage::disk('public')->exists($path)) {
            $image = $this->imageManager->read(Storage::disk('public')->path($path));
            return [
                'width' => $image->width(),
                'height' => $image->height(),
            ];
        }

        return ['width' => 0, 'height' => 0];
    }
}
