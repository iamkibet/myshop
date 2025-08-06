<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Create a new notification
     */
    public function create(array $data): Notification
    {
        return Notification::create([
            'user_id' => \Illuminate\Support\Facades\Auth::id(),
            'type' => $data['type'],
            'title' => $data['title'],
            'description' => $data['message'],
            'icon' => $data['icon'] ?? null,
            'action_data' => $data['action'] ?? null,
            'category' => $data['category'],
            'metadata' => $data['metadata'] ?? null,
        ]);
    }

    /**
     * Create inventory alert notifications
     */
    public function createInventoryAlerts(): void
    {
        // Only create notifications for actual inventory changes
        // This will be called when restock happens or inventory changes
    }

    /**
     * Create notification for new sale
     */
    public function createSaleNotification(\App\Models\Sale $sale): void
    {
        $this->create([
            'type' => 'success',
            'title' => 'New Sale Completed',
            'message' => "Sale #{$sale->id} completed for $" . number_format($sale->total_amount, 2),
            'icon' => 'trending-up',
            'category' => 'sales',
            'action' => [
                'type' => 'sale',
                'id' => $sale->id,
                'url' => "/receipts/{$sale->id}",
            ],
            'metadata' => [
                'sale_id' => $sale->id,
                'total_amount' => $sale->total_amount,
                'items_count' => $sale->saleItems->count(),
            ],
        ]);
    }

    /**
     * Create notification for restock
     */
    public function createRestockNotification(array $restockedItems): void
    {
        $itemCount = count($restockedItems);
        $this->create([
            'type' => 'success',
            'title' => 'Inventory Restocked',
            'message' => "Successfully restocked {$itemCount} product" . ($itemCount > 1 ? 's' : ''),
            'icon' => 'package',
            'category' => 'inventory',
            'action' => [
                'type' => 'inventory',
                'url' => '/admin-dashboard?tab=inventory',
            ],
            'metadata' => [
                'restocked_items' => $restockedItems,
                'item_count' => $itemCount,
            ],
        ]);
    }

    /**
     * Create notification for low stock
     */
    public function createLowStockNotification(\App\Models\ProductVariant $variant): void
    {
        $this->create([
            'type' => 'warning',
            'title' => 'Low Stock Alert',
            'message' => "{$variant->product->name} ({$variant->getVariantName()}) is running low on stock ({$variant->quantity} remaining)",
            'icon' => 'alert-triangle',
            'category' => 'inventory',
            'action' => [
                'type' => 'low_stock',
                'product_id' => $variant->product_id,
                'variant_id' => $variant->id,
            ],
            'metadata' => [
                'product_id' => $variant->product_id,
                'variant_id' => $variant->id,
                'current_quantity' => $variant->quantity,
            ],
        ]);
    }

    /**
     * Create notification for out of stock
     */
    public function createOutOfStockNotification(\App\Models\ProductVariant $variant): void
    {
        $this->create([
            'type' => 'error',
            'title' => 'Out of Stock Alert',
            'message' => "{$variant->product->name} ({$variant->getVariantName()}) is out of stock",
            'icon' => 'x-circle',
            'category' => 'inventory',
            'action' => [
                'type' => 'out_of_stock',
                'product_id' => $variant->product_id,
                'product_name' => $variant->product->name,
                'variant_id' => $variant->id,
            ],
            'metadata' => [
                'product_id' => $variant->product_id,
                'variant_id' => $variant->id,
                'current_quantity' => 0,
            ],
        ]);
    }

    /**
     * Create sales notifications
     */
    public function createSalesNotifications(): void
    {
        // Recent sales notification
        $recentSales = \App\Models\Sale::where('created_at', '>=', now()->subHours(1))->count();

        if ($recentSales > 0) {
            $this->create([
                'type' => 'success',
                'title' => 'Recent Sales',
                'message' => "{$recentSales} new sales in the last hour",
                'icon' => 'trending-up',
                'category' => 'sales',
                'action' => [
                    'type' => 'sale',
                    'url' => '/sales',
                ],
                'metadata' => [
                    'sales_count' => $recentSales,
                    'time_period' => '1 hour',
                ],
            ]);
        }

        // Sales spike detection
        $todaySales = \App\Models\Sale::whereDate('created_at', today())->sum('total_amount');
        $yesterdaySales = \App\Models\Sale::whereDate('created_at', today()->subDay())->sum('total_amount');

        if ($yesterdaySales > 0) {
            $salesChange = (($todaySales - $yesterdaySales) / $yesterdaySales) * 100;

            if (abs($salesChange) > 50) {
                $this->create([
                    'type' => $salesChange > 0 ? 'success' : 'error',
                    'title' => $salesChange > 0 ? 'Sales Spike' : 'Sales Drop',
                    'message' => "Sales " . ($salesChange > 0 ? 'increased' : 'decreased') . " by " . abs(round($salesChange, 1)) . "% compared to yesterday",
                    'icon' => $salesChange > 0 ? 'trending-up' : 'trending-down',
                    'category' => 'sales',
                    'action' => [
                        'type' => 'sale',
                        'url' => '/sales',
                    ],
                    'metadata' => [
                        'sales_change_percentage' => $salesChange,
                        'today_sales' => $todaySales,
                        'yesterday_sales' => $yesterdaySales,
                    ],
                ]);
            }
        }
    }

    /**
     * Mark notification as read
     */
    public function markAsRead(int $notificationId): bool
    {
        $notification = Notification::find($notificationId);
        return $notification ? $notification->markAsRead() : false;
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(): int
    {
        return Notification::unread()->update([
            'is_read' => true,
            'read_at' => now(),
            'read_by' => \Illuminate\Support\Facades\Auth::id(),
        ]);
    }

    /**
     * Get unread notifications count
     */
    public function getUnreadCount(): int
    {
        return Notification::unread()->count();
    }

    /**
     * Get recent notifications
     */
    public function getRecentNotifications(int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Notification::with('readBy')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get notifications by category
     */
    public function getNotificationsByCategory(string $category, int $limit = 20): \Illuminate\Database\Eloquent\Collection
    {
        return Notification::with('readBy')
            ->where('category', $category)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Clean up old notifications
     */
    public function cleanupOldNotifications(int $days = 30): int
    {
        return Notification::where('created_at', '<', now()->subDays($days))->delete();
    }

    /**
     * Clear all notifications
     */
    public function clearAllNotifications(): void
    {
        Notification::truncate();
    }

    /**
     * Sync notifications with current system state
     */
    public function syncNotifications(): void
    {
        try {
            // Only create notifications for actual events, not duplicates
            // This method is now used for manual sync, not automatic creation
            Log::info('Notifications sync requested - no duplicates created');
        } catch (\Exception $e) {
            Log::error('Failed to sync notifications: ' . $e->getMessage());
        }
    }
}
