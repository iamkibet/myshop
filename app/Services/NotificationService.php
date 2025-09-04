<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Product;
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
     * Create a new notification for a specific user
     */
    public function createForUser(int $userId, array $data): Notification
    {
        return Notification::create([
            'user_id' => $userId,
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
        \Log::info('NotificationService: Creating sale notifications', [
            'sale_id' => $sale->id,
            'manager_id' => $sale->manager_id,
            'total_amount' => $sale->total_amount
        ]);

        // Get all admin users to notify them about the new sale
        $adminUsers = \App\Models\User::where('role', 'admin')->get();

        \Log::info('NotificationService: Found admin users', [
            'admin_count' => $adminUsers->count(),
            'admin_ids' => $adminUsers->pluck('id')->toArray()
        ]);

        foreach ($adminUsers as $admin) {
            // Check if notification already exists for this sale and admin
            $existingNotification = Notification::where('user_id', $admin->id)
                ->where('category', 'sales')
                ->whereJsonContains('metadata->sale_id', $sale->id)
                ->first();

            if ($existingNotification) {
                \Log::info('NotificationService: Notification already exists, skipping', [
                    'admin_id' => $admin->id,
                    'sale_id' => $sale->id,
                    'existing_notification_id' => $existingNotification->id
                ]);
                continue;
            }

            $notification = $this->createForUser($admin->id, [
                'type' => 'success',
                'title' => 'New Sale Completed',
                'message' => "Sale #{$sale->id} completed by {$sale->manager->name} for Ksh " . number_format($sale->total_amount, 2),
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
                    'manager_name' => $sale->manager->name,
                ],
            ]);

            \Log::info('NotificationService: Created notification for admin', [
                'admin_id' => $admin->id,
                'notification_id' => $notification->id,
                'sale_id' => $sale->id
            ]);
        }
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
    public function createLowStockNotification(Product $product): void
    {
        // Get all admin users to notify them about low stock
        $adminUsers = \App\Models\User::where('role', 'admin')->get();

        foreach ($adminUsers as $admin) {
            $this->createForUser($admin->id, [
                'type' => 'warning',
                'title' => 'Low Stock Alert',
                'message' => "{$product->name} is running low on stock ({$product->quantity} remaining)",
                'icon' => 'alert-triangle',
                'category' => 'inventory',
                'action' => [
                    'type' => 'low_stock',
                    'product_id' => $product->id,
                ],
                'metadata' => [
                    'product_id' => $product->id,
                    'current_quantity' => $product->quantity,
                ],
            ]);
        }
    }

    /**
     * Create notification for out of stock
     */
    public function createOutOfStockNotification(Product $product): void
    {
        // Get all admin users to notify them about out of stock
        $adminUsers = \App\Models\User::where('role', 'admin')->get();

        foreach ($adminUsers as $admin) {
            $this->createForUser($admin->id, [
                'type' => 'error',
                'title' => 'Out of Stock Alert',
                'message' => "{$product->name} is out of stock",
                'icon' => 'x-circle',
                'category' => 'inventory',
                'action' => [
                    'type' => 'out_of_stock',
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                ],
                'metadata' => [
                    'product_id' => $product->id,
                    'current_quantity' => 0,
                ],
            ]);
        }
    }

    /**
     * Create notification for expense that needs approval
     */
    public function createExpenseApprovalNotification(\App\Models\Expense $expense): void
    {
        // Get all admin users to notify them about expense approval needed
        $adminUsers = \App\Models\User::where('role', 'admin')->get();

        foreach ($adminUsers as $admin) {
            $this->createForUser($admin->id, [
                'type' => 'warning',
                'title' => 'Expense Approval Required',
                'message' => "Expense '{$expense->title}' for Ksh " . number_format($expense->amount, 2) . " needs approval",
                'icon' => 'alert-triangle',
                'category' => 'expenses',
                'action' => [
                    'type' => 'expense_approval',
                    'expense_id' => $expense->id,
                    'url' => "/expenses/{$expense->id}",
                ],
                'metadata' => [
                    'expense_id' => $expense->id,
                    'amount' => $expense->amount,
                    'category' => $expense->category,
                    'added_by' => $expense->addedBy->name,
                ],
            ]);
        }
    }

    /**
     * Create notification for expense approval/rejection
     */
    public function createExpenseStatusNotification(\App\Models\Expense $expense, string $status): void
    {
        // Notify the user who submitted the expense
        $this->createForUser($expense->added_by, [
            'type' => $status === 'approved' ? 'success' : 'error',
            'title' => $status === 'approved' ? 'Expense Approved' : 'Expense Rejected',
            'message' => "Your expense '{$expense->title}' for Ksh " . number_format($expense->amount, 2) . " has been {$status}",
            'icon' => $status === 'approved' ? 'check-circle' : 'x-circle',
            'category' => 'expenses',
            'action' => [
                'type' => 'expense_status',
                'expense_id' => $expense->id,
                'url' => "/expenses/{$expense->id}",
            ],
            'metadata' => [
                'expense_id' => $expense->id,
                'amount' => $expense->amount,
                'status' => $status,
                'approved_by' => $expense->approvedBy->name ?? 'System',
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
            ->orderByDesc('created_at')
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
            ->orderByDesc('created_at')
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
